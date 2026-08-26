import { AlumnaNivel, SedeHorario, Inscripcion, WaitingListEntry } from '../types';

export const INITIAL_STUDENTS: AlumnaNivel[] = [
  {
    ID_Cliente: '1799988877',
    Nombre_Representante: 'Alquimia Danza Aérea',
    Telefono_WhatsApp: '+593998877665',
    Email: 'alquimiadanzaaerea@gmail.com',
    Nombre_Alumna: 'Alumna Prueba Alquimia',
    Nivel_Asignado: 'Básico',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '1726354490',
    Nombre_Representante: 'María Elena Torres',
    Telefono_WhatsApp: '+593998765432',
    Email: 'maria.torres@gmail.com',
    Nombre_Alumna: 'Sofia Torres',
    Nivel_Asignado: 'Básico',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0991234567',
    Nombre_Representante: 'Carlos Andrés Mendoza',
    Telefono_WhatsApp: '+593991234567',
    Email: 'carlos.mendoza@hotmail.com',
    Nombre_Alumna: 'Camila Mendoza',
    Nivel_Asignado: 'Intermedio/Avanzado',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0987654321',
    Nombre_Representante: 'Valeria Benítez',
    Telefono_WhatsApp: '+593987654321',
    Email: 'valeria.b@gmail.com',
    Nombre_Alumna: 'Isabella Benítez',
    Nivel_Asignado: 'Intermedio/Avanzado',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '1718293041',
    Nombre_Representante: 'Andrea Salgado',
    Telefono_WhatsApp: '+593995544332',
    Email: 'andrea.salgado@yahoo.com',
    Nombre_Alumna: 'Martina Salgado',
    Nivel_Asignado: 'Básico',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '1720304050',
    Nombre_Representante: 'Paula Rodríguez',
    Telefono_WhatsApp: '+593991122334',
    Email: 'paula.rodriguez@gmail.com',
    Nombre_Alumna: 'Valentina Rodríguez',
    Nivel_Asignado: 'Básico',
    Estado: 'Activo'
  },
  {
    ID_Cliente: '0990001122',
    Nombre_Representante: 'Lucía Morales',
    Telefono_WhatsApp: '+593990001122',
    Email: 'lucia.morales@gmail.com',
    Nombre_Alumna: 'Emma Morales',
    Nivel_Asignado: 'Básico',
    Estado: 'Inactivo'
  }
];

