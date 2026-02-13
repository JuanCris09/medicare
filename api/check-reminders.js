import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

export const handler = async (event) => {
    // 1. Security Check
    const authHeader = event.headers.authorization;
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        // 2. Identify Time Window (45 to 60 minutes from now)
        // Correct for America/Bogota (UTC-5)
        const now = new Date();
        const bogotaNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) - (5 * 3600000));

        const startWindow = new Date(bogotaNow.getTime() + 45 * 60000);
        const endWindow = new Date(bogotaNow.getTime() + 60 * 60000);

        // 3. Query Appointments
        const { data: appointments, error } = await supabase
            .from('citas')
            .select('*')
            .eq('estado', 'Pendiente')
            .gte('fecha_hora', startWindow.toISOString())
            .lte('fecha_hora', endWindow.toISOString());

        if (error) throw error;

        if (!appointments || appointments.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No upcoming appointments found in this window.' })
            };
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.MY_CHAT_ID;

        // 4. Send Notifications
        const results = await Promise.all(appointments.map(async (cita) => {
            const appointmentTime = new Date(cita.fecha_hora);
            const timeStr = appointmentTime.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Bogota'
            });

            const message = `⏰ **RECORDATORIO DE CITA**\n` +
                `---------------------------\n` +
                `👤 **Paciente:** ${cita.paciente_nombre}\n` +
                `🕒 **Hora:** ${timeStr}\n` +
                `📝 **Motivo:** ${cita.motivo || 'Consulta General'}\n\n` +
                `_La cita comienza en menos de 1 hora._`;

            try {
                await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                });
                return { id: cita.id, status: 'sent' };
            } catch (err) {
                console.error(`Failed to send reminder for cita ${cita.id}:`, err.message);
                return { id: cita.id, status: 'failed', error: err.message };
            }
        }));

        return {
            statusCode: 200,
            body: JSON.stringify({
                processed: appointments.length,
                results
            })
        };

    } catch (error) {
        console.error('Reminder error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
