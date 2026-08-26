export interface AlumnaNivel {
  ID_Cliente: string;
  Nombre_Representante: string;
  Telefono_WhatsApp: string;
  Email: string;
  Nombre_Alumna: string;
  Nivel_Asignado: string;
  Estado: 'Activo' | 'Inactivo';
}

export interface SedeHorario {
  ID_Horario: string;
  Sede: string;
  Nivel_Requerido: string;
  Dia: string;
  Horario: string;
  Salon?: string;
  Cupo_Maximo: number;
  Cupos_Ocupados: number;
  Estado_Horario: 'Disponible' | 'Lleno';
}

export interface Inscripcion {
  ID_Registro: string;
  Fecha_Registro: string;
  ID_Cliente: string;
  Nombre_Alumna: string;
  Sede: string;
  Horario_Seleccionado: string;
  URL_Comprobante_Drive: string;
  Estado_Inscripcion: 'Pendiente' | 'Confirmado' | 'Rechazado';
  Notificado_Confirmacion: 'SI' | 'NO';
  Comprobante_Nombre?: string;
  Comprobante_Base64?: string;
}

export interface AppSettings {
  gasWebAppUrl: string;
  useMockMode: boolean;
  apiKey?: string;
  adminToken?: string;
  googleSheetUrlOrId?: string;
  lastSyncDate?: string;
  lastSyncSource?: 'sheet_url' | 'apps_script' | 'manual';
  lastSyncCounts?: {
    students: number;
    schedules: number;
    registrations: number;
  };
}

export interface ApiSearchResponse {
  success: boolean;
  message?: string;
  data?: AlumnaNivel;
}

export interface ApiSchedulesResponse {
  success: boolean;
  data?: SedeHorario[];
}

export interface SelectedPlanInfo {
  sede: string;
  schedules: SedeHorario[];
  totalWeeklyHours: number;
  totalMonthlyHours: number;
  monthlyPrice: number;
  planName: string;
  isPopular?: boolean;
}

export interface BankAccountInfo {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  identification: string;
  email: string;
  whatsappNotice: string;
}

export interface WaitingListEntry {
  ID_Espera: string;
  Fecha_Registro: string;
  ID_Cliente: string;
  Nombre_Alumna: string;
  Nombre_Representante: string;
  Email: string;
  Telefono_WhatsApp: string;
  ID_Horario: string;
  Sede: string;
  Dia: string;
  Horario: string;
  Nivel_Requerido: string;
  Salon?: string;
  Estado_Espera: 'Pendiente' | 'Cupo_Liberado' | 'Notificado' | 'Inscrito' | 'Cancelado';
  Notas?: string;
}

export interface ApiRegistrationResponse {
  success: boolean;
  message?: string;
  ID_Registro?: string;
  URL_Comprobante_Drive?: string;
}
