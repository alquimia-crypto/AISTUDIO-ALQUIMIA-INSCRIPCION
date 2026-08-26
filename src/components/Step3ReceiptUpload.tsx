import React, { useState } from 'react';
import { AlumnaNivel, SedeHorario, SelectedPlanInfo } from '../types';
import { submitRegistrationApi, formatFriendlyTime } from '../services/api';
import { DEFAULT_BANK_DETAILS, getScheduleDurationHours } from '../utils/pricing';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Image as ImageIcon,
  Trash2,
  Sparkles,
  CalendarDays,
  Clock
} from 'lucide-react';

interface Step3Props {
  student: AlumnaNivel;
  schedule?: SedeHorario;
  planInfo?: SelectedPlanInfo;
  onBack: () => void;
  onSuccess: (idRegistro: string, driveUrl: string) => void;
}

export const Step3ReceiptUpload: React.FC<Step3Props> = ({
  student,
  schedule,
  planInfo,
  onBack,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determinar sede, horarios y precio
  const sedeName = planInfo ? planInfo.sede : (schedule?.Sede || 'Sede Principal');
  const monthlyHours = planInfo ? planInfo.totalMonthlyHours : 8;
  const totalPrice = planInfo ? planInfo.monthlyPrice : 75;
  const schedulesList = planInfo?.schedules && planInfo.schedules.length > 0 
    ? planInfo.schedules 
    : (schedule ? [schedule] : []);

  const formattedHorariosText = schedulesList.map((s) => `${s.Dia} (${formatFriendlyTime(s.Horario)})`).join(', ');
  const scheduleIds = schedulesList.map((s) => s.ID_Horario).join(',');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = async (selected: File) => {
    const rawName = selected.name.toLowerCase();

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const hasValidExtension = allowedExtensions.some((ext) => rawName.endsWith(ext));

    if (selected.type === 'image/svg+xml' || rawName.endsWith('.svg')) {
      setErrorMsg('Por seguridad no se admiten archivos SVG. Por favor sube una foto en formato JPG, PNG, WEBP o documento PDF.');
      setFile(null);
      setFileBase64(null);
      return;
    }

    if (!hasValidExtension) {
      setErrorMsg('Formato no válido. El comprobante debe ser una imagen (JPG, JPEG, PNG, WEBP) o un documento PDF.');
      setFile(null);
      setFileBase64(null);
      return;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (selected.size > MAX_SIZE_BYTES) {
      setErrorMsg('El archivo excede el tamaño máximo permitido de 5MB. Por favor selecciona un archivo más ligero.');
      setFile(null);
      setFileBase64(null);
      return;
    }

    try {
      const buffer = await selected.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
      const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; // JPEG
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47; // .PNG
      const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46; // RIFF (WEBP)

      if (!isPdf && !isJpg && !isPng && !isWebp) {
        setErrorMsg('El contenido del archivo no coincide con una imagen válida (JPG, PNG, WEBP) o PDF.');
        setFile(null);
        setFileBase64(null);
        return;
      }
    } catch {
      // Fallback
    }
    
    setErrorMsg(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo. Intenta con otra imagen o PDF.');
      setFile(null);
      setFileBase64(null);
    };
    reader.readAsDataURL(selected);
  };

  const removeFile = () => {
    setFile(null);
    setFileBase64(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) {
      setErrorMsg('Por favor adjunta la foto o PDF del comprobante de transferencia bancaria.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Debes confirmar que los datos de transferencia y horarios seleccionados son correctos.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    // Protección anti-abuso / Rate limiting en cliente (1 envío cada 15 segundos)
    const lastSubmitTimeKey = `last_submit_${student.ID_Cliente}`;
    const lastSubmitTime = localStorage.getItem(lastSubmitTimeKey);
    const now = Date.now();
    if (lastSubmitTime && now - Number(lastSubmitTime) < 15000) {
      const waitSeconds = Math.ceil((15000 - (now - Number(lastSubmitTime))) / 1000);
      setErrorMsg(`Por favor espera ${waitSeconds} segundos antes de volver a enviar un comprobante.`);
      setSubmitting(false);
      return;
    }

    try {
      const fullHorarioDescription = `${formattedHorariosText} (${monthlyHours}h/mes - $${totalPrice})`;
      const res = await submitRegistrationApi({
        idCliente: student.ID_Cliente,
        nombreAlumna: student.Nombre_Alumna,
        sede: sedeName,
        horarioSeleccionado: fullHorarioDescription,
        idHorario: scheduleIds,
        fileBase64: fileBase64,
        fileName: file.name,
        fileMimeType: file.type
      });

      if (res.success && res.ID_Registro) {
        localStorage.setItem(lastSubmitTimeKey, String(Date.now()));
        onSuccess(res.ID_Registro, res.URL_Comprobante_Drive || '');
      } else {
        setErrorMsg(res.message || 'Error al procesar el envío del comprobante.');
      }
    } catch (err: any) {
      setErrorMsg('Error de red al enviar solicitud. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Step Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-xs">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paso 3 de 3 ・ Carga de Comprobante de Pago</span>
          </span>
          <button
            onClick={onBack}
            className="text-xs text-purple-200 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modificar Horarios</span>
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Comprobante de Transferencia Bancaria</h2>
        <p className="text-purple-200 text-sm mt-1">
          Verifica los datos de pago, realiza tu transferencia bancaria y adjunta el comprobante para asegurar tu cupo.
        </p>
      </div>

      {/* Selected Summary Card */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50/60 border-2 border-purple-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-purple-700" />
            <span>Resumen de la Inscripción a Confirmar</span>
          </h4>
          <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-full">
            Total a Pagar: ${totalPrice}.00 USD
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-sm">
          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
            <span className="text-[11px] text-slate-500 block font-semibold uppercase">Alumna</span>
            <span className="font-bold text-slate-900 text-base">{student.Nombre_Alumna}</span>
            <span className="text-xs text-purple-700 block font-medium">Nivel: {student.Nivel_Asignado}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
            <span className="text-[11px] text-slate-500 block font-semibold uppercase">Sede de Entrenamiento</span>
            <span className="font-bold text-slate-900 text-base">{sedeName}</span>
            <span className="text-xs text-slate-500 block font-medium">
              {schedulesList.length} día/s seleccionado/s
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs space-y-1">
            <span className="text-[11px] text-slate-500 block font-semibold uppercase">Plan & Horas al Mes</span>
            <span className="font-extrabold text-purple-900 text-base">{monthlyHours} Horas al Mes</span>
            <span className="text-xs font-bold text-emerald-600 block">
              ${totalPrice}.00 USD {monthlyHours === 12 && '⭐ Plan Más Elegido'}
            </span>
          </div>
        </div>

        {/* Días y Horarios Detallados */}
        <div className="bg-white/80 p-3.5 rounded-2xl border border-purple-100 text-xs space-y-2">
          <span className="font-bold text-purple-900 block flex items-center space-x-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
            <span>Horarios y Días Reservados:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {schedulesList.map((item, idx) => (
              <span key={idx} className="bg-purple-100 text-purple-900 px-3 py-1 rounded-xl font-semibold flex items-center space-x-1.5">
                <span>{item.Dia}</span>
                <span className="text-purple-400">•</span>
                <span>{formatFriendlyTime(item.Horario)}</span>
                {item.Salon && (
                  <>
                    <span className="text-purple-400">•</span>
                    <span className="text-indigo-800 font-bold bg-white/70 px-1.5 py-0.2 rounded text-[10px]">{item.Salon}</span>
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Information Card (Cuentas Bancarias de Alquimia) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-purple-700" />
            <h3 className="font-black text-slate-900 text-lg">Cuentas Bancarias para Realizar el Pago</h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Monto exacto:</span>
            <span className="text-xl font-black text-purple-900">${totalPrice}.00 USD</span>
          </div>
        </div>

        {/* Legal and RUC details */}
        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">Titular / Razón Social:</span>
            <span className="font-bold text-slate-900 text-sm">{DEFAULT_BANK_DETAILS.holder}</span>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">RUC / Identificación:</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-mono font-bold text-slate-900 text-sm">{DEFAULT_BANK_DETAILS.ruc}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.ruc, 'ruc')}
                className="text-[11px] bg-white hover:bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 transition-colors flex items-center space-x-1 cursor-pointer font-semibold"
              >
                {copiedItem === 'ruc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedItem === 'ruc' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block font-medium">Correo para Comprobantes:</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-medium text-slate-800">{DEFAULT_BANK_DETAILS.email}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(DEFAULT_BANK_DETAILS.email, 'email')}
                className="text-[11px] bg-white hover:bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 transition-colors flex items-center space-x-1 cursor-pointer font-semibold"
              >
                {copiedItem === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedItem === 'email' ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bank Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEFAULT_BANK_DETAILS.accounts.map((acc, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200/90 hover:border-purple-300 transition-colors space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">{acc.bank}</span>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                  {acc.type}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-slate-500 block">Número de Cuenta:</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-black text-purple-950 text-xl tracking-wide">{acc.number}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(acc.number, acc.bank)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedItem === acc.bank ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Cuenta</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Receipt Upload Dropzone */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-purple-600" />
              <span>Adjuntar Foto o PDF del Comprobante</span>
            </h3>
            <span className="text-xs text-slate-500">Formatos: JPG, PNG, WEBP, PDF (Máx 5MB)</span>
          </div>

          {/* Drag and Drop Zone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-3xl p-8 text-center transition-all bg-purple-50/30 hover:bg-purple-50/60 cursor-pointer relative"
            >
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    Arrastra aquí tu comprobante o haz clic para seleccionarlo
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Captura de pantalla de la app bancaria o PDF descargado
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                  {file.type === 'application/pdf' ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB ・ Archivo verificado listo para enviar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="text-rose-600 hover:bg-rose-100 p-2 rounded-xl transition-colors cursor-pointer"
                title="Eliminar archivo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Terms & Verification Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 font-medium leading-relaxed">
                Confirmo que he transferido el monto exacto de <strong>${totalPrice}.00 USD</strong> correspondiente al plan de <strong>{monthlyHours} horas al mes</strong> y que los datos ingresados son verídicos.
              </span>
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !file || !termsAccepted}
            className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 hover:from-purple-800 hover:to-slate-950 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-purple-900/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando Inscripción y Guardando Comprobante...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar y Enviar Comprobante (${totalPrice}.00 USD)</span>
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
};
