export const APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * Sistema de Inscripciones y Reserva de Cupos
 * Conectado a Google Sheets y Google Drive
 * ==============================================================================
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Crea una hoja de cálculo en Google Sheets con 3 pestañas:
 *    - 'Alumnas_Niveles'
 *    - 'Sedes_Horarios'
 *    - 'Inscripciones'
 * 
 * 2. Crea una carpeta en Google Drive para guardar los comprobantes de pago.
 * 
 * 3. Copia el ID de tu Hoja de Cálculo y el ID de tu Carpeta de Drive y reemplázalos
 *    en las constantes SPREADSHEET_ID y DRIVE_FOLDER_ID a continuación.
 * 
 * 4. En el editor de Apps Script (Extensiones > Apps Script):
 *    - Pega todo este código en Code.gs
 *    - Guarda el proyecto
 *    - Haz clic en "Desplegar" > "Nuevo despliegue"
 *    - Selecciona Tipo: "Aplicación web"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)
 *    - Copia la URL de la Aplicación Web generada y pégala en tu frontend.
 * 
 * 5. TRIGGER DE CONFIRMACIÓN AUTOMÁTICA:
 *    - Para enviar correos cuando cambies manualmente el estado a "Confirmado":
 *    - Ve a la sección 'Activadores' (ícono de reloj a la izquierda).
 *    - Añade un activador para la función 'enviarConfirmacionFinal'.
 *    - Tipo de evento: 'Según el tiempo' (ej. cada 5 u 15 minutos) O 'Al modificar la hoja de cálculo' (onEdit).
 * ==============================================================================
 */

// ⚙️ CONFIGURACIÓN GLOBAL DE SEGURIDAD (Reemplaza con tus propios valores)
const SPREADSHEET_ID = "REEMPLAZAR_CON_TU_SPREADSHEET_ID";
const DRIVE_FOLDER_ID = "REEMPLAZAR_CON_TU_DRIVE_FOLDER_ID";
const NOMBRE_ACADEMIA = "Alquimia Danza Aérea";
const EMAIL_CONTACTO = "alquimiada0@gmail.com";

// 🛡️ CLAVES DE SEGURIDAD (Cámbialas por tus propias contraseñas seguras)
// API_KEY: Protege tu script contra accesos externos no autorizados desde cURL/Postman
const API_KEY_SECRETO = "ALQUIMIA_SEC_KEY_2026";
// ADMIN_MASTER_TOKEN: Valida en el servidor las acciones de administración (crear/borrar horarios, ver listas completas)
const ADMIN_MASTER_PIN = "2583";

/**
 * 🛡️ Helper: Validar autenticación de peticiones entrantes
 */
function validarAutenticacion(params, postData, requiereAdmin) {
  const reqApiKey = (params && (params.apiKey || params.api_key || params.token)) || 
                    (postData && (postData.apiKey || postData.api_key || postData.token)) || "";
  
  // Si API_KEY_SECRETO está configurado, verificar coincidencia (o permitir modo legacy si está vacío)
  if (API_KEY_SECRETO && API_KEY_SECRETO !== "" && API_KEY_SECRETO !== "REEMPLAZAR_CON_TU_API_KEY") {
    if (reqApiKey !== API_KEY_SECRETO) {
      return { autorizado: false, motivo: "Acceso denegado: API Key no válida o ausente." };
    }
  }

  // Si la acción requiere privilegios de administrador
  if (requiereAdmin) {
    const adminToken = (params && (params.adminToken || params.adminPin || params.pin)) || 
                       (postData && (postData.adminToken || postData.adminPin || postData.pin)) || "";
    if (adminToken !== ADMIN_MASTER_PIN) {
      return { autorizado: false, motivo: "Acceso denegado: Credenciales de administrador no válidas." };
    }
  }

  return { autorizado: true };
}

/**
 * 📥 ENDPOINT GET: Consultas de Alumnas y Horarios con Validación de Seguridad
 */
function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Validar si la acción es administrativa (ej: descargar todas las alumnas o inscripciones)
  const esAccionAdmin = (action === "getAllStudents" || action === "getAllRegistrations" || action === "getWaitingList" || action === "getAllWaitingList");
  const authCheck = validarAutenticacion(e.parameter, null, esAccionAdmin);
  
  if (!authCheck.autorizado) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: authCheck.motivo, error: "UNAUTHORIZED" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  let result = { success: false, message: "Acción no válida" };
  
  try {
    if (action === "getStudent") {
      const searchParam = (e.parameter.query || e.parameter.email || e.parameter.id || "").toString().trim();
      result = buscarAlumnaPorID(sheet, searchParam);
    } 
    else if (action === "getSchedules" || action === "getAllSchedules") {
      const nivel = e.parameter.nivel ? e.parameter.nivel.toString().trim() : "";
      result = obtenerHorariosPorNivel(sheet, nivel);
    }
    else if (action === "getAllStudents" || action === "getStudents") {
      result = obtenerTodasLasAlumnas(sheet);
    }
    else if (action === "getAllRegistrations" || action === "getRegistrations") {
      result = obtenerTodasLasInscripciones(sheet);
    }
    else if (action === "getWaitingList" || action === "getAllWaitingList") {
      result = obtenerTodaListaEspera(sheet);
    }
    else if (action === "ping") {
      result = { success: true, message: "Apps Script API activa y protegida correctamente." };
    }
  } catch (error) {
    result = { success: false, message: "Error interno en Apps Script: " + error.toString() };
  }
  
  // Manejo estricto de CORS para permitir consultas desde cualquier origen
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 📤 ENDPOINT POST: Registro de Inscripción, Guardado de Comprobante y Gestión de Horarios
 */