export const INITIAL_SCHEDULES: SedeHorario[] = [
  // ==========================================
  // SEDE CUMBAYÁ - NIVEL BÁSICO (Salón Alquimia - 8 Cupos)
  // Duración: 1 hora
  // ==========================================
  // Lunes Básico
  {
    ID_Horario: 'HOR-CUM-BAS-LUN-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-LUN-1730',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '17:30 - 18:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-LUN-1830',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '18:30 - 19:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 1,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-LUN-1930',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '19:30 - 20:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  },

  // Martes Básico
  {
    ID_Horario: 'HOR-CUM-BAS-MAR-1530',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Martes',
    Horario: '15:30 - 16:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MAR-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Martes',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MAR-1730',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Martes',
    Horario: '17:30 - 18:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 8,
    Estado_Horario: 'Lleno'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MAR-1830',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Martes',
    Horario: '18:30 - 19:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 1,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MAR-1930',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Martes',
    Horario: '19:30 - 20:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  },

  // Miércoles Básico
  {
    ID_Horario: 'HOR-CUM-BAS-MIE-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Miércoles',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MIE-1730',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Miércoles',
    Horario: '17:30 - 18:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MIE-1830',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Miércoles',
    Horario: '18:30 - 19:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 1,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-MIE-1930',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Miércoles',
    Horario: '19:30 - 20:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  },

  // Jueves Básico
  {
    ID_Horario: 'HOR-CUM-BAS-JUE-1530',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Jueves',
    Horario: '15:30 - 16:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-JUE-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Jueves',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-JUE-1730',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Jueves',
    Horario: '17:30 - 18:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-JUE-1830',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Jueves',
    Horario: '18:30 - 19:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-JUE-1930',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Jueves',
    Horario: '19:30 - 20:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 0,
    Estado_Horario: 'Disponible'
  },

  // Viernes Básico
  {
    ID_Horario: 'HOR-CUM-BAS-VIE-1530',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Viernes',
    Horario: '15:30 - 16:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-BAS-VIE-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Viernes',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },

  // Sábado Básico
  {
    ID_Horario: 'HOR-CUM-BAS-SAB-1000',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Básico',
    Dia: 'Sábado',
    Horario: '10:00 - 11:00',
    Salon: 'Salón Alquimia',
    Cupo_Maximo: 8,
    Cupos_Ocupados: 5,
    Estado_Horario: 'Disponible'
  },

  // ==========================================
  // SEDE CUMBAYÁ - INTERMEDIO / AVANZADO (Salón Evolve - 12 Cupos)
  // Duración: 1.5 horas (1 hora y media)
  // ==========================================
  // Lunes Intermedio/Avanzado
  {
    ID_Horario: 'HOR-CUM-INT-LUN-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Lunes',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-INT-LUN-1800',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Lunes',
    Horario: '18:00 - 19:30',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },

  // Martes Intermedio/Avanzado
  {
    ID_Horario: 'HOR-CUM-INT-MAR-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Martes',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 5,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-INT-MAR-1800',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Martes',
    Horario: '18:00 - 19:30',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },

  // Miércoles Intermedio/Avanzado
  {
    ID_Horario: 'HOR-CUM-INT-MIE-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Miércoles',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-INT-MIE-1800',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Miércoles',
    Horario: '18:00 - 19:30',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },

  // Jueves Intermedio/Avanzado
  {
    ID_Horario: 'HOR-CUM-INT-JUE-1630',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Jueves',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 6,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CUM-INT-JUE-1800',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Jueves',
    Horario: '18:00 - 19:30',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 2,
    Estado_Horario: 'Disponible'
  },

  // Sábado Intermedio/Avanzado
  {
    ID_Horario: 'HOR-CUM-INT-SAB-1000',
    Sede: 'Sede Cumbayá',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Sábado',
    Horario: '10:00 - 11:30',
    Salon: 'Salón Evolve',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 5,
    Estado_Horario: 'Disponible'
  },

  // ==========================================
  // OTRAS SEDES (Sede Norte y Sede La Carolina)
  // ==========================================
  {
    ID_Horario: 'HOR-NOR-BAS-001',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Principal',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-NOR-BAS-002',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Básico',
    Dia: 'Miércoles',
    Horario: '16:30 - 17:30',
    Salon: 'Salón Principal',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 5,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-NOR-INT-001',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Martes',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Aéreo 1',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 6,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-NOR-INT-002',
    Sede: 'Sede Norte (Principal)',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Jueves',
    Horario: '16:30 - 18:00',
    Salon: 'Salón Aéreo 1',
    Cupo_Maximo: 12,
    Cupos_Ocupados: 7,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CAR-BAS-001',
    Sede: 'Sede La Carolina',
    Nivel_Requerido: 'Básico',
    Dia: 'Lunes',
    Horario: '17:00 - 18:00',
    Salon: 'Salón Aéreo',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 3,
    Estado_Horario: 'Disponible'
  },
  {
    ID_Horario: 'HOR-CAR-INT-001',
    Sede: 'Sede La Carolina',
    Nivel_Requerido: 'Intermedio/Avanzado',
    Dia: 'Miércoles',
    Horario: '17:00 - 18:30',
    Salon: 'Salón Aéreo',
    Cupo_Maximo: 10,
    Cupos_Ocupados: 4,
    Estado_Horario: 'Disponible'
  }
];

export const INITIAL_REGISTRATIONS: Inscripcion[] = [
  {
    ID_Registro: 'INS-2026-9812',
    Fecha_Registro: '2026-08-20 14:32:10',
    ID_Cliente: '1726354490',
    Nombre_Alumna: 'Sofia Torres',
    Sede: 'Sede Cumbayá',
    Horario_Seleccionado: 'Lunes | 16:30 - 17:30 (Salón Alquimia)',
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
    Horario_Seleccionado: 'Martes | 16:30 - 18:00 (Salón Evolve)',
    URL_Comprobante_Drive: 'https://drive.google.com/file/d/sample-proof-2/view',
    Estado_Inscripcion: 'Pendiente',
    Notificado_Confirmacion: 'NO'
  }
];

export const INITIAL_WAITING_LIST: WaitingListEntry[] = [
  {
    ID_Espera: 'ESP-2026-001',
    Fecha_Registro: '2026-08-24 10:15:30',
    ID_Cliente: '1718293041',
    Nombre_Alumna: 'Martina Salgado',
    Nombre_Representante: 'Andrea Salgado',
    Email: 'andrea.salgado@yahoo.com',
    Telefono_WhatsApp: '+593995544332',
    ID_Horario: 'HOR-CUM-BAS-MAR-1730',
    Sede: 'Sede Cumbayá',
    Dia: 'Martes',
    Horario: '17:30 - 18:30',
    Nivel_Requerido: 'Básico',
    Salon: 'Salón Alquimia',
    Estado_Espera: 'Pendiente',
    Notas: 'Interesada en turno de la tarde los martes'
  }
];
