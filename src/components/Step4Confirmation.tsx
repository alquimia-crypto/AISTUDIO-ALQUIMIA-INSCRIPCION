import React from 'react';
import { AlumnaNivel, SedeHorario } from '../types';
import { 
  CheckCircle2, 
  ExternalLink, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Sparkles,
  Download
} from 'lucide-react';

interface Step4Props {
  student: AlumnaNivel;
  schedule: SedeHorario;
  idRegistro: string;
  driveUrl: string;
  onNewRegistration: () => void;
  onGoToStatus: () => void;
}

export const Step4Confirmation: React.FC<Step4Props> = ({
  student,
  schedule,
  idRegistro,
  driveUrl,
  onNewRegistration,
  onGoToStatus
}) => {
  const whatsappMessage = encodeURIComponent(
    `¡Hola Alquimia Danza Aérea! He completado la inscripción de mi alumna ${student.Nombre_Alumna}.\n\n` +
    `📌 Código de Registro: ${idRegistro}\n` +
    `📍 Sede: ${schedule.Sede}\n` +
    `⏰ Horario: ${schedule.Dia} (${schedule.Horario})\n` +
    `👤 Representante: ${student.Nombre_Representante}\n\n` +
    `Quedo atento/a a la confirmación de mi comprobante.`
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Success Card */}
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden space-y-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Animated Check */}
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/30 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>¡Solicitud Registrada Exitosamente!</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Comprobante en Revisión</h2>
          <p className="text-emerald-100 text-sm mt-2 max-w-lg mx-auto">
            Hemos recibido los datos de tu transferencia y el comprobante ha sido registrado de forma segura para validación de tesorería.
          </p>
        </div>

        {/* Voucher Ticket */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-left border border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-xs text-purple-300 uppercase font-semibold">Código de Registro:</span>
              <p className="font-mono text-xl font-bold text-emerald-300 tracking-wider">{idRegistro}</p>
            </div>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs px-3 py-1 rounded-full font-bold flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Estado: Pendiente</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Alumna:</span>
              <span className="font-bold text-white text-base">{student.Nombre_Alumna}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Nivel Asignado:</span>
              <span className="font-semibold text-purple-200">{student.Nivel_Asignado}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Sede:</span>
              <span className="font-semibold text-white">{schedule.Sede}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Horario Reservado:</span>
              <span className="font-semibold text-white">{schedule.Dia} ({schedule.Horario})</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-300 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Comprobante de Pago:</span>
            </span>
            <span className="text-xs text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Adjuntado correctamente</span>
            </span>
          </div>
        </div>

        {/* Next Steps List */}
        <div className="bg-slate-900/60 rounded-2xl p-5 text-left text-xs text-slate-300 space-y-2 border border-white/5">
          <h4 className="font-bold text-white text-sm flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Siguientes pasos automáticos:</span>
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-slate-300">
            <li>Se ha enviado un correo electrónico automático a <strong>{student.Email}</strong> confirmando la recepción.</li>
            <li>Tesorería validará el depósito en las próximas horas.</li>
            <li>Una vez verificado el estado a <strong>"Confirmado"</strong>, recibirás el correo definitivo con las indicaciones de bienvenida e inicio de clases.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/593983944951?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40 cursor-pointer"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Notificar Secretaría por WhatsApp</span>
          </a>

          <button
            onClick={onNewRegistration}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3.5 rounded-xl border border-white/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Inscripción</span>
          </button>
        </div>

      </div>

    </div>
  );
};