function doPost(e) {
  let result = { success: false, message: "Ocurrió un error al procesar la solicitud" };
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    let contents;
    if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      contents = e.parameter;
    }

    const action = contents.action;

    // Verificar si la acción es administrativa
    const esAccionAdmin = (
      action === "saveSchedule" || 
      action === "editSchedule" || 
      action === "deleteSchedule" || 
      action === "syncAllSchedules" || 
      action === "deleteStudent" ||
      action === "updateWaitingListStatus"
    );

    const authCheck = validarAutenticacion(e.parameter, contents, esAccionAdmin);
    if (!authCheck.autorizado) {
      return responseJSON({ success: false, message: authCheck.motivo, error: "UNAUTHORIZED" });
    }

    // 🗓️ GESTIÓN DE HORARIOS DIRECTO EN GOOGLE SHEETS
    if (action === "saveSchedule" || action === "editSchedule") {
      result = guardarOActualizarHorarioEnSheet(sheet, contents);
      return responseJSON(result);
    }

    if (action === "deleteSchedule") {
      result = eliminarHorarioDeSheet(sheet, contents.idHorario || contents.ID_Horario);
      return responseJSON(result);
    }

    if (action === "syncAllSchedules") {
      result = sincronizarTodosLosHorarios(sheet, contents.schedules || []);
      return responseJSON(result);
    }

    // 👥 GESTIÓN DE ALUMNAS DIRECTO EN GOOGLE SHEETS
    if (action === "saveStudent" || action === "addStudent" || action === "editStudent") {
      result = guardarOActualizarAlumnaEnSheet(sheet, contents.student || contents);
      return responseJSON(result);
    }

    // 🛎️ GESTIÓN DE LISTA DE ESPERA
    if (action === "addToWaitingList") {
      result = registrarEnListaEspera(sheet, contents);
      return responseJSON(result);
    }

    if (action === "updateWaitingListStatus") {
      result = actualizarEstadoListaEspera(sheet, contents.idEspera || contents.ID_Espera, contents.nuevoEstado);
      return responseJSON(result);
    }
    
    // 📝 REGISTRO DE INSCRIPCIÓN Y SUBIDA DE COMPROBANTE
    const idCliente = contents.idCliente || contents.ID_Cliente;
    const nombreAlumna = contents.nombreAlumna || contents.Nombre_Alumna;
    const sede = contents.sede || contents.Sede;
    const horarioSeleccionado = contents.horarioSeleccionado || contents.Horario_Seleccionado;
    const idHorario = contents.idHorario || contents.ID_Horario;
    const fileData = contents.fileBase64; // String en Base64
    const fileName = contents.fileName || ("Comprobante_" + idCliente + "_" + new Date().getTime() + ".pdf");
    const mimeType = contents.fileMimeType || "application/pdf";
    
    if (!idCliente || !nombreAlumna || !sede || !horarioSeleccionado) {
      return responseJSON({ success: false, message: "Faltan datos obligatorios para completar la inscripción." });
    }
    
    // 1. Guardar comprobante en Google Drive (con validación estricta de seguridad)
    let driveFileUrl = "Sin comprobante";
    if (fileData) {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      const cleanMime = allowedMimes.indexOf(mimeType) !== -1 ? mimeType : "application/pdf";
      const cleanName = (fileName || ("Comprobante_" + idCliente + ".pdf")).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);

      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const cleanBase64 = fileData.replace(/^data:.*?;base64,/, "");
      const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), cleanMime, cleanName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileUrl = file.getUrl();
    }
    
    // 2. Generar ID de Registro único y Fecha
    const fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");
    const idRegistro = "INS-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    
    // Helper para neutralizar inyección de fórmulas CSV (=,+,-,@)
    function sanitizeForSheet(val) {
      if (typeof val === "string" && /^[=+\\-@\\t\\r]/.test(val)) {
        return "'" + val;
      }
      return val;
    }

    // 3. Registrar fila en pestaña 'Inscripciones'
    const inscripcionesSheet = sheet.getSheetByName("Inscripciones");
    inscripcionesSheet.appendRow([
      sanitizeForSheet(idRegistro),
      sanitizeForSheet(fechaRegistro),
      sanitizeForSheet(idCliente),
      sanitizeForSheet(nombreAlumna),
      sanitizeForSheet(sede),
      sanitizeForSheet(horarioSeleccionado),
      driveFileUrl,
      "Pendiente", // Estado_Inscripcion
      "NO"        // Notificado_Confirmacion
    ]);
    
    // 4. Incrementar Cupos_Ocupados en la pestaña 'Sedes_Horarios'
    actualizarCupoHorario(sheet, idHorario, horarioSeleccionado, sede);
    
    // 5. Enviar correo automático de recepción al representante
    const datosAlumna = buscarAlumnaPorID(sheet, idCliente);
    if (datosAlumna.success && datosAlumna.data.Email) {
      enviarCorreoRecepcion(
        datosAlumna.data.Email,
        datosAlumna.data.Nombre_Representante,
        nombreAlumna,
        sede,
        horarioSeleccionado,
        idRegistro
      );
    }
    
    result = {
      success: true,
      message: "¡Inscripción recibida con éxito! Tu comprobante está en revisión.",
      ID_Registro: idRegistro,
      URL_Comprobante_Drive: driveFileUrl
    };
    
  } catch (error) {
    result = {
      success: false,
      message: "Error al procesar solicitud: " + error.toString()
    };
  }
  
  return responseJSON(result);
}

/**
 * 🔍 Helper: Normalizar correos en Apps Script eliminando espacios, saltos de línea y acentos
 */
function normalizarEmailGAS(str) {
  if (!str) return "";
  return str.toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff\s]/g, "")
    .trim();
}

/**
 * 🔍 Helper: Buscar datos de la alumna por Correo Electrónico (o Cédula / Teléfono / Nombre)
 */
