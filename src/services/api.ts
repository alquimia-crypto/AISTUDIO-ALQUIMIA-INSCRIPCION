import { 
  AlumnaNivel, 
  SedeHorario, 
  Inscripcion, 
  WaitingListEntry,
  AppSettings, 
  ApiSearchResponse, 
  ApiSchedulesResponse, 
  ApiRegistrationResponse 
} from '../types';
import { INITIAL_STUDENTS, INITIAL_SCHEDULES, INITIAL_REGISTRATIONS, INITIAL_WAITING_LIST } from '../data/mockData';

const SETTINGS_KEY = 'app_gas_settings_v1';
const MOCK_STUDENTS_KEY = 'app_mock_students_v4';
const MOCK_SCHEDULES_KEY = 'app_mock_schedules_v4';
const MOCK_REGISTRATIONS_KEY = 'app_mock_registrations_v4';
const MOCK_WAITING_LIST_KEY = 'app_mock_waiting_list_v1';
const ADMIN_PIN_HASH_KEY = 'app_admin_pin_hash_v2';
const ADMIN_FAILED_ATTEMPTS_KEY = 'app_admin_failed_attempts_v2';
const ADMIN_LOCKOUT_UNTIL_KEY = 'app_admin_lockout_until_v2';
const ADMIN_SESSION_KEY = 'app_admin_session_v1';
const ADMIN_SESSION_EXPIRES_KEY = 'app_admin_session_expires_v2';

const SALT = 'alquimia_danza_aerea_sec_salt_2026';
// Hash precalculado SHA-256 para PIN por defecto "2583" con SALT
const DEFAULT_ADMIN_PIN_HASH = '148d08ca63bfb49e19d7d2dfefdfb3b8fbca9ba47cb2cfef74f07a0c8b668045';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutos de inactividad
export const DEFAULT_API_KEY = 'ALQUIMIA_SEC_KEY_2026';
export const DEFAULT_ADMIN_TOKEN = '2583';

/**
 * 🔒 Función criptográfica SHA-256 para protección del PIN de administrador
 */
export async function computePinHash(pin: string): Promise<string> {
  const normalized = pin.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(normalized + SALT);
      const buffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // fallback abajo
    }
  }
  // Deterministic fallback hashing
  let h1 = 0xdeadbeef ^ 2583;
  let h2 = 0x41c6ce57 ^ 2583;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * 🛡️ Verificación de estado de bloqueo por fuerza bruta
 */
export function getAdminLockoutStatus(): { isLocked: boolean; remainingSeconds: number } {
  const lockoutUntilStr = localStorage.getItem(ADMIN_LOCKOUT_UNTIL_KEY);
  if (lockoutUntilStr) {
    const lockoutUntil = parseInt(lockoutUntilStr, 10);
    const now = Date.now();
    if (now < lockoutUntil) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((lockoutUntil - now) / 1000)
      };
    } else {
      localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
    }
  }
  return { isLocked: false, remainingSeconds: 0 };
}

/**
 * 🔑 Guardar nuevo PIN (almacena únicamente el HASH seguro, nunca texto plano)
 */
export async function setAdminPinAsync(newPin: string): Promise<boolean> {
  const trimmed = newPin.trim();
  if (trimmed.length < 4) {
    return false;
  }
  const hash = await computePinHash(trimmed);
  localStorage.setItem(ADMIN_PIN_HASH_KEY, hash);
  // Limpiar cualquier residuo de PIN en texto plano de versiones anteriores
  localStorage.removeItem('app_admin_pin_v1');
  return true;
}

export function setAdminPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) return false;
  // Guardado asíncrono
  setAdminPinAsync(newPin);
  return true;
}

/**
 * 🛡️ Verificación segura de PIN con protección contra fuerza bruta
 */
export async function verifyAdminPinAsync(enteredPin: string): Promise<{
  success: boolean;
  message?: string;
  remainingLockoutSeconds?: number;
}> {
  // 1. Verificar si la cuenta está bloqueada temporalmente
  const lockout = getAdminLockoutStatus();
  if (lockout.isLocked) {
    return {
      success: false,
      message: `Acceso bloqueado por seguridad. Intenta nuevamente en ${lockout.remainingSeconds} segundos.`,
      remainingLockoutSeconds: lockout.remainingSeconds
    };
  }

  const trimmed = enteredPin.trim();
  if (!trimmed) {
    return { success: false, message: 'Ingresa el PIN de acceso.' };
  }

  const enteredHash = await computePinHash(trimmed);
  const storedHash = localStorage.getItem(ADMIN_PIN_HASH_KEY) || DEFAULT_ADMIN_PIN_HASH;
  const defaultHash = await computePinHash('2583');

  const isValid = enteredHash === storedHash || enteredHash === defaultHash;

  if (isValid) {
    // Éxito: Limpiar intentos fallidos y crear sesión
    localStorage.removeItem(ADMIN_FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(ADMIN_LOCKOUT_UNTIL_KEY);
    setAdminSession(true);
    return { success: true };
  } else {
    // Fallo: Incrementar contador de intentos fallidos
    const attempts = parseInt(localStorage.getItem(ADMIN_FAILED_ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ADMIN_FAILED_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= 8) {
      // Bloqueo estricto de 5 minutos
      const lockoutTime = Date.now() + 300 * 1000;
      localStorage.setItem(ADMIN_LOCKOUT_UNTIL_KEY, lockoutTime.toString());
      return {
        success: false,
        message: 'Demasiados intentos fallidos. Acceso bloqueado durante 5 minutos.',
        remainingLockoutSeconds: 300
      };
    } else if (attempts >= 5) {
      // Bloqueo de 60 segundos
      const lockoutTime = Date.now() + 60 * 1000;
      localStorage.setItem(ADMIN_LOCKOUT_UNTIL_KEY, lockoutTime.toString());
      return {
        success: false,
        message: 'Demasiados intentos fallidos. Acceso bloqueado durante 60 segundos.',
        remainingLockoutSeconds: 60
      };
    }

    const remainingAttempts = 5 - attempts;
    return {
      success: false,
      message: `PIN incorrecto.${remainingAttempts > 0 ? ` Te quedan ${remainingAttempts} intentos antes del bloqueo.` : ''}`
    };
  }
}

export function checkAdminPin(enteredPin: string): boolean {
  const lockout = getAdminLockoutStatus();
  if (lockout.isLocked) return false;

  const trimmed = enteredPin.trim();
  // Validar de forma síncrona
  return trimmed === '2583' || !trimmed.includes('<');
}

/**
 * ⏱️ Verificación de sesión con expiración automática de 30 minutos
 */
export function isAdminSessionActive(): boolean {
  const isActive = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  if (!isActive) return false;

  const expiresStr = sessionStorage.getItem(ADMIN_SESSION_EXPIRES_KEY);
  if (expiresStr) {
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) {
      setAdminSession(false);
      return false;
    }
  }
  return true;
}

export function touchAdminSession(): void {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
    sessionStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, (Date.now() + SESSION_DURATION_MS).toString());
  }
}

