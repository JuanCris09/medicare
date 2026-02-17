import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    const { patientName, tipoAtencion, diagnostico, type, date, time, motivo } = body;
    const finalMotivo = motivo || diagnostico || 'Consulta General';

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.MY_CHAT_ID;

    if (!token || !chatId) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Configuración de Telegram incompleta',
                details: 'TELEGRAM_BOT_TOKEN o MY_CHAT_ID no están definidos.'
            })
        };
    }

    const getInitials = (name) => {
        if (!name || name === 'Paciente Desconocido') return 'P. D.';
        return name
            .split(' ')
            .map(n => n[0]?.toUpperCase())
            .filter(Boolean)
            .join('. ') + '.';
    };

    const initials = getInitials(patientName);
    const currentDate = new Date().toLocaleDateString('es-ES');
    let message = '';

    if (type === 'NEW_APPOINTMENT') {
        message = `📅 <b>NUEVA CITA AGENDADA</b>
---------------------------
👤 <b>Paciente:</b> ${patientName}
🕒 <b>Fecha:</b> ${date}
⏰ <b>Hora:</b> ${time}
📝 <b>Motivo:</b> ${finalMotivo}`;
    } else if (type === 'RESCHEDULE') {
        message = `🔄 <b>CITA REPROGRAMADA</b>
---------------------------
👤 <b>Paciente:</b> ${patientName}
📅 <b>Nueva Fecha:</b> ${date}
⏰ <b>Nueva Hora:</b> ${time}
📝 <b>Motivo:</b> ${finalMotivo}`;
    } else if (type === 'CANCEL') {
        message = `❌ <b>CITA CANCELADA</b>
---------------------------
👤 <b>Paciente:</b> ${patientName}
⚠️ <b>Estado:</b> Cancelada por usuario/admin`;
    } else if (type === 'APPOINTMENT') {
        message = `📅 <b>CITA PROGRAMADA (PRIVADO)</b>
---------------------------
👤 <b>Paciente:</b> ${initials}
🕒 <b>Fecha/Hora:</b> ${date} - ${time}
📝 <b>Motivo:</b> [DATOS PROTEGIDOS]`;
    } else if (type === 'HISTORY') {
        const metadataInfo = body.metadata ? `\n🎂 <b>Nacimiento:</b> ${body.metadata.nacimiento || 'N/R'}\n📋 <b>Plan:</b> ${body.metadata.plan || 'N/R'}` : '';
        message = `🏥 <b>NUEVA HISTORIA CLÍNICA</b>
---------------------------
👤 <b>Paciente:</b> ${patientName}
🆔 <b>Cédula:</b> ${body.dni || 'N/R'}${metadataInfo}
🏥 <b>Servicio:</b> ${tipoAtencion || 'Consulta General'}
📝 <b>Resumen:</b> ${finalMotivo}
📅 <b>Fecha:</b> ${currentDate}`;
    } else {
        message = `🏥 <b>NUEVO REGISTRO (PRIVADO)</b>
---------------------------
👤 <b>Paciente:</b> ${initials}
🦷 <b>Servicio:</b> ${tipoAtencion}
📝 <b>Hallazgos:</b> [Detalles protegidos - Ver en plataforma]
📅 <b>Fecha:</b> ${currentDate}`;
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, sid: response.data.result.message_id })
        };
    } catch (error) {
        console.error('Telegram API Error:', error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Error al enviar mensaje a Telegram',
                details: error.response?.data?.description || error.message
            })
        };
    }
};