function buscarAlumnaPorID(sheet, searchParam) {
  const alumnosSheet = sheet.getSheetByName("Alumnas_Niveles");
  if (!alumnosSheet) return { success: false, message: "No se encontró la pestaña 'Alumnas_Niveles' en la hoja de cálculo." };
  const data = alumnosSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "No hay registros cargados en la pestaña 'Alumnas_Niveles'." };
  
  const rawSearch = (searchParam || "").toString().trim();
  const cleanEmail = normalizarEmailGAS(rawSearch);
  const cleanDigits = rawSearch.replace(/\D/g, "");
  const cleanNameQuery = rawSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  // Detección dinámica y semántica de encabezados de columnas (independiente del orden o idioma)
  const headers = data[0].map(function(h) {
    return (h || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  });
  
  var colId = -1, colRep = -1, colTel = -1, colEmail = -1, colAlumna = -1, colNivel = -1, colEstado = -1;
  
  for (var h = 0; h < headers.length; h++) {
    var hName = headers[h];
    if (colEmail === -1 && (hName.indexOf("email") !== -1 || hName.indexOf("correo") !== -1 || hName.indexOf("mail") !== -1)) {
      colEmail = h;
    } else if (colAlumna === -1 && (hName.indexOf("alumn") !== -1 || hName.indexOf("estudiant") !== -1 || (hName.indexOf("nombre") !== -1 && hName.indexOf("rep") === -1 && hName.indexOf("tutor") === -1 && hName.indexOf("padre") === -1 && hName.indexOf("titular") === -1))) {
      colAlumna = h;
    } else if (colRep === -1 && (hName.indexOf("represent") !== -1 || hName.indexOf("tutor") !== -1 || hName.indexOf("padre") !== -1 || hName.indexOf("madre") !== -1 || hName.indexOf("titular") !== -1 || (hName.indexOf("nombre") !== -1 && hName.indexOf("alumn") === -1))) {
      colRep = h;
    } else if (colId === -1 && (hName.indexOf("id") !== -1 || hName.indexOf("cedula") !== -1 || hName.indexOf("identific") !== -1 || hName.indexOf("dni") !== -1 || hName.indexOf("codigo") !== -1)) {
      colId = h;
    } else if (colTel === -1 && (hName.indexOf("tel") !== -1 || hName.indexOf("cel") !== -1 || hName.indexOf("whats") !== -1 || hName.indexOf("movil") !== -1 || hName.indexOf("contact") !== -1)) {
      colTel = h;
    } else if (colNivel === -1 && (hName.indexOf("nivel") !== -1 || hName.indexOf("categor") !== -1 || hName.indexOf("grupo") !== -1)) {
      colNivel = h;
    } else if (colEstado === -1 && (hName.indexOf("estado") !== -1 || hName.indexOf("status") !== -1 || hName.indexOf("activ") !== -1)) {
      colEstado = h;
    }
  }

  // Fallbacks por posición estándar si no se identificaron encabezados
  if (colId === -1) colId = 0;
  if (colRep === -1) colRep = 1;
  if (colTel === -1) colTel = 2;
  if (colEmail === -1) colEmail = 3;
  if (colAlumna === -1) colAlumna = 4;
  if (colNivel === -1) colNivel = 5;
  if (colEstado === -1) colEstado = 6;
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var idCliente = row[colId] ? row[colId].toString().replace(/\D/g, "") : "";
    var cellEmailRaw = row[colEmail] ? row[colEmail].toString() : "";
    var emailNorm = normalizarEmailGAS(cellEmailRaw);
    var telefono = row[colTel] ? row[colTel].toString().replace(/\D/g, "") : "";
    var nombreAlumna = row[colAlumna] ? row[colAlumna].toString().trim() : "";
    var nombreRep = row[colRep] ? row[colRep].toString().trim() : "";
    var nombreAlumnaNorm = nombreAlumna.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var nombreRepNorm = nombreRep.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var estado = row[colEstado] ? row[colEstado].toString().trim() : "Activo";
    
    // 1. Coincidencia por correo (exacto, subcadena o múltiples correos)
    var matchEmail = false;
    if (cleanEmail && emailNorm) {
      matchEmail = (emailNorm === cleanEmail) || 
                   (emailNorm.indexOf(cleanEmail) !== -1) || 
                   (cleanEmail.indexOf(emailNorm) !== -1);
    }

    // 2. Coincidencia por cédula/teléfono
    var matchDigits = cleanDigits && cleanDigits.length >= 4 && (idCliente === cleanDigits || telefono.indexOf(cleanDigits) !== -1);

    // 3. Coincidencia por nombre
    var matchName = !matchEmail && cleanNameQuery.length >= 4 && (nombreAlumnaNorm.indexOf(cleanNameQuery) !== -1 || nombreRepNorm.indexOf(cleanNameQuery) !== -1);
    
    // 4. Búsqueda de rescate en cualquier celda de la fila
    var matchAnyCell = false;
    if (!matchEmail && !matchDigits && !matchName && cleanEmail.length >= 5) {
      for (var c = 0; c < row.length; c++) {
        var cellStr = normalizarEmailGAS(row[c]);
        if (cellStr && (cellStr === cleanEmail || cellStr.indexOf(cleanEmail) !== -1)) {
          matchAnyCell = true;
          break;
        }
      }
    }
    
    if (matchEmail || matchDigits || matchName || matchAnyCell) {
      if (estado.toLowerCase() === "inactivo") {
        return { 
          success: false, 
          message: "La alumna figura como inactiva. Por favor contáctanos directamente para reactivar su ficha." 
        };
      }
      
      return {
        success: true,
        data: {
          ID_Cliente: row[colId] || idCliente,
          Nombre_Representante: row[colRep] || nombreRep,
          Telefono_WhatsApp: row[colTel] || telefono,
          Email: row[colEmail] || cellEmailRaw || cleanEmail,
          Nombre_Alumna: row[colAlumna] || nombreAlumna,
          Nivel_Asignado: row[colNivel] || "Básico",
          Estado: estado
        }
      };
    }
  }
  
  return { 
    success: false, 
    message: "No encontramos una alumna registrada con el correo (" + rawSearch + "). Puedes registrar tu ficha rápida ahora o verificar con secretaría." 
  };
}

/**
 * 💾 Helper: Guardar o Actualizar Alumna en 'Alumnas_Niveles'
 */
function guardarOActualizarAlumnaEnSheet(sheet, studentData) {
  var alumnosSheet = sheet.getSheetByName("Alumnas_Niveles");
  if (!alumnosSheet) {
    alumnosSheet = sheet.insertSheet("Alumnas_Niveles");
    alumnosSheet.appendRow([
      "ID_Cliente",
      "Nombre_Representante",
      "Telefono_WhatsApp",
      "Email",
      "Nombre_Alumna",
      "Nivel_Asignado",
      "Estado"
    ]);
  }

  function sanitize(val) {
    if (typeof val === "string" && /^[=+\-@\t\r]/.test(val)) {
      return "'" + val;
    }
    return val || "";
  }

  var idCliente = (studentData.ID_Cliente || studentData.idCliente || ("" + Math.floor(1700000000 + Math.random() * 900000000))).toString().trim();
  var email = (studentData.Email || studentData.email || "").toString().trim();
  var normEmail = normalizarEmailGAS(email);
  var nombreAlumna = (studentData.Nombre_Alumna || studentData.nombreAlumna || "").toString().trim();
  var nombreRep = (studentData.Nombre_Representante || studentData.nombreRepresentante || nombreAlumna).toString().trim();
  var telefono = (studentData.Telefono_WhatsApp || studentData.telefonoWhatsApp || "").toString().trim();
  var nivel = (studentData.Nivel_Asignado || studentData.nivelAsignado || "Básico").toString().trim();
  var estado = (studentData.Estado || studentData.estado || "Activo").toString().trim();

  var data = alumnosSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var rowId = data[i][0] ? data[i][0].toString().trim() : "";
    var rowEmail = data[i][3] ? normalizarEmailGAS(data[i][3]) : "";

    if ((idCliente && rowId === idCliente) || (normEmail && rowEmail === normEmail)) {
      alumnosSheet.getRange(i + 1, 1, 1, 7).setValues([[
        sanitize(idCliente),
        sanitize(nombreRep),
        sanitize(telefono),
        sanitize(email.toLowerCase()),
        sanitize(nombreAlumna),
        sanitize(nivel),
        sanitize(estado)
      ]]);
      return { success: true, message: "Ficha de " + nombreAlumna + " actualizada en Google Sheets." };
    }
  }

  alumnosSheet.appendRow([
    sanitize(idCliente),
    sanitize(nombreRep),
    sanitize(telefono),
    sanitize(email.toLowerCase()),
    sanitize(nombreAlumna),
    sanitize(nivel),
    sanitize(estado)
  ]);

  return { success: true, message: "Ficha de " + nombreAlumna + " registrada con éxito en Google Sheets." };
}

