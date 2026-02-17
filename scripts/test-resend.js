import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey.includes('YOUR_RESEND')) {
    console.error('❌ Error: RESEND_API_KEY no encontrada en .env');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testEmail() {
    console.log('--- Probando Resend ---');
    console.log('API Key detectada:', apiKey.substring(0, 7) + '...');

    try {
        const { data, error } = await resend.emails.send({
            from: 'MediScan Elite <onboarding@resend.dev>',
            to: ['juampiscris98@gmail.com'], // Using the verified email from the error message
            subject: 'Prueba de Conectividad MediScan',
            html: '<h1>¡Conexión Exitosa!</h1><p>Si recibes esto, Resend está funcionando correctamente.</p>'
        });

        if (error) {
            console.error('❌ Error de Resend:', error);
        } else {
            console.log('✅ ¡Email enviado con éxito! ID:', data.id);
            console.log('Nota: Si no lo recibes, revisa el SPAM o verifica que sea tu correo de registro de Resend.');
        }
    } catch (err) {
        console.error('❌ Error inesperado:', err.message);
    }
}

testEmail();