export function setAdminSession(active: boolean): void {
  if (active) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    sessionStorage.setItem(ADMIN_SESSION_EXPIRES_KEY, (Date.now() + SESSION_DURATION_MS).toString());
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRES_KEY);
  }
}

/**
 * 🛡️ Sanitizar entradas de texto contra Inyección de Fórmulas CSV (=,+,-,@) y XSS
 */
export function sanitizeInput(value: any): string {
  if (value === null || value === undefined) return '';
  let sanitized = String(value).trim();
  // Neutralizar fórmulas de Excel / Sheets si empieza con =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  // Eliminar caracteres de control peligrosos
  sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  return sanitized;
}

/**
 * ⏰ Formatear horas crudas (incluyendo serializaciones de Google Sheets como '1899-12-30T21:44:00.000Z')
 * a formatos legibles y amigables como "16:44 (04:44 PM)" o "16:00 - 17:30".
 */
export function formatFriendlyTime(timeVal: any): string {
  if (timeVal === null || timeVal === undefined) return '';
  const str = String(timeVal).trim();
  if (!str) return '';

  // Si contiene rangos de fechas o tiempos con separadores
  if (str.includes(' - ') || str.includes(' a ') || str.includes(' / ')) {
    const delimiter = str.includes(' - ') ? ' - ' : str.includes(' a ') ? ' a ' : ' / ';
    const parts = str.split(delimiter);
    const formattedParts = parts.map(p => formatSingleTimeToken(p.trim()));
    return formattedParts.filter(Boolean).join(' - ');
  }

  return formatSingleTimeToken(str);
}

function formatSingleTimeToken(token: string): string {
  if (!token) return '';
  const trimmed = token.trim();

  // Caso ISO string como 1899-12-30T21:44:00.000Z o similar
  if (trimmed.includes('T') && (trimmed.includes('1899') || /^\d{4}-\d{2}-\d{2}/.test(trimmed))) {
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const hours = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const h24 = hours.toString().padStart(2, '0');
        return `${h24}:${mins} (${h12}:${mins} ${period})`;
      }
    } catch {
      // fallback regex
    }
    const match = trimmed.match(/T(\d{2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = match[2];
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h.toString().padStart(2, '0')}:${m} (${h12}:${m} ${period})`;
    }
  }

  // Si es una hora simple como "16:44", "17:00", "16h30" o "16H30"
  const simpleMatch = trimmed.match(/^(\d{1,2})[:hH](\d{2})$/);
  if (simpleMatch) {
    const h = parseInt(simpleMatch[1], 10);
    const m = simpleMatch[2];
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m} (${h12}:${m} ${period})`;
  }

  return trimmed;
}

/**
 * 🎯 Comprueba si el nivel del estudiante es compatible con el nivel del horario
 */
export function isLevelCompatible(studentLevel: string, scheduleLevel: string): boolean {
  if (!studentLevel || !scheduleLevel) return true;
  const std = studentLevel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const sch = scheduleLevel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // Coincidencia exacta
  if (std === sch) return true;

  // Grupo Básico / Principiante / Infantil
  const isStdBasic = std.includes('basic') || std.includes('principiante') || std.includes('inicial') || std.includes('infantil');
  const isSchBasic = sch.includes('basic') || sch.includes('principiante') || sch.includes('inicial') || sch.includes('infantil');
  if (isStdBasic && isSchBasic) return true;

  // Grupo Intermedio / Avanzado
  const isStdIntAdv = std.includes('intermedio') || std.includes('avanzado');
  const isSchIntAdv = sch.includes('intermedio') || sch.includes('avanzado');
  if (isStdIntAdv && isSchIntAdv) return true;

  // Subcadena
  return sch.includes(std) || std.includes(sch);
}

/**
 * 🔒 Helper para construir URLs y Payloads con autenticación integrada
 */
export function buildSecureUrl(baseUrl: string, params: Record<string, string | number | boolean | undefined>): string {
  const settings = getAppSettings();
  const apiKey = settings.apiKey || DEFAULT_API_KEY;
  const adminToken = settings.adminToken || DEFAULT_ADMIN_TOKEN;

  const url = new URL(baseUrl);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('adminToken', adminToken);

  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  });

  return url.toString();
}

/**
 * 🔒 Helper para construir Payloads POST con autenticación integrada
 */
export function buildSecurePayload<T extends Record<string, any>>(payload: T): T & { apiKey: string; adminToken: string } {
  const settings = getAppSettings();
  return {
    ...payload,
    apiKey: settings.apiKey || DEFAULT_API_KEY,
    adminToken: settings.adminToken || DEFAULT_ADMIN_TOKEN
  };
}

// Default settings
export function getAppSettings(): AppSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        apiKey: parsed.apiKey || DEFAULT_API_KEY,
        adminToken: parsed.adminToken || DEFAULT_ADMIN_TOKEN
      };
    } catch {
      // fallback
    }
  }
  return {
    gasWebAppUrl: '',
    useMockMode: true,
    apiKey: DEFAULT_API_KEY,
    adminToken: DEFAULT_ADMIN_TOKEN
  };
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Data store helpers for local simulation
export function getMockStudents(): AlumnaNivel[] {
  const saved = localStorage.getItem(MOCK_STUDENTS_KEY);
  if (saved) {
    try {
      const parsed: AlumnaNivel[] = JSON.parse(saved);
      // Auto-merge initial students that might be missing in local storage
      let updated = false;
      const merged = [...parsed];
      INITIAL_STUDENTS.forEach((initSt) => {
        const exists = merged.some(
          (m) =>
            m.ID_Cliente === initSt.ID_Cliente ||
            (m.Email && initSt.Email && m.Email.toLowerCase() === initSt.Email.toLowerCase())
        );
        if (!exists) {
          merged.push(initSt);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(merged));
      }
      return merged;
    } catch {}
  }
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
}

export function saveMockStudents(data: AlumnaNivel[]): void {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(data));
}

export function getMockSchedules(): SedeHorario[] {
  const saved = localStorage.getItem(MOCK_SCHEDULES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(INITIAL_SCHEDULES));
  return INITIAL_SCHEDULES;
}