/**
 * 👥 Helper: Obtener TODAS las alumnas registradas en la pestaña 'Alumnas_Niveles'
 */
function obtenerTodasLasAlumnas(sheet) {
  const alumnosSheet = sheet.getSheetByName("Alumnas_Niveles");
  if (!alumnosSheet) {
    return { success: false, message: "No se encontró la pestaña 'Alumnas_Niveles' en la hoja." };
  }
  const data = alumnosSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, data: [], message: "No hay registros en la pestaña 'Alumnas_Niveles'." };
  }

  // Detección dinámica de columnas
  const headers = data[0].map(function(h) {
    return (h || "").toString().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  });

  var colId = -1, colRep = -1, colTel = -1, colEmail = -1, colAlumna = -1, colNivel = -1, colEstado = -1;
  for (var h = 0; h < headers.length; h++) {
    var hName = headers[h];
    if (colEmail === -1 && (hName.indexOf("email") !== -1 || hName.indexOf("correo") !== -1 || hName.indexOf("mail") !== -1)) colEmail = h;
    else if (colAlumna === -1 && (hName.indexOf("alumn") !== -1 || hName.indexOf("estudiant") !== -1 || (hName.indexOf("nombre") !== -1 && hName.indexOf("rep") === -1 && hName.indexOf("tutor") === -1 && hName.indexOf("padre") === -1))) colAlumna = h;
    else if (colRep === -1 && (hName.indexOf("represent") !== -1 || hName.indexOf("tutor") !== -1 || hName.indexOf("padre") !== -1 || hName.indexOf("madre") !== -1 || hName.indexOf("titular") !== -1)) colRep = h;
    else if (colId === -1 && (hName.indexOf("id") !== -1 || hName.indexOf("cedula") !== -1 || hName.indexOf("identific") !== -1 || hName.indexOf("dni") !== -1)) colId = h;
    else if (colTel === -1 && (hName.indexOf("tel") !== -1 || hName.indexOf("cel") !== -1 || hName.indexOf("whats") !== -1 || hName.indexOf("movil") !== -1)) colTel = h;
    else if (colNivel === -1 && (hName.indexOf("nivel") !== -1 || hName.indexOf("categor") !== -1 || hName.indexOf("grupo") !== -1)) colNivel = h;
    else if (colEstado === -1 && (hName.indexOf("estado") !== -1 || hName.indexOf("status") !== -1 || hName.indexOf("activ") !== -1)) colEstado = h;
  }

  if (colId === -1) colId = 0;
  if (colRep === -1) colRep = 1;
  if (colTel === -1) colTel = 2;
  if (colEmail === -1) colEmail = 3;
  if (colAlumna === -1) colAlumna = 4;
  if (colNivel === -1) colNivel = 5;
  if (colEstado === -1) colEstado = 6;

  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colId] && !row[colAlumna] && !row[colEmail]) continue; // Fila vacía
    list.push({
      ID_Cliente: row[colId] ? row[colId].toString().trim() : "",
      Nombre_Representante: row[colRep] ? row[colRep].toString().trim() : "",
      Telefono_WhatsApp: row[colTel] ? row[colTel].toString().trim() : "",
      Email: row[colEmail] ? row[colEmail].toString().trim() : "",
      Nombre_Alumna: row[colAlumna] ? row[colAlumna].toString().trim() : "",
      Nivel_Asignado: row[colNivel] ? row[colNivel].toString().trim() : "Principiante",
      Estado: row[colEstado] ? row[colEstado].toString().trim() : "Activo"
    });
  }

  return {
    success: true,
    data: list,
    message: "Se recuperaron " + list.length + " alumnas exitosamente."
  };
}

/**
 * 📋 Helper: Obtener TODAS las inscripciones registradas en la pestaña 'Inscripciones'
 */
function obtenerTodasLasInscripciones(sheet) {
  const inscripcionesSheet = sheet.getSheetByName("Inscripciones");
  if (!inscripcionesSheet) {
    return { success: false, message: "No se encontró la pestaña 'Inscripciones' en la hoja." };
  }
  const data = inscripcionesSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, data: [], message: "No hay inscripciones registradas." };
  }

  const list = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[2]) continue;
    list.push({
      ID_Registro: row[0] ? row[0].toString().trim() : "",
      Fecha_Registro: row[1] ? Utilities.formatDate(new Date(row[1]), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss") : "",
      ID_Cliente: row[2] ? row[2].toString().trim() : "",
      Nombre_Alumna: row[3] ? row[3].toString().trim() : "",
      Sede: row[4] ? row[4].toString().trim() : "",
      Horario_Seleccionado: row[5] ? row[5].toString().trim() : "",
      URL_Comprobante_Drive: row[6] ? row[6].toString().trim() : "Sin comprobante",
      Estado_Inscripcion: row[7] ? row[7].toString().trim() : "Pendiente",
      Notificado_Confirmacion: row[8] ? row[8].toString().trim() : "NO"
    });
  }

  return {
    success: true,
    data: list,
    message: "Se recuperaron " + list.length + " inscripciones exitosamente."
  };
}

/**
 * 📅 Helper: Obtener sedes y horarios disponibles filtrados por Nivel
 */
