import React, { useState } from 'react';
import { AlumnaNivel, SedeHorario } from '../types';
import { submitRegistrationApi } from '../services/api';
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
  Trash2
} from 'lucide-react';

interface Step3Props {
  student: AlumnaNivel;
  schedule: SedeHorario;
  onBack: () => void;
  onSuccess: (idRegistro: string, driveUrl: string) => void;
}

export const Step3ReceiptUpload: React.FC<Step3Props> = ({
  student,
  schedule,
  onBack,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const processFile = (selected: File) => {
    // 1. Validar tipo de archivo (imagen o PDF)
    const isImage = selected.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic)$/i.test(selected.name);
    const isPdf = selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setErrorMsg('Formato no válido. El archivo debe ser una imagen (JPG, PNG, WEBP) o un documento PDF.');
      setFile(null);
      setFileBase64(null);
      return;
    }

    // 2. Validar tamaño de archivo (máximo 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (selected.size > MAX_SIZE_BYTES) {
      setErrorMsg('El archivo excede el tamaño máximo permitido de 5MB. Por favor selecciona un archivo más pequeño.');
      setFile(null);
      setFileBase64(null);
      return;
    }
    
    setErrorMsg(null);
    setFile(selected);

    // 3. Convertir a Base64 solo tras pasar validaciones
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

  const copyAccountNum = () => {
    navigator.clipboard.writeText('2100238491');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) {
      setErrorMsg('Por favor adjunta la imagen o PDF del comprobante de transferencia.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Debes confirmar que los datos y comprobante adjunto son correctos.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await submitRegistrationApi({
        idCliente: student.ID_Cliente,
        nombreAlumna: student.Nombre_Alumna,
        sede: schedule.Sede,
        horarioSeleccionado: `${schedule.Dia} | ${schedule.Horario}`,
        idHorario: schedule.ID_Horario,
        fileBase64: fileBase64,
        fileName: file.name,
        fileMimeType: file.type
      });

      if (res.success && res.ID_Registro) {
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
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center space-x-1.5 bg-purple-500/30 text-purple-200 text-xs px-3 py-1 rounded-full font-medium backdrop-blur-xs">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paso 3 de 3 ・ Carga de Comprobante</span>
          </span>
          <button
            onClick={onBack}
            className="text-xs text-purple-200 hover:text-white flex items-center space-x-1 transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cambiar Horario</span>
          </button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Carga de Comprobante y Registro</h2>
        <p className="text-purple-200 text-sm mt-1">
          Adjunta el comprobante de transferencia bancaria para guardar tu reserva en revisión de tesorería.
        </p>
      </div>

      {/* Selected Summary Card */}
      <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Resumen de la Reserva a Confirmar</span>
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-white p-3 rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 block font-medium">Alumna</span>
            <span className="font-bold text-slate-900">{student.Nombre_Alumna}</span>
            <span className="text-xs text-purple-700 block font-medium mt-0.5">Nivel: {student.Nivel_Asignado}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 block font-medium">Sede Seleccionada</span>
            <span className="font-bold text-slate-900">{schedule.Sede}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-purple-100">
            <span className="text-xs text-slate-500 block font-medium">Horario Reservado</span>
            <span className="font-bold text-slate-900">{schedule.Dia}</span>
            <span className="text-xs text-slate-600 block">{schedule.Horario}</span>
          </div>
        </div>
      </div>

      {/* Payment Information Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Building2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-base">Datos Bancarios para Transferencia</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-xs text-slate-500 block">Banco:</span>
            <span className="font-bold text-slate-900">Banco Pichincha (Cuenta Corriente)</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Titular de la Cuenta:</span>
            <span className="font-bold text-slate-900">Academia Danza & Artes S.A.S.</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">RUC / Cédula:</span>
            <span className="font-semibold text-slate-900">1792837492001</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Número de Cuenta:</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-mono font-bold text-purple-900 text-base">2100238491</span>
              <button
                type="button"
                onClick={copyAccountNum}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 cursor-pointer font-medium"
              >
                {copiedAccount ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Upload Dropzone */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-purple-600" />
            <span>Comprobante de Pago (Imagen o PDF)</span>
          </h3>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 rounded-2xl p-8 text-center transition-all space-y-3 cursor-pointer"
            >
              <input
                type="file"
                id="receiptFile"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receiptFile" className="cursor-pointer block space-y-3">
                <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Haz clic aquí para seleccionar el archivo o arrástralo
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Soporta formatos JPG, PNG, WEBP o PDF (Máximo 5MB)
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 overflow-hidden">
                {file.type.includes('image') && fileBase64 ? (
                  <img
                    src={fileBase64}
                    alt="Preview comprobante"
                    className="w-14 h-14 object-cover rounded-xl border border-purple-200 shadow-xs flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-purple-200 text-purple-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold text-slate-900 text-sm truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Archivo PDF'}
                  </p>
                  <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-medium mt-0.5">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Listo para subir a Google Drive</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
                title="Eliminar y cambiar archivo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Terms checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Declaro que la información ingresada y el comprobante de transferencia adjunto corresponden al pago de la inscripción oficial para el periodo activo.
              </span>
            </label>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Horarios</span>
          </button>

          <button
            type="submit"
            disabled={submitting || !file || !termsAccepted}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-purple-200 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando a Google Drive y Sheets...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar y Registrar Reserva</span>
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
};
