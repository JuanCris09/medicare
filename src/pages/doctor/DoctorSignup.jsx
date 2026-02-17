import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, Mail, Lock, User, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function DoctorSignup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        doctor_name: '',
        specialty: ''
    });
    const [error, setError] = useState(null);

    const translateError = (err) => {
        const msg = err.message || err;
        if (msg.includes('rate limit')) return 'Supabase ha limitado los intentos. Por seguridad, espera 2 o 3 minutos sin presionar el botón.';
        if (msg.includes('after')) {
            const seconds = msg.match(/\d+/);
            return `Límite de seguridad alcanzado. Intenta de nuevo en exactamente ${seconds || 'unos'} segundos.`;
        }
        if (msg.includes('already registered')) return 'Este correo ya está registrado. Intenta iniciar sesión.';
        if (msg.includes('confirmation email')) return 'Se ha enviado un correo de confirmación. Por favor, revísalo antes de entrar.';
        if (msg.includes('row-level security policy')) return 'Error de permisos: no se pudo guardar el perfil doctor. Contacta soporte.';
        return msg;
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Sign up user in Supabase Auth
            // We pass the name and specialty as user_metadata so the DB Trigger can pick them up
            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.doctor_name,
                        specialty: formData.specialty
                    }
                }
            });

            if (signupError) throw signupError;

            if (data.user) {
                alert("Registro iniciado. Por seguridad, Supabase enviará un correo de confirmación. Revisa tu bandeja de entrada.");
                navigate('/doctor-login');
            }
        } catch (err) {
            console.error("Signup Error:", err);
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
                        <p className="text-medical-600 font-bold uppercase tracking-widest text-[10px]">Registro de Doctor</p>
                    </div>
                </div>

                {/* Signup Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Dr. Nombre Apellido"
                                    required
                                    value={formData.doctor_name}
                                    onChange={e => setFormData({ ...formData, doctor_name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Especialidad</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Briefcase size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ej. Cardiólogo"
                                    required
                                    value={formData.specialty}
                                    onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Profesional</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="doctor@hospital.com"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Mín. 6 caracteres"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>CREAR CUENTA <ArrowRight size={20} /></>}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-xs text-slate-400 font-bold">
                                ¿Ya tienes cuenta? <Link to="/doctor-login" className="text-medical-600 hover:underline">Inicia sesión</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