function obtenerHorariosPorNivel(sheet, nivelRequerido) {
  const horariosSheet = sheet.getSheetByName("Sedes_Horarios");
  const data = horariosSheet.getDataRange().getValues();
  const horariosDisponibles = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idHorario = row[0];
    const sede = row[1];
    const nivel = row[2];
    const dia = row[3];
    let horario = row[4];

    // Formatear fechas/horas si Google Sheets devuelve objeto Date
    if (horario instanceof Date) {
      horario = Utilities.formatDate(horario, "America/Guayaquil", "HH:mm");
    } else if (horario && typeof horario === "string" && horario.indexOf("1899-12-30") !== -1) {
      try {
        var d = new Date(horario);
        horario = Utilities.formatDate(d, "America/Guayaquil", "HH:mm");
      } catch(e) {}
    }

    const cupoMax = Number(row[5]) || 0;
    const cuposOcupados = Number(row[6]) || 0;
    let estadoHorario = row[7];
    
    // Si los cupos están llenos, forzar estado Lleno
    if (cuposOcupados >= cupoMax) {
      estadoHorario = "Lleno";
    }
    
    // Filtrar por nivel requerido (o mostrar todos si no especifica)
    if (!nivelRequerido || nivel.toLowerCase().trim() === nivelRequerido.toLowerCase().trim()) {
      horariosDisponibles.push({
        ID_Horario: idHorario,
        Sede: sede,
        Nivel_Requerido: nivel,
        Dia: dia,
        Horario: horario,
        Cupo_Maximo: cupoMax,
        Cupos_Ocupados: cuposOcupados,
        Estado_Horario: (cuposOcupados < cupoMax) ? "Disponible" : "Lleno"
      });
    }
  }
  
  return {
    success: true,
    data: horariosDisponibles
  };
}

/**
 * ➕ Helper: Incrementar Cupos_Ocupados +1 en Sedes_Horarios
 */
function actualizarCupoHorario(sheet, idHorario, textoHorario, sede) {
  const horariosSheet = sheet.getSheetByName("Sedes_Horarios");
  const data = horariosSheet.getDataRange().getValues();
  const idList = idHorario ? idHorario.toString().split(",").map(function(s){ return s.trim(); }) : [];
  
  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][0] ? data[i][0].toString().trim() : "";
    const rowSede = data[i][1] ? data[i][1].toString().trim() : "";
    const rowDia = data[i][3] ? data[i][3].toString().trim() : "";
    const rowHorario = data[i][4] ? data[i][4].toString().trim() : "";
    
    // Coincidencia por ID o por Texto + Sede
    const matchesId = idList.indexOf(rowId) !== -1;
    const matchesTexto = (rowSede === sede || !sede) && (
      (rowHorario && textoHorario.indexOf(rowHorario) !== -1) || 
      (rowDia && textoHorario.indexOf(rowDia) !== -1)
    );

    if (matchesId || matchesTexto) {
      const currentOccupied = Number(data[i][6]) || 0;
      const maxCupos = Number(data[i][5]) || 0;
      const newOccupied = currentOccupied + 1;
      
      // Actualizar columna Cupos_Ocupados (columna G -> 7)
      horariosSheet.getRange(i + 1, 7).setValue(newOccupied);
      
      // Actualizar columna Estado_Horario (columna H -> 8)
      if (newOccupied >= maxCupos) {
        horariosSheet.getRange(i + 1, 8).setValue("Lleno");
      }
    }
  }
}

/**
 * 💾 Helper: Guardar o Editar un Horario en la pestaña 'Sedes_Horarios'
 */
function guardarOActualizarHorarioEnSheet(sheet, payload) {
  const horariosSheet = sheet.getSheetByName("Sedes_Horarios");
  const data = horariosSheet.getDataRange().getValues();
  
  const idHorario = payload.idHorario || payload.ID_Horario || ("HOR-" + Utilities.formatDate(new Date(), "America/Guayaquil", "mmss"));
  const sede = payload.sede || payload.Sede || "Sede Principal";
  const nivel = payload.nivelRequerido || payload.Nivel_Requerido || "Principiante";
  const dia = payload.dia || payload.Dia || "Lunes y Miércoles";
  const horario = payload.horario || payload.Horario || "16:00 - 17:30";
  const cupoMax = Number(payload.cupoMaximo || payload.Cupo_Maximo) || 10;
  const cuposOcupados = Number(payload.cuposOcupados || payload.Cupos_Ocupados) || 0;
  const estado = cuposOcupados >= cupoMax ? "Lleno" : (payload.estadoHorario || payload.Estado_Horario || "Disponible");

  let foundIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === idHorario.toString().trim()) {
      foundIndex = i + 1; // 1-based row index in sheet
      break;
    }
  }

  if (foundIndex > 0) {
    // Editar fila existente
    horariosSheet.getRange(foundIndex, 1, 1, 8).setValues([[
      idHorario,
      sede,
      nivel,
      dia,
      horario,
      cupoMax,
      cuposOcupados,
      estado
    ]]);
    return {
      success: true,
      message: "Horario " + idHorario + " actualizado exitosamente en Google Sheets.",
      ID_Horario: idHorario
    };
  } else {
    // Agregar nueva fila
    horariosSheet.appendRow([
      idHorario,
      sede,
      nivel,
      dia,
      horario,
      cupoMax,
      cuposOcupados,
      estado
    ]);
    return {
      success: true,
      message: "Nuevo horario " + idHorario + " registrado exitosamente en Google Sheets.",
      ID_Horario: idHorario
    };
  }
}

/**
 * 🗑️ Helper: Eliminar Horario de la pestaña 'Sedes_Horarios'
 */
function eliminarHorarioDeSheet(sheet, idHorario) {
  if (!idHorario) return { success: false, message: "ID_Horario requerido para eliminar." };
  const horariosSheet = sheet.getSheetByName("Sedes_Horarios");
  const data = horariosSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim() === idHorario.toString().trim()) {
      horariosSheet.deleteRow(i + 1);
      return {
        success: true,
        message: "Horario " + idHorario + " eliminado de Google Sheets."
      };
    }
  }
  return { success: false, message: "No se encontró el horario " + idHorario + " en Google Sheets." };
}

/**
 * 🔄 Helper: Sincronizar Masivamente Todos los Horarios
 */
function sincronizarTodosLosHorarios(sheet, schedulesList) {
  if (!Array.isArray(schedulesList) || schedulesList.length === 0) {
    return { success: false, message: "La lista de horarios enviada está vacía." };
  }
  const horariosSheet = sheet.getSheetByName("Sedes_Horarios");
  
  // Limpiar datos previos manteniendo encabezados
  const lastRow = horariosSheet.getLastRow();
  if (lastRow > 1) {
    horariosSheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }
  
  const rows = schedulesList.map(function(item) {
    var maxC = Number(item.Cupo_Maximo) || 10;
    var occC = Number(item.Cupos_Ocupados) || 0;
    var est = occC >= maxC ? "Lleno" : (item.Estado_Horario || "Disponible");
    return [
      item.ID_Horario,
      item.Sede,
      item.Nivel_Requerido,
      item.Dia,
      item.Horario,
      maxC,
      occC,
      est
    ];
  });
  
  horariosSheet.getRange(2, 1, rows.length, 8).setValues(rows);
  return {
    success: true,
    message: "Se sincronizaron " + rows.length + " horarios en Google Sheets."
  };
}

