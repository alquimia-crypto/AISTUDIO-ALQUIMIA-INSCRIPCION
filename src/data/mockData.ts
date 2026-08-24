import { AlumnaNivel, SedeHorario, Inscripcion } from '../types';

export const INITIAL_STUDENTS: AlumnaNivel[] = [
  {
    ID_Cliente: '1726354490',
    Nombre_Representante: 'María Elena Torres',
    Telefono_WhatsApp: '+593998765432',
    Email: 'maria.torres@gmail.com',
    Nombre_Alumna: 'Sofia Torres',
    Nivel_Asignado: 'Principiante',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0991234567',
    Nombre_Representante: 'Carlos Andrés Mendoza',
    Telefono_WhatsApp: '+593991234567',
    Email: 'carlos.mendoza@hotmail.com',
    Nombre_Alumna: 'Camila Mendoza',
    Nivel_Asignado: 'Intermedio',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0987654321',
    Nombre_Representante: 'Valeria Benítez',
    Telefono_WhatsApp: '+593987654321',
    Email: 'valeria.b@gmail.com',
    Nombre_Alumna: 'Isabella Benítez',
    Nivel_Asignado: 'Avanzado',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '1718293041',
    Nombre_Representante: 'Andrea Salgado',
    Telefono_WhatsApp: '+593995544332',
    Email: 'andrea.salgado@yahoo.com',
    Nombre_Alumna: 'Martina Salgado',
    Nivel_Asignado: 'Infantil A',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0990001122',
    Nombre_Representante: 'Lucía Morales',
    Telefono_WhatsApp: '+593990001122',
    Email: 'lucia.morales@gmail.com',
    Nombre_Alumna: 'Emma Morales',
    Nivel_Asignado: 'Principiante',
    Estado: 'Inactivo'
  }
];

export const INITIAL_SCHEDULES: SedeHorario[] = [
  {
    ID_Horario: 'HOR-001',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Principiante',
    Dia: 'Lunes y Miércoles',
    Horario: '15:00 - 16:30',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 8,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-002',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Principiante',
    Dia: 'Martes y Jueves',
    Horario: '16:30 - 18:00',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 10,
    Estado_Horario: 'Lleno'
  },
  {
    ID_Horario: 'HOR-003',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Principiante',
    Dia: 'Sábados',
    Horario: '09:00 - 11:00',
    Cupo_Maximo: 15,
    Cupos_Ocupados: 6,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-004',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Intermedio',
    Dia: 'Lunes y Miércoles',
    Horario: '16:30 - 18:00',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 7,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-005',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio',
    Dia: 'Martes y Jueves',
    Horario: '17:00 - 18:30',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 11,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-006',
    Sede: 'Sede Sur',
    Nivel_Requerido: 'Intermedio',
    Dia: 'Sábados',
    Horario: '11:00 - 13:00',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-007',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Avanzado',
    Dia: 'Lunes, Miércoles y Viernes',
    Horario: '18:00 - 20:00',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 5,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-008',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Infantil A',
    Dia: 'Martes y Jueves',
    Horario: '15:00 - 16:15',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 9,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-009',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Infantil A',
    Dia: 'Sábados',
    Horario: '11:15 - 12:30',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 8,
    Estado_Horario: 'Lleno'
  }
];

export const INITIAL_REGISTRATIONS: Inscripcion[] = [
  {
    ID_Registro: 'INS-2026-9812',
    Fecha_Registro: '2026-08-20 14:32:10',
    ID_Cliente: '1726354490',
    Nombre_Alumna: 'Sofia Torres',
    Sede: 'Sede Norte (Principal)',
    Horario_Seleccionado: 'Lunes y Miércoles | 15:00 - 16:30',
    URL_Comprobante_Drive: 'https://drive.google.com/file/d/sample-proof-1/view',
    Estado_Inscripcion: 'Confirmado',
    Notificado_Confirmacion: 'SI'
  },
  {
    ID_Registro: 'INS-2026-9813',
    Fecha_Registro: '2026-08-23 18:15:44',
    ID_Cliente: '0991234567',
    Nombre_Alumna: 'Camila Mendoza',
    Sede: 'Sede Cumbayá',
    Horario_Seleccionado: 'Martes y Jueves | 17:00 - 18:30',
    URL_Comprobante_Drive: 'https://drive.google.com/file/d/sample-proof-2/view',
    Estado_Inscripcion: 'Pendiente',
    Notificado_Confirmacion: 'NO'
  }
];
