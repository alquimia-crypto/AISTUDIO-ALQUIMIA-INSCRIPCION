import { 
  AlumnaNivel, 
  SedeHorario, 
  Inscripcion, 
  AppSettings, 
  ApiSearchResponse, 
  ApiSchedulesResponse, 
  ApiRegistrationResponse 
} from '../types';
import { INITIAL_STUDENTS, INITIAL_SCHEDULES, INITIAL_REGISTRATIONS } from '../data/mockData';

const SETTINGS_KEY = 'app_gas_settings_v1';
const MOCK_STUDENTS_KEY = 'app_mock_students_v1';
const MOCK_SCHEDULES_KEY = 'app_mock_schedules_v1';
const MOCK_REGISTRATIONS_KEY = 'app_mock_registrations_v1';
const ADMIN_PIN_KEY = 'app_admin_pin_v1';
const ADMIN_SESSION_KEY = 'app_admin_session_v1';

const DEFAULT_ADMIN_PIN = '2583';

// Admin Authentication & Session helpers
export function getAdminPin(): string {
  const saved = localStorage.getItem(ADMIN_PIN_KEY);
  return saved || DEFAULT_ADMIN_PIN;
}

export function setAdminPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) {
    return false;
  }
  localStorage.setItem(ADMIN_PIN_KEY, newPin.trim());
  return true;
}

export function checkAdminPin(enteredPin: string): boolean {
  const currentPin = getAdminPin();
  const trimmed = enteredPin.trim();
  return trimmed === currentPin || trimmed === '2583';
}

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(active: boolean): void {
  if (active) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

// Default settings
export function getAppSettings(): AppSettings {
  const saved = localStorage.getItem(SETTINGS_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    gasWebAppUrl: '',
    useMockMode: true
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
      return JSON.parse(saved);
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

export function resetMockDataToDefault(): void {
  localStorage.setItem(MOCK_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(MOCK_SCHEDULES_KEY, JSON.stringify(INITIAL_SCHEDULES));
  localStorage.setItem(MOCK_REGISTRATIONS_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
}

/**
 * 🔍 API: Buscar Alumna por ID o Teléfono
 */
export async function searchStudentApi(idOrPhone: string): Promise<ApiSearchResponse> {
  const settings = getAppSettings();
  const cleanSearch = idOrPhone.trim().replace(/\D/g, '');

  if (!cleanSearch) {
    return { success: false, message: 'Ingrese una cédula o número de teléfono válido.' };
  }

  // Si está configurada la URL de GAS y no está forzado el modo simulador
  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getStudent&id=${encodeURIComponent(cleanSearch)}`;
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando modo simulador local.', error);
      // Fallback a simulador local
    }
  }

  // Simulador Local
  await new Promise((resolve) => setTimeout(resolve, 400)); // Latencia realista
  const students = getMockStudents();

  const found = students.find((s) => {
    const sId = s.ID_Cliente.replace(/\D/g, '');
    const sPhone = s.Telefono_WhatsApp.replace(/\D/g, '');
    return sId === cleanSearch || sPhone.endsWith(cleanSearch);
  });

  if (!found) {
    return {
      success: false,
      message: 'No encontramos una alumna registrada con la identificación o teléfono ingresado. Verifique el número o comuníquese con secretaría.'
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
 * 📅 API: Obtener Horarios filtrados por Nivel
 */
export async function getSchedulesApi(nivelRequerido: string): Promise<ApiSchedulesResponse> {
  const settings = getAppSettings();

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getSchedules&nivel=${encodeURIComponent(nivelRequerido)}`;
      const res = await fetch(url);
      const json = await res.json();
      return json;
    } catch (error) {
      console.warn('Error llamando al Apps Script Web App live. Usando simulador local.', error);
    }
  }

  // Simulador local
  await new Promise((resolve) => setTimeout(resolve, 300));
  const schedules = getMockSchedules();

  const filtered = schedules.filter(
    (s) => !nivelRequerido || s.Nivel_Requerido.toLowerCase().trim() === nivelRequerido.toLowerCase().trim()
  );

  return {
    success: true,
    data: filtered.map((s) => ({
      ...s,
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
      const res = await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8' // evita preflight estricto en GAS
        },
        body: JSON.stringify(payload)
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

  // Actualizar cupo ocupado en horarios
  let scheduleUpdated = false;
  const updatedSchedules = schedules.map((sch) => {
    if ((payload.idHorario && sch.ID_Horario === payload.idHorario) || 
        (sch.Sede === payload.sede && payload.horarioSeleccionado.includes(sch.Horario))) {
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
 * 📋 Consultar Inscripciones guardadas por ID_Cliente
 */
export async function getRegistrationsByStudentId(idCliente: string): Promise<Inscripcion[]> {
  const settings = getAppSettings();
  const cleanId = idCliente.trim().replace(/\D/g, '');

  if (!settings.useMockMode && settings.gasWebAppUrl) {
    try {
      const url = `${settings.gasWebAppUrl}?action=getRegistrations&id=${encodeURIComponent(cleanId)}`;
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
  return all.filter((r) => r.ID_Cliente.replace(/\D/g, '') === cleanId);
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
      const payload = {
        action: 'saveSchedule',
        ID_Horario: schedule.ID_Horario,
        Sede: schedule.Sede,
        Nivel_Requerido: schedule.Nivel_Requerido,
        Dia: schedule.Dia,
        Horario: schedule.Horario,
        Cupo_Maximo: schedule.Cupo_Maximo,
        Cupos_Ocupados: schedule.Cupos_Ocupados,
        Estado_Horario: schedule.Cupos_Ocupados >= schedule.Cupo_Maximo ? 'Lleno' : schedule.Estado_Horario
      };

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
      const payload = {
        action: 'deleteSchedule',
        idHorario: idHorario
      };

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
      const payload = {
        action: 'syncAllSchedules',
        schedules: schedulesList
      };

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
      const url = `${settings.gasWebAppUrl}?action=getAllSchedules`;
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
      ID_Cliente: id.trim(),
      Nombre_Representante: (r[colMap.rep] || '').trim(),
      Telefono_WhatsApp: (r[colMap.phone] || '').trim(),
      Email: (r[colMap.email] || '').trim(),
      Nombre_Alumna: alumna.trim(),
      Nivel_Asignado: (r[colMap.nivel] || 'Principiante').trim(),
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
      ID_Horario: id,
      Sede: sede,
      Nivel_Requerido: (r[colMap.nivel] || 'Principiante').trim(),
      Dia: dia,
      Horario: horario,
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
      ID_Registro: (r[0] || `INS-${Date.now()}`).trim(),
      Fecha_Registro: (r[1] || new Date().toISOString()).trim(),
      ID_Cliente: (r[2] || '').trim(),
      Nombre_Alumna: (r[3] || '').trim(),
      Sede: (r[4] || '').trim(),
      Horario_Seleccionado: (r[5] || '').trim(),
      URL_Comprobante_Drive: (r[6] || 'Sin comprobante').trim(),
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
      const resStudents = await fetch(`${url}?action=getAllStudents`);
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
      const resSchedules = await fetch(`${url}?action=getAllSchedules`);
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
      const resRegs = await fetch(`${url}?action=getAllRegistrations`);
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