/**
 * 📋 Helper: Obtener todos los registros de Lista de Espera
 */
function obtenerTodaListaEspera(sheet) {
  let esperaSheet = sheet.getSheetByName("Lista_Espera");
  if (!esperaSheet) {
    esperaSheet = sheet.insertSheet("Lista_Espera");
    esperaSheet.appendRow([
      "ID_Espera",
      "Fecha_Registro",
      "ID_Cliente",
      "Nombre_Alumna",
      "Email",
      "Telefono_WhatsApp",
      "ID_Horario",
      "Sede",
      "Nivel_Requerido",
      "Dia",
      "Horario",
      "Estado_Espera",
      "Notas"
    ]);
    return { success: true, data: [] };
  }

  const data = esperaSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };

  const entries = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    entries.push({
      ID_Espera: String(row[0]),
      Fecha_Registro: String(row[1]),
      ID_Cliente: String(row[2]),
      Nombre_Alumna: String(row[3]),
      Email: String(row[4]),
      Telefono_WhatsApp: String(row[5]),
      ID_Horario: String(row[6]),
      Sede: String(row[7]),
      Nivel_Requerido: String(row[8]),
      Dia: String(row[9]),
      Horario: String(row[10]),
      Estado_Espera: String(row[11] || "Pendiente"),
      Notas: String(row[12] || "")
    });
  }

  return { success: true, data: entries };
}

/**
 * 📝 Helper: Registrar Alumna en Lista de Espera
 */
function registrarEnListaEspera(sheet, contents) {
  let esperaSheet = sheet.getSheetByName("Lista_Espera");
  if (!esperaSheet) {
    esperaSheet = sheet.insertSheet("Lista_Espera");
    esperaSheet.appendRow([
      "ID_Espera",
      "Fecha_Registro",
      "ID_Cliente",
      "Nombre_Alumna",
      "Email",
      "Telefono_WhatsApp",
      "ID_Horario",
      "Sede",
      "Nivel_Requerido",
      "Dia",
      "Horario",
      "Estado_Espera",
      "Notas"
    ]);
  }

  const fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");
  const idEspera = "ESP-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

  function sanitize(val) {
    if (typeof val === "string" && /^[=+\\-@\\t\\r]/.test(val)) {
      return "'" + val;
    }
    return val || "";
  }

  esperaSheet.appendRow([
    sanitize(idEspera),
    sanitize(fechaRegistro),
    sanitize(contents.ID_Cliente || contents.idCliente),
    sanitize(contents.Nombre_Alumna || contents.nombreAlumna),
    sanitize(contents.Email || contents.email),
    sanitize(contents.Telefono_WhatsApp || contents.telefonoWhatsApp),
    sanitize(contents.ID_Horario || contents.idHorario),
    sanitize(contents.Sede || contents.sede),
    sanitize(contents.Nivel_Requerido || contents.nivelRequerido),
    sanitize(contents.Dia || contents.dia),
    sanitize(contents.Horario || contents.horario),
    "Pendiente",
    sanitize(contents.Notas || contents.notas || "")
  ]);

  return {
    success: true,
    message: "¡Te has unido con éxito a la lista de espera! Te contactaremos apenas se libere un cupo.",
    ID_Espera: idEspera
  };
}

/**
 * ✏️ Helper: Actualizar Estado en Lista de Espera
 */
function actualizarEstadoListaEspera(sheet, idEspera, nuevoEstado) {
  const esperaSheet = sheet.getSheetByName("Lista_Espera");
  if (!esperaSheet) return { success: false, message: "No se encontró la pestaña Lista_Espera." };

  const data = esperaSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEspera)) {
      esperaSheet.getRange(i + 1, 12).setValue(nuevoEstado || "Pendiente");
      return { success: true, message: "Estado de lista de espera actualizado." };
    }
  }

  return { success: false, message: "No se encontró el registro en la lista de espera." };
}

/**
 * 📧 Correo 1: Confirmación inmediata de recepción de comprobante con Plantilla HTML Profesional
 */
