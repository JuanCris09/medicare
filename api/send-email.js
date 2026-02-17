import { Resend } from 'resend';

// Netlify already provides environment variables, but we keep this for local compatibility
try {
    const dotenv = await import('dotenv');
    dotenv.config();
} catch (e) {
    // dotenv might not be available in all environments
}

export const handler = async (event) => {
    // 1. Method check
    const method = event.httpMethod || event.method;
    if (method !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    // 2. Parse body
    let body;
    try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    const { to, patientName, pdfBase64, clinicianName } = body || {};

    if (!to || !pdfBase64) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Faltan datos requeridos (to o pdfBase64)' })
        };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_RESEND')) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'RESEND_API_KEY no configurada',
                details: 'Por favor, configura la API key en el archivo .env.'
            })
        };
    }

    const resend = new Resend(apiKey);

    try {
        const { data, error } = await resend.emails.send({
            from: 'MediScan Elite <onboarding@resend.dev>',
            to: [to],
            subject: `Historia Clínica - ${patientName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0f172a;">Reporte Clínico Digitalizado</h2>
                    <p>Hola <strong>${patientName}</strong>,</p>
                    <p>Adjunto encontrarás tu reporte clínico generado por el sistema <strong>MediScan Elite</strong>.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">
                        Este es un mensaje automático enviado por MediScan Elite de parte de ${clinicianName || 'tu especialista'}.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `Reporte_${patientName.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBase64,
                },
            ],
        });

        if (error) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Error de Resend', details: error })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, id: data?.id })
        };
    } catch (error) {
        console.error('Unexpected Backend Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
        };
    }
};
