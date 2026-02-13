import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, Fingerprint, Calendar, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';

export default function PortalLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cedula: '',
        fechaNac: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verify user against Supabase (pacientes table)
            console.log("PortalLogin: Verifying cedula:", formData.cedula);
            const { data, error } = await supabase
                .from('pacientes')
                .select('*')
                .eq('cedula', formData.cedula)
                .maybeSingle();

            console.log("PortalLogin: Query Result:", { data, error });

            if (error) {
                console.error("Supabase Error:", error);
                alert(`Error: ${error.message}`);
                setLoading(false);
                return;
            }

            if (!data) {
                alert('Usuario no encontrado. Verifique su Cédula.');
                setLoading(false);
                return;
            }

            // Save to local storage for persistence
            localStorage.setItem('medicare_user', JSON.stringify({
                nombre: data.nombre,
                cedula: data.cedula,
                id: data.id,
                // We will fetch the photo separately in the dashboard
                verified: true
            }));

            navigate('/portal/home');
        } catch (err) {
            console.error("Login Exception:", err);
            alert(`Error al iniciar sesión: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-10"
            >
                {/* Brand */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-medical-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-medical-600/30">
                        <HeartPulse className="text-white" size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">MediCare</h1>
                        <p className="text-medical-600 font-bold uppercase tracking-widest text-[10px]">Portal del Ciudadano</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Documento de Identidad</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Fingerprint size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cédula / DNI"
                                    required
                                    value={formData.cedula}
                                    onChange={e => setFormData({ ...formData, cedula: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fecha de Nacimiento</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Calendar size={20} />
                                </div>
                                <input
                                    type="date"
                                    required
                                    value={formData.fechaNac}
                                    onChange={e => setFormData({ ...formData, fechaNac: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>INGRESAR <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-100/50 py-3 rounded-2xl">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Acceso Seguro con Encriptación PHI</span>
                </div>
            </motion.div>
        </div>
    );
}