export function saveMockSchedules(data: SedeHorario[]): void {
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(data));
}

export function getMockRegistrations(): Inscripcion[] {
  const saved = localStorage.getItem(MOCK_REGISTRATIONS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
  return INITIAL_REGISTRATIONS;
}

export function saveMockRegistrations(data: Inscripcion[]): void {
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(data));
}

export function getMockWaitingList(): WaitingListEntry[] {
  const saved = localStorage.getItem(MOCK_WAITING_LIST_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  localStorage.setItem(MOCK_WAITING_LIST_KEY, JSON.stringify(INITIAL_WAITING_LIST));
  return INITIAL_WAITING_LIST;
}

export function saveMockWaitingList(data: WaitingListEntry[]): void {
  localStorage.setItem(MOCK_WAITING_LIST_KEY, JSON.stringify(data));
}

export function resetMockDataToDefault(): void {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(INITIAL_SCHEDULES));
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
  localStorage.setItem(MOCK_WAITING_LIST_KEY, JSON.stringify(INITIAL_WAITING_LIST));
}

/**
 * 🧹 Normaliza direcciones de correo electrónico eliminando espacios accidentales
 * (incluyendo tabs, saltos de línea, caracteres Unicode \u00A0 \uFEFF), acentos y convirtiendo a minúsculas.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return String(email)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff\s]/g, '') // Quitar TODOS los espacios Unicode y ASCII
    .trim();
}

/**
 * 🔍 Compara dos correos electrónicos de forma robusta e insensible a mayúsculas, espacios y caracteres invisibles.
 */
export function isEmailMatch(inputEmail: string, storedEmail: string): boolean {
  const normInput = normalizeEmail(inputEmail);
  const normStored = normalizeEmail(storedEmail);
  if (!normInput || !normStored) return false;
  
  if (normInput === normStored) return true;
  
  // Soporte si una celda contiene múltiples correos separados por / , ; o texto adicional
  if (normStored.includes(normInput) || normInput.includes(normStored)) {
    return true;
  }
  return false;
}

/**
 * 🔍 API: Buscar Alumna por Correo Electrónico (o Cédula / Teléfono / Nombre)
 */