function enviarCorreoRecepcion(emailDestino, representante, alumna, sede, horario, idRegistro) {
  const asunto = "📋 Recibimos tu solicitud de inscripción #" + idRegistro + " - " + NOMBRE_ACADEMIA;
  
  const cuerpoPlano = "Estimado/a " + representante + ",\\n\\n" +
    "Hemos recibido con éxito el comprobante de pago para la inscripción de " + alumna + ".\\n\\n" +
    "📌 DETALLES DE LA RESERVA:\\n" +
    "・ Código de Registro: " + idRegistro + "\\n" +
    "・ Sede: " + sede + "\\n" +
    "・ Horario: " + horario + "\\n" +
    "・ Estado actual: En revisión por tesorería.\\n\\n" +
    "En las próximas horas validaremos la transferencia y recibirás un correo con la confirmación definitiva de tu cupo.\\n\\n" +
    "¡Gracias por confiar en " + NOMBRE_ACADEMIA + "!\\n" +
    "Contacto: " + EMAIL_CONTACTO;

  const htmlBody = '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Recepción de Inscripción</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">' +
    '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 24px 0;">' +
    '  <tr>' +
    '    <td align="center">' +
    '      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">' +
    '        <!-- Header Gradient Banner -->' +
    '        <tr>' +
    '          <td style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #1e1b4b 100%); padding: 36px 32px; text-align: center; color: #ffffff;">' +
    '            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.18); color: #e0e7ff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">' +
    '              Comprobante Recibido' +
    '            </div>' +
    '            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">' + NOMBRE_ACADEMIA + '</h1>' +
    '            <p style="margin: 8px 0 0 0; font-size: 14px; color: #c7d2fe;">Solicitud de Inscripción & Reserva de Cupo</p>' +
    '          </td>' +
    '        </tr>' +
    '        <!-- Body Content -->' +
    '        <tr>' +
    '          <td style="padding: 32px;">' +
    '            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 0;">' +
    '              Estimado/a <strong style="color: #0f172a;">' + representante + '</strong>,' +
    '            </p>' +
    '            <p style="font-size: 15px; line-height: 1.6; color: #475569;">' +
    '              Hemos recibido con éxito el comprobante de pago para la inscripción de <strong style="color: #4f46e5;">' + alumna + '</strong>. Tu solicitud ha ingresado al proceso de revisión por parte de tesorería.' +
    '            </p>' +
    '            <!-- Status Card -->' +
    '            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 5px solid #f59e0b; border-radius: 12px; padding: 16px; margin: 24px 0;">' +
    '              <div style="font-size: 12px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Estado de la Solicitud</div>' +
    '              <div style="font-size: 17px; font-weight: 800; color: #92400e; margin-top: 4px;">⏳ En Revisión por Tesorería</div>' +
    '            </div>' +
    '            <!-- Details Card -->' +
    '            <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 24px;">' +
    '              <h3 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">📋 Resumen de la Reserva</h3>' +
    '              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">' +
    '                <tr>' +
    '                  <td style="padding: 8px 0; color: #64748b; width: 40%;">Código Registro:</td>' +
    '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; font-family: monospace;">' + idRegistro + '</td>' +
    '                </tr>' +
    '                <tr>' +
    '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Alumna:</td>' +
    '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">' + alumna + '</td>' +
    '                </tr>' +
    '                <tr>' +
    '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Sede:</td>' +
    '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">' + sede + '</td>' +
    '                </tr>' +
    '                <tr>' +
    '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Horario Seleccionado:</td>' +
    '                  <td style="padding: 8px 0; font-weight: 700; color: #4f46e5; border-top: 1px solid #e2e8f0;">' + horario + '</td>' +
    '                </tr>' +
    '              </table>' +
    '            </div>' +
    '            <!-- Info Box -->' +
    '            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; font-size: 14px; color: #166534; line-height: 1.5; margin-bottom: 24px;">' +
    '              💡 <strong>¿Qué sucede ahora?</strong><br>' +
    '              Nuestro equipo administrativo validará la transferencia. Tan pronto sea aprobada, recibirás la confirmación definitiva de tu cupo por este medio.' +
    '            </div>' +
    '            <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">' +
    '              Si tienes inquietudes, comunícate a <a href="mailto:' + EMAIL_CONTACTO + '" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">' + EMAIL_CONTACTO + '</a>' +
    '            </p>' +
    '          </td>' +
    '        </tr>' +
    '        <!-- Footer -->' +
    '        <tr>' +
    '          <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">' +
    '            <strong style="color: #f8fafc; font-size: 13px;">' + NOMBRE_ACADEMIA + '</strong><br>' +
    '            Sistema Automatizado de Inscripciones & Gestor de Cupos<br>' +
    '            © ' + new Date().getFullYear() + ' Todos los derechos reservados.' +
    '          </td>' +
    '        </tr>' +
    '      </table>' +
    '    </td>' +
    '  </tr>' +
    '</table>' +
    '</body>' +
    '</html>';
    
  try {
    GmailApp.sendEmail(emailDestino, asunto, cuerpoPlano, {
      htmlBody: htmlBody,
      name: NOMBRE_ACADEMIA
    });
  } catch (err) {
    Logger.log("Error enviando email de recepción: " + err.toString());
  }
}

/**
 * 🔔 TRIGGER DE CONFIRMACIÓN FINAL AUTOMÁTICA con Plantilla HTML Profesional
 * Revisa filas en 'Inscripciones' donde Estado_Inscripcion == "Confirmado" y Notificado_Confirmacion == "NO"
 */
function enviarConfirmacionFinal() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const inscripcionesSheet = sheet.getSheetByName("Inscripciones");
  const data = inscripcionesSheet.getDataRange().getValues();
  
  if (data.length <= 1) return;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idRegistro = row[0];
    const idCliente = row[2];
    const alumna = row[3];
    const sede = row[4];
    const horario = row[5];
    const estadoInscripcion = row[7] ? row[7].toString().trim() : "";
    const notificado = row[8] ? row[8].toString().trim() : "NO";
    
    // Si la administración cambió manualmente a "Confirmado" y aún no se le notificó:
    if (estadoInscripcion.toLowerCase() === "confirmado" && notificado.toUpperCase() === "NO") {
      const datosAlumna = buscarAlumnaPorID(sheet, idCliente);
      
      if (datosAlumna.success && datosAlumna.data.Email) {
        const emailDestino = datosAlumna.data.Email;
        const representante = datosAlumna.data.Nombre_Representante;
        
        const asunto = "🎉 ¡CUPO CONFIRMADO! Inscripción Definitiva #" + idRegistro + " - " + NOMBRE_ACADEMIA;
        
        const cuerpoPlano = "Estimado/a " + representante + ",\\n\\n" +
          "¡Nos complace informarte que el pago ha sido validado exitosamente!\\n\\n" +
          "✅ El cupo de " + alumna + " ha sido reservado definitivamente.\\n\\n" +
          "📌 RESUMEN DE LA RESERVA:\\n" +
          "・ Código: " + idRegistro + "\\n" +
          "・ Alumna: " + alumna + "\\n" +
          "・ Sede: " + sede + "\\n" +
          "・ Horario Reservado: " + horario + "\\n\\n" +
          "Por favor preséntate 10 minutos antes del inicio de la primera clase con ropa adecuada.\\n\\n" +
          "¡Te esperamos con entusiasmo!\\n\\n" +
          "Atentamente,\\n" +
          NOMBRE_ACADEMIA + "\\n" +
          EMAIL_CONTACTO;

        const htmlBody = '<!DOCTYPE html>' +
          '<html lang="es">' +
          '<head>' +
          '<meta charset="UTF-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
          '<title>Inscripción Confirmada</title>' +
          '</head>' +
          '<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">' +
          '<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 24px 0;">' +
          '  <tr>' +
          '    <td align="center">' +
          '      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">' +
          '        <!-- Header Green Gradient Banner -->' +
          '        <tr>' +
          '          <td style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%); padding: 36px 32px; text-align: center; color: #ffffff;">' +
          '            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: #ecfdf5; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 16px; border-radius: 50px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">' +
          '              🎉 ¡Inscripción Aprobada!' +
          '            </div>' +
          '            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">' + NOMBRE_ACADEMIA + '</h1>' +
          '            <p style="margin: 8px 0 0 0; font-size: 14px; color: #a7f3d0;">Confirmación Definitiva de Cupo Reservado</p>' +
          '          </td>' +
          '        </tr>' +
          '        <!-- Body Content -->' +
          '        <tr>' +
          '          <td style="padding: 32px;">' +
          '            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 0;">' +
          '              Estimado/a <strong style="color: #0f172a;">' + representante + '</strong>,' +
          '            </p>' +
          '            <p style="font-size: 15px; line-height: 1.6; color: #475569;">' +
          '              ¡Excelentes noticias! El comprobante de pago ha sido validado exitosamente por nuestra área financiera. El cupo para <strong style="color: #059669;">' + alumna + '</strong> ha sido oficialmente reservado.' +
          '            </p>' +
          '            <!-- Success Card -->' +
          '            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #10b981; border-radius: 12px; padding: 16px; margin: 24px 0;">' +
          '              <div style="font-size: 12px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Estado de la Matrícula</div>' +
          '              <div style="font-size: 17px; font-weight: 800; color: #166534; margin-top: 4px;">✅ Cupo Confirmado & Activo</div>' +
          '            </div>' +
          '            <!-- Details Table -->' +
          '            <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 24px;">' +
          '              <h3 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">📌 Ficha de la Alumna Inscrita</h3>' +
          '              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155;">' +
          '                <tr>' +
          '                  <td style="padding: 8px 0; color: #64748b; width: 40%;">Código Reserva:</td>' +
          '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; font-family: monospace;">' + idRegistro + '</td>' +
          '                </tr>' +
          '                <tr>' +
          '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Alumna:</td>' +
          '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">' + alumna + '</td>' +
          '                </tr>' +
          '                <tr>' +
          '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Sede Asignada:</td>' +
          '                  <td style="padding: 8px 0; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">' + sede + '</td>' +
          '                </tr>' +
          '                <tr>' +
          '                  <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Horario Confirmado:</td>' +
          '                  <td style="padding: 8px 0; font-weight: 700; color: #059669; border-top: 1px solid #e2e8f0;">' + horario + '</td>' +
          '                </tr>' +
          '              </table>' +
          '            </div>' +
          '            <!-- Guidance Box -->' +
          '            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; font-size: 14px; color: #1e40af; line-height: 1.6; margin-bottom: 24px;">' +
          '              <strong style="font-size: 15px; color: #1e3a8a;">✨ Indicaciones para la Primera Clase:</strong>' +
          '              <ul style="margin: 8px 0 0 0; padding-left: 20px;">' +
          '                <li>Llegar 10 minutos antes para registrarse en recepción.</li>' +
          '                <li>Vestir ropa cómoda / deportiva (malla, leggins o camiseta flexible).</li>' +
          '                <li>Llevar su propio termo con agua personal identificada.</li>' +
          '              </ul>' +
          '            </div>' +
          '            <p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">' +
          '              ¡Esperamos con gran entusiasmo el inicio de clases!<br>' +
          '              Consultas directas al email: <a href="mailto:' + EMAIL_CONTACTO + '" style="color: #059669; font-weight: 600; text-decoration: underline;">' + EMAIL_CONTACTO + '</a>' +
          '            </p>' +
          '          </td>' +
          '        </tr>' +
          '        <!-- Footer -->' +
          '        <tr>' +
          '          <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">' +
          '            <strong style="color: #f8fafc; font-size: 13px;">' + NOMBRE_ACADEMIA + '</strong><br>' +
          '            Notificaciones de Confirmación de Matrícula<br>' +
          '            © ' + new Date().getFullYear() + ' Todos los derechos reservados.' +
          '          </td>' +
          '        </tr>' +
          '      </table>' +
          '    </td>' +
          '  </tr>' +
          '</table>' +
          '</body>' +
          '</html>';

        try {
          GmailApp.sendEmail(emailDestino, asunto, cuerpoPlano, {
            htmlBody: htmlBody,
            name: NOMBRE_ACADEMIA
          });
          // Marcar en la hoja que ya se envió la notificación (Columna I -> fila i+1, col 9)
          inscripcionesSheet.getRange(i + 1, 9).setValue("SI");
          Logger.log("Notificación HTML enviada a " + emailDestino + " para la reserva " + idRegistro);
        } catch (err) {
          Logger.log("Error al enviar email de confirmación final: " + err.toString());
        }
      }
    }
  }
}

