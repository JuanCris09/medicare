import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { patientName, tipoAtencion, diagnostico, type, date, time, motivo } = req.body;
    const finalMotivo = motivo || diagnostico || 'Consulta General';

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.MY_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({
            error: 'Configuración de Telegram incompleta',
            details: 'TELEGRAM_BOT_TOKEN o MY_CHAT_ID no están definidos.'
        });
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
        message = `🏥 <b>NUEVA HISTORIA CLÍNICA</b>
---------------------------
👤 <b>Paciente:</b> ${patientName}
🦷 <b>Servicio:</b> ${tipoAtencion || 'Consulta General'}
📝 <b>Hallazgos:</b> ${finalMotivo}
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

        return res.status(200).json({ success: true, sid: response.data.result.message_id });
    } catch (error) {
        console.error('Telegram API Error:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Error al enviar mensaje a Telegram',
            details: error.response?.data?.description || error.message
        });
    }
}