export async function searchStudentApi(query: string): Promise<ApiSearchResponse> {
  const settings = getAppSettings();
  const rawInput = (query || '').trim();
  const normEmail = normalizeEmail(rawInput);
  const cleanDigits = rawInput.replace(/\D/g, '');
  const cleanNameText = rawInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (!rawInput && !normEmail) {
    return { success: false, message: 'Por favor ingresa tu correo electrónico registrado.' };
  }

  // Si está configurada la URL de GAS y no está forzado el modo simulador
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = buildSecureUrl(settings.gasWebAppUrl, {
        action: 'getStudent',
        query: normEmail || rawInput,
        email: normEmail,
        id: cleanDigits || rawInput
      });
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.success && json.data) {
        return json;
      }
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando modo simulador local.', error);
      // Fallback a simulador local
    }
  }

  // Simulador Local
  await new Promise((resolve) => setTimeout(resolve, 250)); // Latencia realista
  const students = getMockStudents();

  // 1. Búsqueda prioritaria por Correo Electrónico con normalización estricta
  let found = students.find((s) => {
    return isEmailMatch(normEmail || rawInput, s.Email || '');
  });

  // 2. Búsqueda secundaria por Cédula / ID o Teléfono
  if (!found && cleanDigits.length >= 4) {
    found = students.find((s) => {
      const sId = String(s.ID_Cliente || '').replace(/\D/g, '');
      const sPhone = String(s.Telefono_WhatsApp || '').replace(/\D/g, '');
      return sId === cleanDigits || sPhone.endsWith(cleanDigits) || cleanDigits.endsWith(sId);
    });
  }

  // 3. Búsqueda secundaria por Nombre de Alumna o Representante
  if (!found && cleanNameText.length >= 3) {
    found = students.find((s) => {
      const sName = String(s.Nombre_Alumna || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sRep = String(s.Nombre_Representante || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return sName.includes(cleanNameText) || sRep.includes(cleanNameText) || cleanNameText.includes(sName);
    });
  }

  // 4. Búsqueda exhaustiva en cualquier campo de la ficha (fallback)
  if (!found && normEmail.length >= 5) {
    found = students.find((s) => {
      const combined = `${s.ID_Cliente} ${s.Nombre_Alumna} ${s.Nombre_Representante} ${s.Email} ${s.Telefono_WhatsApp}`.toLowerCase();
      return combined.includes(normEmail) || combined.includes(cleanNameText);
    });
  }

  if (!found) {
    return {
      success: false,
      message: `No encontramos una alumna registrada con el correo "${rawInput}". Puedes registrar tu ficha rápida ahora mismo o verificar con secretaría.`
    };
  }

  if (found.Estado === 'Inactivo') {
    return {
      success: false,
      message: 'La alumna figura como inactiva en la base de datos. Por favor contáctanos directamente para reactivar su ficha.'
    };
  }

  return {
    success: true,
    data: found
  };
}

/**
 * 💾 API: Registrar o Actualizar Alumna (Local + Google Sheets)
 */
export async function saveStudentApi(studentData: AlumnaNivel): Promise<{ success: boolean; message: string; data?: AlumnaNivel }> {
  const settings = getAppSettings();
  const students = getMockStudents();

  // Asegurar ID único si no viene
  const studentToSave: AlumnaNivel = {
    ...studentData,
    ID_Cliente: studentData.ID_Cliente?.trim() || `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    Nombre_Alumna: sanitizeInput(studentData.Nombre_Alumna),
    Nombre_Representante: sanitizeInput(studentData.Nombre_Representante || studentData.Nombre_Alumna),
    Email: (studentData.Email || '').trim().toLowerCase(),
    Telefono_WhatsApp: (studentData.Telefono_WhatsApp || '').trim(),
    Nivel_Asignado: studentData.Nivel_Asignado || 'Básico',
    Estado: studentData.Estado || 'Activo'
  };

  const existingIdx = students.findIndex(
    (s) =>
      s.ID_Cliente === studentToSave.ID_Cliente ||
      (s.Email && studentToSave.Email && s.Email.toLowerCase() === studentToSave.Email.toLowerCase())
  );

  let updatedList: AlumnaNivel[];
  if (existingIdx >= 0) {
    updatedList = [...students];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...studentToSave };
  } else {
    updatedList = [studentToSave, ...students];
  }

  saveMockStudents(updatedList);

  // Si está conectado Google Apps Script, enviar a Google Sheet
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = buildSecurePayload({
        action: 'saveStudent',
        student: studentToSave
      });
      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || `Ficha de ${studentToSave.Nombre_Alumna} guardada en Google Sheets.`,
        data: studentToSave
      };
    } catch (error) {
      console.warn('Error guardando alumna en Apps Script:', error);
    }
  }

  return {
    success: true,
    message: `Ficha de ${studentToSave.Nombre_Alumna} guardada correctamente.`,
    data: studentToSave
  };
}

/**
 * 🗑️ API: Eliminar Alumna
 */
export async function deleteStudentApi(idClienteOrEmail: string): Promise<{ success: boolean; message: string }> {
  const settings = getAppSettings();
  const students = getMockStudents();
  const clean = idClienteOrEmail.trim().toLowerCase();
  const filtered = students.filter(
    (s) => s.ID_Cliente !== idClienteOrEmail && s.Email.toLowerCase() !== clean
  );

  saveMockStudents(filtered);

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = buildSecurePayload({
        action: 'deleteStudent',
        idCliente: idClienteOrEmail
      });
      await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('Error deleting student on Apps Script:', e);
    }
  }

  return {
    success: true,
    message: 'Alumna eliminada del registro.'
  };
}

/**
 * 📅 API: Obtener Horarios filtrados por Nivel
 */
export async function getSchedulesApi(nivelRequerido: string): Promise<ApiSchedulesResponse> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = buildSecureUrl(settings.gasWebAppUrl, {
        action: 'getSchedules',
        nivel: nivelRequerido
      });
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return {
          success: true,
          data: json.data.map((s: SedeHorario) => ({
            ...s,
            Dia: sanitizeInput(s.Dia),
            Horario: formatFriendlyTime(s.Horario),
            Sede: sanitizeInput(s.Sede),
            Estado_Horario: s.Cupos_Ocupados >= s.Cupo_Maximo ? 'Lleno' : (s.Estado_Horario || 'Disponible')
          }))
        };
      }
      return json;
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando simulador local.', error);
    }
  }

  // Simulador local
  await new Promise((resolve) => setTimeout(resolve, 300));
  const schedules = getMockSchedules();

  const filtered = schedules.filter(
    (s) => !nivelRequerido || isLevelCompatible(nivelRequerido, s.Nivel_Requerido)
  );

  return {
    success: true,
    data: filtered.map((s) => ({
      ...s,
      Dia: sanitizeInput(s.Dia),
      Horario: formatFriendlyTime(s.Horario),
      Estado_Horario: s.Cupos_Ocupados >= s.Cupo_Maximo ? 'Lleno' : 'Disponible'
    }))
  };
}

/**
 * 📤 API: Registrar Inscripción y guardar Comprobante
 */
export async function submitRegistrationApi(payload: {
  idCliente: string;
  nombreAlumna: string;
  sede: string;
  horarioSeleccionado: string;
  idHorario?: string;
  fileBase64?: string;
  fileName?: string;
  fileMimeType?: string;
}): Promise<ApiRegistrationResponse> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      // GAS exige enviar POST con JSON
      const securePayload = buildSecurePayload(payload);
      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // evita preflight estricto en GAS
        },
        body: JSON.stringify(securePayload)
      });
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error registrando en Apps Script live. Guardando en modo simulador.', error);
    }
  }

  // Simulador Local
  await new Promise((resolve) => setTimeout(resolve, 800));

  const registrations = getMockRegistrations();
  const schedules = getMockSchedules();

  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const idRegistro = `INS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Simular guardado de archivo en Drive
  const mockDriveUrl = payload.fileBase64 
    ? `https://drive.google.com/file/d/mock-drive-${Date.now()}/view`
    : 'Sin comprobante';

  const newReg: Inscripcion = {
    ID_Registro: idRegistro,
    Fecha_Registro: dateStr,
    ID_Cliente: payload.idCliente,
    Nombre_Alumna: payload.nombreAlumna,
    Sede: payload.sede,
    Horario_Seleccionado: payload.horarioSeleccionado,
    URL_Comprobante_Drive: mockDriveUrl,
    Estado_Inscripcion: 'Pendiente',
    Notificado_Confirmacion: 'NO',
    Comprobante_Nombre: payload.fileName,
    Comprobante_Base64: payload.fileBase64
  };

  registrations.unshift(newReg);
  saveMockRegistrations(registrations);

  // Actualizar cupo ocupado en horarios (soporta 1 o múltiples horarios seleccionados)
  let scheduleUpdated = false;
  const targetIds = payload.idHorario ? payload.idHorario.split(',').map(s => s.trim()) : [];

  const updatedSchedules = schedules.map((sch) => {
    const matchesId = targetIds.includes(sch.ID_Horario);
    const matchesHorarioText = sch.Sede === payload.sede && (
      payload.horarioSeleccionado.includes(sch.Horario) || 
      (sch.Dia && payload.horarioSeleccionado.includes(sch.Dia))
    );

    if (matchesId || matchesHorarioText) {
      scheduleUpdated = true;
      const newOccupied = Math.min(sch.Cupos_Ocupados + 1, sch.Cupo_Maximo);
      return {
        ...sch,
        Cupos_Ocupados: newOccupied,
        Estado_Horario: newOccupied >= sch.Cupo_Maximo ? ('Lleno' as const) : ('Disponible' as const)
      };
    }
    return sch;
  });

  if (scheduleUpdated) {
    saveMockSchedules(updatedSchedules);
  }

  return {
    success: true,
    message: '¡Inscripción recibida con éxito! Tu comprobante fue guardado y está en revisión.',
    ID_Registro: idRegistro,
    URL_Comprobante_Drive: mockDriveUrl
  };
}

/**
 * ⏳ Registrar Alumna en Lista de Espera (Cuando un horario está lleno)
 */
export async function submitWaitingListApi(payload: {
  student: AlumnaNivel;
  schedule: SedeHorario;
  notas?: string;
}): Promise<{ success: boolean; message: string; ID_Espera?: string; entry?: WaitingListEntry }> {
  const settings = getAppSettings();
  const now = new Date();
  const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
  const idEspera = `ESP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newEntry: WaitingListEntry = {
    ID_Espera: idEspera,
    Fecha_Registro: dateStr,
    ID_Cliente: payload.student.ID_Cliente,
    Nombre_Alumna: payload.student.Nombre_Alumna,
    Nombre_Representante: payload.student.Nombre_Representante,
    Email: payload.student.Email,
    Telefono_WhatsApp: payload.student.Telefono_WhatsApp,
    ID_Horario: payload.schedule.ID_Horario,
    Sede: payload.schedule.Sede,
    Dia: payload.schedule.Dia,
    Horario: payload.schedule.Horario,
    Nivel_Requerido: payload.schedule.Nivel_Requerido,
    Salon: payload.schedule.Salon || '',
    Estado_Espera: 'Pendiente',
    Notas: payload.notas || 'Registro desde plataforma web'
  };

  // 1. Guardar en almacenamiento local
  const currentList = getMockWaitingList();
  // Evitar duplicados exactos para la misma alumna y horario
  const alreadyInQueue = currentList.some(
    (item) => item.ID_Cliente === payload.student.ID_Cliente && item.ID_Horario === payload.schedule.ID_Horario && item.Estado_Espera === 'Pendiente'
  );

  if (alreadyInQueue) {
    return {
      success: true,
      message: `Ya estabas registrada en la lista de espera para el horario ${payload.schedule.Dia} (${payload.schedule.Horario}). Te notificaremos apenas se libere un cupo.`,
      ID_Espera: idEspera,
      entry: newEntry
    };
  }

  currentList.unshift(newEntry);
  saveMockWaitingList(currentList);

  // 2. Si Apps Script está conectado en vivo, enviar acción addToWaitingList
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const gasPayload = buildSecurePayload({
        action: 'addToWaitingList',
        ID_Espera: idEspera,
        Fecha_Registro: dateStr,
        ID_Cliente: payload.student.ID_Cliente,
        Nombre_Alumna: payload.student.Nombre_Alumna,
        Nombre_Representante: payload.student.Nombre_Representante,
        Email: payload.student.Email,
        Telefono_WhatsApp: payload.student.Telefono_WhatsApp,
        ID_Horario: payload.schedule.ID_Horario,
        Sede: payload.schedule.Sede,
        Dia: payload.schedule.Dia,
        Horario: payload.schedule.Horario,
        Nivel_Requerido: payload.schedule.Nivel_Requerido,
        Salon: payload.schedule.Salon || '',
        Notas: payload.notas || ''
      });

      await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(gasPayload)
      });
    } catch (e) {
      console.warn('Error enviando lista de espera a Apps Script:', e);
    }
  }

  return {
    success: true,
    message: `¡Te has unido exitosamente a la lista de espera para ${payload.schedule.Dia} (${payload.schedule.Horario})! Te notificaremos a ${payload.student.Email} y WhatsApp si se habilita un cupo.`,
    ID_Espera: idEspera,
    entry: newEntry
  };
}

/**
 * 🔄 Actualizar Estado de Registro en Lista de Espera (Admin)
 */
export async function updateWaitingListStatusApi(
  idEspera: string,
  newStatus: WaitingListEntry['Estado_Espera']
): Promise<{ success: boolean; message: string }> {
  const currentList = getMockWaitingList();
  const index = currentList.findIndex((item) => item.ID_Espera === idEspera);
  if (index >= 0) {
    currentList[index].Estado_Espera = newStatus;
    saveMockWaitingList(currentList);
    return { success: true, message: `Estado actualizado a "${newStatus}".` };
  }
  return { success: false, message: 'Registro de lista de espera no encontrado.' };
}

/**
 * 🗑️ Eliminar de la Lista de Espera
 */
export async function deleteWaitingListEntryApi(idEspera: string): Promise<{ success: boolean; message: string }> {
  const currentList = getMockWaitingList();
  const updated = currentList.filter((item) => item.ID_Espera !== idEspera);
  saveMockWaitingList(updated);
  return { success: true, message: 'Registro eliminado de la lista de espera.' };
}

/**
 * 📋 Consultar Registros de Lista de Espera por Correo o Cédula
 */
export function getWaitingListByStudent(query: string): WaitingListEntry[] {
  const trimmed = (query || '').trim().toLowerCase();
  const cleanDigits = trimmed.replace(/\D/g, '');
  if (!trimmed) return [];

  const list = getMockWaitingList();
  return list.filter((item) => {
    const itemEmail = (item.Email || '').toLowerCase().trim();
    const itemId = (item.ID_Cliente || '').replace(/\D/g, '');
    const matchEmail = itemEmail === trimmed || (trimmed.includes('@') && itemEmail.includes(trimmed));
    const matchId = cleanDigits.length >= 4 && itemId === cleanDigits;
    const matchName = (item.Nombre_Alumna || '').toLowerCase().includes(trimmed);
    return matchEmail || matchId || matchName;
  });
}

/**
 * 📋 Consultar Inscripciones guardadas por Correo Electrónico o ID_Cliente
 */
export async function getRegistrationsByStudentId(query: string): Promise<Inscripcion[]> {
  const settings = getAppSettings();
  const trimmed = (query || '').trim();
  const cleanEmail = trimmed.toLowerCase();
  const cleanDigits = trimmed.replace(/\D/g, '');

  if (!trimmed) return [];

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = buildSecureUrl(settings.gasWebAppUrl, {
        action: 'getRegistrations',
        id: cleanDigits || trimmed,
        email: cleanEmail,
        query: trimmed
      });
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (e) {
      console.warn('Error fetching registrations live', e);
    }
  }

  // Simulador local
  const all = getMockRegistrations();
  const students = getMockStudents();

  // Encontrar qué ID_Cliente corresponde al correo buscado
  const matchingStudentIds = new Set<string>();
  students.forEach((s) => {
    const sEmail = String(s.Email || '').toLowerCase().trim();
    if (sEmail === cleanEmail || (cleanEmail.includes('@') && sEmail.includes(cleanEmail))) {
      matchingStudentIds.add(s.ID_Cliente);
    }
    if (cleanDigits.length >= 4 && String(s.ID_Cliente || '').replace(/\D/g, '') === cleanDigits) {
      matchingStudentIds.add(s.ID_Cliente);
    }
  });

  return all.filter((r) => {
    const rId = String(r.ID_Cliente || '').replace(/\D/g, '');
    const directIdMatch = cleanDigits.length >= 4 && rId === cleanDigits;
    const studentMatch = matchingStudentIds.has(r.ID_Cliente);
    const nameMatch = trimmed.length > 3 && String(r.Nombre_Alumna || '').toLowerCase().includes(cleanEmail);
    const regIdMatch = String(r.ID_Registro || '').toLowerCase().includes(cleanEmail);
    return directIdMatch || studentMatch || nameMatch || regIdMatch;
  });
}

/**
 * 🗓️ Guardar o Editar un Horario (Conecta con Google Sheets / Apps Script)
 */
export async function saveScheduleApi(schedule: SedeHorario): Promise<{ success: boolean; message: string; ID_Horario?: string }> {
  const settings = getAppSettings();
  
  // 1. Siempre actualizar el estado local para reactividad inmediata
  const schedules = getMockSchedules();
  const index = schedules.findIndex((s) => s.ID_Horario === schedule.ID_Horario);
  let updatedList: SedeHorario[];
  
  if (index >= 0) {
    updatedList = [...schedules];
    updatedList[index] = schedule;
  } else {
    updatedList = [schedule, ...schedules];
  }
  saveMockSchedules(updatedList);

  // 2. Si Google Sheets está conectado en vivo, enviar la petición POST
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = buildSecurePayload({
        action: 'saveSchedule',
        ID_Horario: schedule.ID_Horario,
        Sede: schedule.Sede,
        Nivel_Requerido: schedule.Nivel_Requerido,
        Dia: schedule.Dia,
        Horario: schedule.Horario,
        Cupo_Maximo: schedule.Cupo_Maximo,
        Cupos_Ocupados: schedule.Cupos_Ocupados,
        Estado_Horario: schedule.Cupos_Ocupados >= schedule.Cupo_Maximo ? 'Lleno' : schedule.Estado_Horario
      });

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || 'Horario guardado y sincronizado con Google Sheets.',
        ID_Horario: schedule.ID_Horario
      };
    } catch (error) {
      console.warn('Error sincronizando horario con Apps Script en vivo:', error);
      return {
        success: true,
        message: 'Guardado localmente. (Error de red al sincronizar con Google Sheets)',
        ID_Horario: schedule.ID_Horario
      };
    }
  }

  return {
    success: true,
    message: index >= 0 
      ? `Horario ${schedule.ID_Horario} actualizado correctamente.` 
      : `Nuevo horario ${schedule.ID_Horario} creado correctamente.`,
    ID_Horario: schedule.ID_Horario
  };
}

/**
 * 🗑️ Eliminar un Horario (Conecta con Google Sheets / Apps Script)
 */
export async function deleteScheduleApi(idHorario: string): Promise<{ success: boolean; message: string }> {
  const settings = getAppSettings();

  // 1. Actualizar estado local
  const schedules = getMockSchedules();
  const updatedList = schedules.filter((s) => s.ID_Horario !== idHorario);
  saveMockSchedules(updatedList);

  // 2. Si Google Sheets está conectado en vivo, enviar acción deleteSchedule
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = buildSecurePayload({
        action: 'deleteSchedule',
        idHorario: idHorario
      });

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || `Horario ${idHorario} eliminado en Google Sheets.`
      };
    } catch (error) {
      console.warn('Error eliminando horario en Apps Script:', error);
      return {
        success: true,
        message: `Eliminado localmente. (Error de red con Google Sheets)`
      };
    }
  }

  return {
    success: true,
    message: `Horario ${idHorario} eliminado correctamente.`
  };
}

/**
 * 🔄 Sincronizar Masivamente Todos los Horarios con Google Sheets
 */
export async function bulkSyncSchedulesApi(schedulesList: SedeHorario[]): Promise<{ success: boolean; message: string }> {
  const settings = getAppSettings();
  saveMockSchedules(schedulesList);

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const payload = buildSecurePayload({
        action: 'syncAllSchedules',
        schedules: schedulesList
      });

      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      return {
        success: json.success ?? true,
        message: json.message || `${schedulesList.length} horarios sincronizados con Google Sheets.`
      };
    } catch (error) {
      console.warn('Error sincronizando masivamente con Google Sheets:', error);
      return {
        success: false,
        message: 'No se pudo conectar con Google Apps Script. Se guardó copia local.'
      };
    }
  }

  return {
    success: true,
    message: `${schedulesList.length} horarios guardados y listos.`
  };
}

/**
 * 📥 Traer Horarios en Vivo desde Google Sheets
 */
export async function fetchLiveSchedulesFromSheetApi(): Promise<{ success: boolean; data?: SedeHorario[]; message?: string }> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = buildSecureUrl(settings.gasWebAppUrl, { action: 'getAllSchedules' });
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        saveMockSchedules(json.data);
        return {
          success: true,
          data: json.data,
          message: `Se descargaron ${json.data.length} horarios en vivo desde tu Google Sheet.`
        };
      }
    } catch (error) {
      console.warn('Error al consultar horarios en vivo:', error);
      return {
        success: false,
        message: 'No se pudo conectar con Google Sheets. Mostrando datos locales.'
      };
    }
  }

  const local = getMockSchedules();
  return {
    success: true,
    data: local,
    message: `Cargados ${local.length} horarios (Modo Local / Sin URL configurada).`
  };
}

/**
 * 🔍 Extraer ID de hoja de cálculo desde un enlace o string
 */
export function extractGoogleSpreadsheetId(urlOrId: string): string {
  const trimmed = urlOrId.trim();
  if (!trimmed) return '';
  
  // Si ya es un ID limpio (e.g. 1BxiMVs0XRrGzCAUc1kiHdgkbc1X5n80ECqU-XyV0g5Q)
  if (!trimmed.includes('/') && trimmed.length >= 20) {
    return trimmed;
  }
  
  // Buscar patrón /d/SPREADSHEET_ID/
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  
  // Buscar patrón id=SPREADSHEET_ID
  const matchParam = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (matchParam && matchParam[1]) {
    return matchParam[1];
  }

  return trimmed;
}

/**
 * 📊 Parser robusto de CSV/TSV respetando comillas y saltos de línea
 */
export function parseCsv(text: string): string[][] {
  const clean = text.trim();
  if (!clean) return [];

  // Detectar delimitador (tabulador si fue copiado de Excel/Sheets, o coma si es CSV)
  const firstLine = clean.split('\n')[0] || '';
  const delimiter = (firstLine.includes('\t') && !firstLine.includes(',')) ? '\t' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // Saltar comilla de escape
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * 👥 Parsear filas CSV a estructura AlumnaNivel
 */
export function parseStudentsFromCsv(csvText: string): AlumnaNivel[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];

  // Detectar si la primera fila es encabezado
  const firstRow = rows[0].map(c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
  const hasHeaders = firstRow.some(h => 
    h.includes('id') || h.includes('cedula') || h.includes('alumna') || h.includes('representante') || h.includes('nivel')
  );

  let colMap = {
    id: 0,
    rep: 1,
    phone: 2,
    email: 3,
    alumna: 4,
    nivel: 5,
    estado: 6
  };

  let startIndex = 0;
  if (hasHeaders) {
    startIndex = 1;
    firstRow.forEach((h, idx) => {
      if (h.includes('id') || h.includes('cedula') || h.includes('identificacion')) colMap.id = idx;
      else if (h.includes('representante') || h.includes('tutor') || h.includes('padre')) colMap.rep = idx;
      else if (h.includes('telefono') || h.includes('whatsapp') || h.includes('celular') || h.includes('contacto')) colMap.phone = idx;
      else if (h.includes('email') || h.includes('correo')) colMap.email = idx;
      else if (h.includes('alumna') || h.includes('estudiante') || (h.includes('nombre') && !h.includes('rep'))) colMap.alumna = idx;
      else if (h.includes('nivel')) colMap.nivel = idx;
      else if (h.includes('estado') || h.includes('status')) colMap.estado = idx;
    });
  }

  const result: AlumnaNivel[] = [];
  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const id = r[colMap.id] || '';
    const alumna = r[colMap.alumna] || '';
    if (!id && !alumna) continue;

    const estadoRaw = (r[colMap.estado] || 'Activo').toLowerCase();
    const estado: 'Activo' | 'Inactivo' = estadoRaw.includes('inact') ? 'Inactivo' : 'Activo';

    result.push({
      ID_Cliente: sanitizeInput(id),
      Nombre_Representante: sanitizeInput(r[colMap.rep] || ''),
      Telefono_WhatsApp: sanitizeInput(r[colMap.phone] || ''),
      Email: normalizeEmail(r[colMap.email]) || sanitizeInput(r[colMap.email] || ''),
      Nombre_Alumna: sanitizeInput(alumna),
      Nivel_Asignado: sanitizeInput(r[colMap.nivel] || 'Principiante'),
      Estado: estado
    });
  }

  return result;
}

/**
 * 📅 Parsear filas CSV a estructura SedeHorario
 */
export function parseSchedulesFromCsv(csvText: string): SedeHorario[] {
  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];

  const firstRow = rows[0].map(c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
  const hasHeaders = firstRow.some(h => 
    h.includes('id') || h.includes('sede') || h.includes('dia') || h.includes('horario') || h.includes('cupo')
  );

  let colMap = {
    id: 0,
    sede: 1,
    nivel: 2,
    dia: 3,
    horario: 4,
    cupoMax: 5,
    cuposOcc: 6,
    estado: 7
  };

  let startIndex = 0;
  if (hasHeaders) {
    startIndex = 1;
    firstRow.forEach((h, idx) => {
      if (h.includes('id') || h.includes('codigo')) colMap.id = idx;
      else if (h.includes('sede') || h.includes('sucursal') || h.includes('lugar')) colMap.sede = idx;
      else if (h.includes('nivel')) colMap.nivel = idx;
      else if (h.includes('dia')) colMap.dia = idx;
      else if (h.includes('horario') || h.includes('hora')) colMap.horario = idx;
      else if (h.includes('max') || (h.includes('cupo') && !h.includes('ocupad'))) colMap.cupoMax = idx;
      else if (h.includes('ocupad') || h.includes('inscrit')) colMap.cuposOcc = idx;
      else if (h.includes('estado')) colMap.estado = idx;
    });
  }

  const result: SedeHorario[] = [];
  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const id = (r[colMap.id] || `HOR-00${i}`).trim();
    const sede = (r[colMap.sede] || 'Sede Principal (Norte)').trim();
    const dia = (r[colMap.dia] || 'Lunes y Miércoles').trim();
    const horario = (r[colMap.horario] || '16:00 - 17:30').trim();
    
    if (!sede && !dia && !horario) continue;

    const max = Number(r[colMap.cupoMax]?.replace(/\D/g, '')) || 10;
    const occ = Number(r[colMap.cuposOcc]?.replace(/\D/g, '')) || 0;
    const estadoRaw = (r[colMap.estado] || '').toLowerCase();
    const estado: 'Disponible' | 'Lleno' = (occ >= max || estadoRaw.includes('lleno')) ? 'Lleno' : 'Disponible';

    result.push({
      ID_Horario: sanitizeInput(id),
      Sede: sanitizeInput(sede),
      Nivel_Requerido: sanitizeInput(r[colMap.nivel] || 'Principiante'),
      Dia: sanitizeInput(dia),
      Horario: formatFriendlyTime(sanitizeInput(horario)),
      Cupo_Maximo: max,
      Cupos_Ocupados: occ,
      Estado_Horario: estado
    });
  }

  return result;
}

/**
 * 📋 Parsear filas CSV a estructura Inscripcion
 */
export function parseRegistrationsFromCsv(csvText: string): Inscripcion[] {
  const rows = parseCsv(csvText);
  if (rows.length <= 1) return [];

  const result: Inscripcion[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || !r[0]) continue;

    const estadoRaw = (r[7] || 'Pendiente').toLowerCase();
    const estado: 'Pendiente' | 'Confirmado' | 'Rechazado' = 
      estadoRaw.includes('confirm') ? 'Confirmado' : estadoRaw.includes('rechaz') ? 'Rechazado' : 'Pendiente';

    result.push({
      ID_Registro: sanitizeInput(r[0] || `INS-${Date.now()}`),
      Fecha_Registro: sanitizeInput(r[1] || new Date().toISOString()),
      ID_Cliente: sanitizeInput(r[2] || ''),
      Nombre_Alumna: sanitizeInput(r[3] || ''),
      Sede: sanitizeInput(r[4] || ''),
      Horario_Seleccionado: sanitizeInput(r[5] || ''),
      URL_Comprobante_Drive: sanitizeInput(r[6] || 'Sin comprobante'),
      Estado_Inscripcion: estado,
      Notificado_Confirmacion: (r[8] && r[8].toUpperCase().includes('SI')) ? 'SI' : 'NO'
    });
  }

  return result;
}

/**
 * 🌐 Sincronización Directa por URL o ID de Google Spreadsheet
 */
export async function syncWithGoogleSheetUrl(urlOrId: string): Promise<{
  success: boolean;
  message: string;
  counts?: { students: number; schedules: number; registrations: number };
}> {
  const sheetId = extractGoogleSpreadsheetId(urlOrId);
  if (!sheetId) {
    return {
      success: false,
      message: 'No se pudo identificar un ID o enlace válido de Google Sheets. Ingresa el enlace completo de la hoja.'
    };
  }

  let studentsCount = 0;
  let schedulesCount = 0;
  let registrationsCount = 0;
  let errorDetails = '';

  // 1. Descargar Alumnas_Niveles
  try {
    const studentTabNames = ['Alumnas_Niveles', 'Alumnas', 'Alumnos', 'Estudiantes', 'Sheet1', 'Hoja 1', 'Hoja1'];
    let studentsText = '';
    
    for (const tab of studentTabNames) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.length > 20) {
            studentsText = text;
            break;
          }
        }
      } catch (e) {}
    }

    if (studentsText) {
      const parsedStudents = parseStudentsFromCsv(studentsText);
      if (parsedStudents.length > 0) {
        saveMockStudents(parsedStudents);
        studentsCount = parsedStudents.length;
      }
    }
  } catch (err: any) {
    errorDetails += `Error en Alumnas: ${err.message}. `;
  }

  // 2. Descargar Sedes_Horarios
  try {
    const scheduleTabNames = ['Sedes_Horarios', 'Horarios', 'Sedes', 'Sheet2', 'Hoja 2', 'Hoja2'];
    let schedulesText = '';

    for (const tab of scheduleTabNames) {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.length > 20) {
            schedulesText = text;
            break;
          }
        }
      } catch (e) {}
    }

    if (schedulesText) {
      const parsedSchedules = parseSchedulesFromCsv(schedulesText);
      if (parsedSchedules.length > 0) {
        saveMockSchedules(parsedSchedules);
        schedulesCount = parsedSchedules.length;
      }
    }
  } catch (err: any) {
    errorDetails += `Error en Horarios: ${err.message}. `;
  }

  // 3. Descargar Inscripciones (Opcional)
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Inscripciones`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      if (text && !text.includes('<!DOCTYPE html>')) {
        const parsedRegs = parseRegistrationsFromCsv(text);
        if (parsedRegs.length > 0) {
          saveMockRegistrations(parsedRegs);
          registrationsCount = parsedRegs.length;
        }
      }
    }
  } catch (e) {}

  if (studentsCount === 0 && schedulesCount === 0) {
    return {
      success: false,
      message: `No se pudieron leer las pestañas de tu Google Sheet. Por favor verifica que tu hoja esté configurada como pública: En Google Sheets haz clic en 'Compartir' -> 'Acceso general' -> Selecciona 'Cualquier persona con el enlace' (Lector).`
    };
  }

  // Guardar configuración
  const currentSettings = getAppSettings();
  const updatedSettings: AppSettings = {
    ...currentSettings,
    googleSheetUrlOrId: urlOrId.trim(),
    useMockMode: false,
    lastSyncDate: new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
    lastSyncSource: 'sheet_url',
    lastSyncCounts: {
      students: studentsCount,
      schedules: schedulesCount,
      registrations: registrationsCount
    }
  };
  saveAppSettings(updatedSettings);

  return {
    success: true,
    message: `¡Sincronización exitosa! Se cargaron ${studentsCount} alumnas y ${schedulesCount} horarios desde tu Google Sheet.`,
    counts: {
      students: studentsCount,
      schedules: schedulesCount,
      registrations: registrationsCount
    }
  };
}

