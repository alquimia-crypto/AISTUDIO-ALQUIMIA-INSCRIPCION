import { SedeHorario, SelectedPlanInfo, BankAccountInfo } from '../types';

export const DEFAULT_BANK_DETAILS = {
  holder: 'ALQUIMIACORP S.A.S.',
  ruc: '1793208854001',
  email: 'alquimiada0@gmail.com',
  whatsapp: '0983944951',
  accounts: [
    {
      bank: 'Banco Pichincha',
      type: 'Cuenta Corriente',
      number: '2100341800'
    },
    {
      bank: 'Produbanco',
      type: 'Cuenta Corriente',
      number: '27059037569'
    }
  ]
};

export interface PlanTier {
  hoursPerMonth: number;
  price: number;
  label: string;
  isPopular?: boolean;
  description: string;
}

export const PRICING_PLANS: PlanTier[] = [
  {
    hoursPerMonth: 8,
    price: 75,
    label: 'Plan 8 Horas (8h/mes)',
    isPopular: false,
    description: '8 horas de entrenamiento al mes ($75.00 USD)'
  },
  {
    hoursPerMonth: 12,
    price: 90,
    label: 'Plan 12 Horas (12h/mes)',
    isPopular: true,
    description: '12 horas al mes ($90.00 USD) ⭐ ¡El Plan Más Elegido!'
  },
  {
    hoursPerMonth: 16,
    price: 120,
    label: 'Plan 16 Horas (16h/mes)',
    description: '16 horas al mes ($120.00 USD) para avance intensivo'
  }
];

/**
 * Calcula la duración en horas según el nivel y rango horario:
 * - Clases de Básico/Principiante: 1.0 hora
 * - Clases de Intermedio/Avanzado: 1.5 horas
 */
export function getScheduleDurationHours(horarioStr?: string, nivelRequerido?: string): number {
  const normLevel = (nivelRequerido || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const isBasic = normLevel.includes('basic') || normLevel.includes('principiante') || normLevel.includes('inicial');
  const isIntermediateOrAdvanced = normLevel.includes('intermedio') || normLevel.includes('avanzado');

  // Si tiene un rango explícito HH:MM - HH:MM
  if (horarioStr) {
    const clean = horarioStr.trim();
    const rangeMatch = clean.match(/(\d{1,2})[:hH](\d{2})\s*(?:-|a|\/)\s*(\d{1,2})[:hH](\d{2})/);
    if (rangeMatch) {
      const startH = parseInt(rangeMatch[1], 10);
      const startM = parseInt(rangeMatch[2], 10);
      const endH = parseInt(rangeMatch[3], 10);
      const endM = parseInt(rangeMatch[4], 10);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (endMinutes > startMinutes) {
        const diffHours = (endMinutes - startMinutes) / 60;
        return Math.round(diffHours * 10) / 10;
      }
    }
  }

  // Regla por defecto según Nivel
  if (isBasic) return 1.0;
  if (isIntermediateOrAdvanced) return 1.5;

  return 1.0;
}

/**
 * Determina cuántos días a la semana representa un registro (ej: "Lunes y Miércoles" -> 2 días)
 */
export function countDaysInSchedule(diaStr: string): number {
  if (!diaStr) return 1;
  const norm = diaStr.toLowerCase();
  if (norm.includes(',') && norm.includes('y')) return 3; // "lunes, miercoles y viernes"
  if (norm.includes(' y ') || norm.includes(' e ') || norm.includes('&') || norm.includes('-')) return 2; // "lunes y miercoles"
  return 1;
}

/**
 * Calcula las horas semanales, mensuales, precio y plan correspondiente para una lista de horarios seleccionados.
 */
export function calculatePlanSummary(sede: string, selectedSchedules: SedeHorario[]): SelectedPlanInfo {
  if (!selectedSchedules || selectedSchedules.length === 0) {
    return {
      sede,
      schedules: [],
      totalWeeklyHours: 0,
      totalMonthlyHours: 0,
      monthlyPrice: 0,
      planName: 'Sin selección',
      isPopular: false
    };
  }

  // Calcular horas semanales acumuladas teniendo en cuenta el nivel y horario
  let totalWeeklyHours = 0;
  selectedSchedules.forEach((sch) => {
    const sessionDuration = getScheduleDurationHours(sch.Horario, sch.Nivel_Requerido);
    const daysInItem = countDaysInSchedule(sch.Dia);
    totalWeeklyHours += sessionDuration * daysInItem;
  });

  // 4 semanas en el mes
  const totalMonthlyHours = Math.round(totalWeeklyHours * 4 * 10) / 10;

  // Determinar precio según las horas mensuales oficiales
  let monthlyPrice = 75;
  let planName = 'Plan Estándar';
  let isPopular = false;

  if (totalMonthlyHours <= 4) {
    monthlyPrice = 60;
    planName = 'Plan 4 Horas (4h/mes)';
  } else if (totalMonthlyHours <= 5) {
    monthlyPrice = 64;
    planName = 'Plan 5 Horas (5h/mes)';
  } else if (totalMonthlyHours <= 6) {
    monthlyPrice = 68;
    planName = 'Plan 6 Horas (6h/mes)';
  } else if (totalMonthlyHours <= 7) {
    monthlyPrice = 70;
    planName = 'Plan 7 Horas (7h/mes)';
  } else if (totalMonthlyHours <= 8) {
    monthlyPrice = 75;
    planName = 'Plan 8 Horas (8h/mes)';
  } else if (totalMonthlyHours <= 12) {
    monthlyPrice = 90;
    planName = 'Plan 12 Horas (12h/mes)';
    isPopular = true;
  } else if (totalMonthlyHours <= 16) {
    monthlyPrice = 120;
    planName = 'Plan 16 Horas (16h/mes)';
  } else {
    // Más de 16 horas
    monthlyPrice = 120 + Math.round((totalMonthlyHours - 16) * 7.5);
    planName = `Plan Especial (${totalMonthlyHours}h/mes)`;
  }

  return {
    sede,
    schedules: selectedSchedules,
    totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
    totalMonthlyHours,
    monthlyPrice,
    planName,
    isPopular
  };
}

/**
 * Genera el enlace directo a WhatsApp para consultas con mensaje predeterminado
 */
export function getWhatsAppUrl(message: string, phone: string = DEFAULT_BANK_DETAILS.whatsapp): string {
  let clean = (phone || '0983944951').replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '593' + clean.slice(1);
  } else if (!clean.startsWith('593')) {
    clean = '593' + clean;
  }
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

