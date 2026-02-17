import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import { Loader2 } from 'lucide-react';

export default function DoctorLayout({ children }) {
    const { profile, loading } = useDoctorProfile();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-slate-400" size={40} />
            </div>
        );
    }

    const brandColor = profile?.brand_color || '#0ea5e9';

    return (
        <div
            className="min-h-screen bg-slate-50"
            style={{
                '--brand-primary': brandColor,
            }}
        >
            <style jsx global>{`
                :root {
                    --medical-600: ${brandColor};
                    --medical-500: ${brandColor};
                    --medical-400: ${brandColor};
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background-color: #f8fafc;
                    -webkit-font-smoothing: antialiased;
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #f1f5f9; }
                ::-webkit-scrollbar-thumb { 
                    background: #cbd5e1; 
                    border-radius: 4px; 
                }
                ::-webkit-scrollbar-thumb:hover { 
                    background: #94a3b8; 
                }
            `}</style>

            {children}
        </div>
    );
}