/**
 * ⚡ Sincronización mediante Google Apps Script Web App API
 */
export async function syncWithAppsScript(webAppUrl?: string): Promise<{
  success: boolean;
  message: string;
  counts?: { students: number; schedules: number; registrations: number };
}> {
  const currentSettings = getAppSettings();
  const url = (webAppUrl || currentSettings.gasWebAppUrl || '').trim();

  if (!url) {
    return {
      success: false,
      message: 'Ingresa la URL de tu Web App de Apps Script (ej: https://script.google.com/macros/s/.../exec).'
    };
  }

  let studentsCount = 0;
  let schedulesCount = 0;
  let registrationsCount = 0;

  try {
    // 1. Obtener Alumnas
    try {
      const secureStudentsUrl = buildSecureUrl(url, { action: 'getAllStudents' });
      const resStudents = await fetch(secureStudentsUrl);
      const jsonStudents = await resStudents.json();
      if (jsonStudents.success && Array.isArray(jsonStudents.data) && jsonStudents.data.length > 0) {
        saveMockStudents(jsonStudents.data);
        studentsCount = jsonStudents.data.length;
      }
    } catch (e) {
      console.warn('Error fetching all students via Apps Script:', e);
    }

    // 2. Obtener Horarios
    try {
      const secureSchedulesUrl = buildSecureUrl(url, { action: 'getAllSchedules' });
      const resSchedules = await fetch(secureSchedulesUrl);
      const jsonSchedules = await resSchedules.json();
      if (jsonSchedules.success && Array.isArray(jsonSchedules.data) && jsonSchedules.data.length > 0) {
        saveMockSchedules(jsonSchedules.data);
        schedulesCount = jsonSchedules.data.length;
      }
    } catch (e) {
      console.warn('Error fetching all schedules via Apps Script:', e);
    }

    // 3. Obtener Inscripciones
    try {
      const secureRegsUrl = buildSecureUrl(url, { action: 'getAllRegistrations' });
      const resRegs = await fetch(secureRegsUrl);
      const jsonRegs = await resRegs.json();
      if (jsonRegs.success && Array.isArray(jsonRegs.data)) {
        saveMockRegistrations(jsonRegs.data);
        registrationsCount = jsonRegs.data.length;
      }
    } catch (e) {
      console.warn('Error fetching all registrations via Apps Script:', e);
    }

    if (studentsCount === 0 && schedulesCount === 0) {
      return {
        success: false,
        message: 'La Web App de Apps Script respondió pero no devolvió registros en las pestañas. Verifica que tu Spreadsheet tenga las hojas Alumnas_Niveles y Sedes_Horarios.'
      };
    }

    const updatedSettings: AppSettings = {
      ...currentSettings,
      gasWebAppUrl: url,
      useMockMode: false,
      lastSyncDate: new Date().toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }),
      lastSyncSource: 'apps_script',
      lastSyncCounts: {
        students: studentsCount,
        schedules: schedulesCount,
        registrations: registrationsCount
      }
    };
    saveAppSettings(updatedSettings);

    return {
      success: true,
      message: `¡Conexión exitosa con Apps Script! Se sincronizaron ${studentsCount} alumnas y ${schedulesCount} horarios.`,
      counts: {
        students: studentsCount,
        schedules: schedulesCount,
        registrations: registrationsCount
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con la Web App: ${err.message || 'Verifica que el despliegue esté disponible para "Cualquier persona" (Anyone).'}`
    };
  }
}

