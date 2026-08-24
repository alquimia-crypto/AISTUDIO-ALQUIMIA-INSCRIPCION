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

// ⚙️ CONFIGURACIÓN GLOBAL (Reemplaza con tus propios IDs)
const SPREADSHEET_ID = "REEMPLAZAR_CON_TU_SPREADSHEET_ID";
const DRIVE_FOLDER_ID = "REEMPLAZAR_CON_TU_DRIVE_FOLDER_ID";
const NOMBRE_ACADEMIA = "Alquimia Danza Aérea";
const EMAIL_CONTACTO = "alquimiada0@gmail.com";

/**
 * 📥 ENDPOINT GET: Consultas públicas de Alumnas y Horarios
 */
function doGet(e) {
  const action = e.parameter.action;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let result = { success: false, message: "Acción no válida" };
  
  try {
    if (action === "getStudent") {
      const idSearch = e.parameter.id ? e.parameter.id.toString().trim() : "";
      result = buscarAlumnaPorID(sheet, idSearch);
    } 
    else if (action === "getSchedules" || action === "getAllSchedules") {
      const nivel = e.parameter.nivel ? e.parameter.nivel.toString().trim() : "";
      result = obtenerHorariosPorNivel(sheet, nivel);
    }
    else if (action === "ping") {
      result = { success: true, message: "Apps Script API activa correctamente" };
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
    
    // 1. Guardar comprobante en Google Drive
    let driveFileUrl = "Sin comprobante";
    if (fileData) {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const cleanBase64 = fileData.replace(/^data:.*?;base64,/, "");
      const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType, fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileUrl = file.getUrl();
    }
    
    // 2. Generar ID de Registro único y Fecha
    const fechaRegistro = Utilities.formatDate(new Date(), "America/Guayaquil", "yyyy-MM-dd HH:mm:ss");
    const idRegistro = "INS-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    
    // 3. Registrar fila en pestaña 'Inscripciones'
    const inscripcionesSheet = sheet.getSheetByName("Inscripciones");
    inscripcionesSheet.appendRow([
      idRegistro,
      fechaRegistro,
      idCliente,
      nombreAlumna,
      sede,
      horarioSeleccionado,
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
 * 🔍 Helper: Buscar datos de la alumna por ID_Cliente o Teléfono
 */
function buscarAlumnaPorID(sheet, idSearch) {
  const alumnosSheet = sheet.getSheetByName("Alumnas_Niveles");
  const data = alumnosSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "No hay registros cargados en el sistema." };
  
  // Limpiar búsqueda
  const cleanSearch = idSearch.toString().replace(/\\D/g, "");
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const idCliente = row[0] ? row[0].toString().replace(/\\D/g, "") : "";
    const telefono = row[2] ? row[2].toString().replace(/\\D/g, "") : "";
    const estado = row[6] ? row[6].toString().trim() : "Activo";
    
    if ((idCliente === cleanSearch || telefono.endsWith(cleanSearch)) && cleanSearch.length >= 4) {
      if (estado.toLowerCase() === "inactivo") {
        return { 
          success: false, 
          message: "La alumna figura como inactiva. Por favor contáctanos directamente." 
        };
      }
      
      return {
        success: true,
        data: {
          ID_Cliente: row[0],
          Nombre_Representante: row[1],
          Telefono_WhatsApp: row[2],
          Email: row[3],
          Nombre_Alumna: row[4],
          Nivel_Asignado: row[5],
          Estado: estado
        }
      };
    }
  }
  
  return { 
    success: false, 
    message: "No encontramos una alumna registrada con la identificación o teléfono ingresado. Verifique el número o comuníquese con secretaría." 
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
    const horario = row[4];
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
  
  for (let i = 1; i < data.length; i++) {
    const rowId = data[i][0];
    const rowSede = data[i][1];
    const rowHorario = data[i][4];
    
    // Coincidencia por ID o por Texto + Sede
    if ((idHorario && rowId === idHorario) || (rowSede === sede && textoHorario.includes(rowHorario))) {
      const currentOccupied = Number(data[i][6]) || 0;
      const maxCupos = Number(data[i][5]) || 0;
      const newOccupied = currentOccupied + 1;
      
      // Actualizar columna Cupos_Ocupados (columna G -> 7)
      horariosSheet.getRange(i + 1, 7).setValue(newOccupied);
      
      // Actualizar columna Estado_Horario (columna H -> 8)
      if (newOccupied >= maxCupos) {
        horariosSheet.getRange(i + 1, 8).setValue("Lleno");
      }
      break;
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
  }
};
