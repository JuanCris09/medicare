import { QRCodeSVG } from 'qrcode.react';
import { HeartPulse } from 'lucide-react';

export default function QRGenerator({ patient, size = 180 }) {
    // Use the current origin or fallback to a placeholder
    const baseUrl = window.location.origin;
    // Use qr_token if available (UUID), fallback to ID if not (though qr_token is preferred for security)
    const qrValue = `${window.location.origin}/perfil-emergencia/${patient.qr_token || patient.id}`;

    return (
        <div className="relative bg-white p-4 rounded-3xl shadow-inner flex items-center justify-center">
            <QRCodeSVG
                value={qrValue}
                size={size}
                level="H" // High error correction for the center logo
                includeMargin={false}
                imageSettings={{
                    src: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.82 2.96 0L15 8.04"/><path d="m12 10 3 3"/></svg>'),
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-50">
                    <HeartPulse className="text-medical-600" size={24} />
                </div>
            </div>
        </div>
    );
}