/**
 * 🛠️ Helper de respuesta JSON con encabezados CORS
 */
function responseJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GOOGLE_SHEETS_STRUCTURE = {
  tab1: {
    name: "Alumnas_Niveles",
    headers: ["ID_Cliente", "Nombre_Representante", "Telefono_WhatsApp", "Email", "Nombre_Alumna", "Nivel_Asignado", "Estado"],
    sampleRows: [
      ["1726354490", "María Elena Torres", "+593998765432", "maria.torres@gmail.com", "Sofia Torres", "Principiante", "Activo"],
      ["0991234567", "Carlos Andrés Mendoza", "+593991234567", "carlos.mendoza@hotmail.com", "Camila Mendoza", "Intermedio", "Activo"],
      ["0987654321", "Valeria Benítez", "+593987654321", "valeria.b@gmail.com", "Isabella Benítez", "Avanzado", "Activo"]
    ]
  },
  tab2: {
    name: "Sedes_Horarios",
    headers: ["ID_Horario", "Sede", "Nivel_Requerido", "Dia", "Horario", "Cupo_Maximo", "Cupos_Ocupados", "Estado_Horario"],
    sampleRows: [
      ["HOR-001", "Sede Norte (Principal)", "Principiante", "Lunes y Miércoles", "15:00 - 16:30", 12, 8, "Disponible"],
      ["HOR-002", "Sede Norte (Principal)", "Principiante", "Martes y Jueves", "16:30 - 18:00", 10, 10, "Lleno"],
      ["HOR-003", "Sede Cumbayá", "Principiante", "Sábados", "09:00 - 11:00", 15, 6, "Disponible"],
      ["HOR-004", "Sede Norte (Principal)", "Intermedio", "Lunes y Miércoles", "16:30 - 18:00", 10, 7, "Disponible"]
    ]
  },
  tab3: {
    name: "Inscripciones",
    headers: ["ID_Registro", "Fecha_Registro", "ID_Cliente", "Nombre_Alumna", "Sede", "Horario_Seleccionado", "URL_Comprobante_Drive", "Estado_Inscripcion", "Notificado_Confirmacion"],
    sampleRows: [
      ["INS-2026-9812", "2026-08-20 14:32:10", "1726354490", "Sofia Torres", "Sede Norte (Principal)", "Lunes y Miércoles | 15:00 - 16:30", "https://drive.google.com/...", "Confirmado", "SI"]
    ]
  },
  tab4: {
    name: "Lista_Espera",
    headers: ["ID_Espera", "Fecha_Registro", "ID_Cliente", "Nombre_Alumna", "Email", "Telefono_WhatsApp", "ID_Horario", "Sede", "Nivel_Requerido", "Dia", "Horario", "Estado_Espera", "Notas"],
    sampleRows: [
      ["ESP-2026-1042", "2026-08-22 10:15:00", "0987654321", "Isabella Benítez", "valeria.b@gmail.com", "+593987654321", "HOR-002", "Sede Norte (Principal)", "Principiante", "Martes y Jueves", "16:30 - 18:00", "Pendiente", "Interesada si se abre cupo en la tarde"]
    ]
  }
};
