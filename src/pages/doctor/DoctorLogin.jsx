import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function DoctorLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);

    const translateError = (err) => {
        const msg = err.message || err;
        if (msg.includes('Invalid login credentials')) return 'Credenciales inválidas. Verifica tu correo y contraseña.';
        if (msg.includes('rate limit')) return 'Demasiados intentos. Por seguridad, espera unos segundos.';
        if (msg.includes('Email not confirmed')) return 'Debes confirmar tu correo electrónico antes de entrar.';
        return msg;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (loginError) throw loginError;

            // Optional: Verify if user has a doctor profile
            const { data: profile } = await supabase
                .from('doctor_profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (!profile) {
                // If no profile exists, we might want to redirect to a profile setup page
                // But for now, we'll just let them in to the portal
                console.log("No doctor profile found for this user.");
            }

            navigate('/doctor-portal');
        } catch (err) {
            console.error("Login Error:", err);
            setError(translateError(err));
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
                        <p className="text-medical-600 font-bold uppercase tracking-widest text-[10px]">Portal del Doctor</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Profesional</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="ejemplo@doctor.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>INICIAR SESIÓN <ArrowRight size={20} /></>}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-xs text-slate-400 font-bold">
                                ¿No tienes cuenta? <Link to="/doctor-signup" className="text-medical-600 hover:underline">Regístrate aquí</Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-100/50 py-3 rounded-2xl">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Acceso Identificado con RLS Activado</span>
                </div>
            </motion.div>
        </div>
    );
}
