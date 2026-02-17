import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, HeartPulse, Shield, MessageSquare, ArrowRight, User, Building, Phone, Stethoscope, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4"
    >
        <div className="w-14 h-14 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </motion.div>
);

export default function Landing() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [leadData, setLeadData] = useState({
        nombre: '',
        clinica: '',
        whatsapp: '',
        clinic: '', // Mapped from 'clinica'
        specialty: 'General' // Mapped from 'especialidad'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('leads')
                .insert([{
                    nombre: leadData.nombre,
                    clinica: leadData.clinica,
                    whatsapp: leadData.whatsapp,
                    // especialidad: leadData.especialidad // User schema says: id, nombre, clinica, whatsapp. Remove extra fields if not in schema.
                    // Checking schema: 'leads': (id, nombre, clinica, whatsapp). Especialidad is NOT in schema.
                }]);

            if (error) throw error;

            setShowSuccess(true);
            setLeadData({ nombre: '', clinica: '', whatsapp: '', clinic: '', specialty: 'General' });
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (err) {
            console.error("Error submitting lead:", err);
            alert("Hubo un error al enviar tus datos. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrollToForm = () => {
        document.getElementById('demo-form').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-medical-100 selection:text-medical-600">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 lg:px-20 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-medical-600 rounded-xl flex items-center justify-center shadow-lg shadow-medical-600/20">
                        <HeartPulse className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">MediCare</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/doctor-login')}
                        className="text-sm font-bold text-slate-600 hover:text-medical-600 transition-colors"
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={scrollToForm}
                        className="bg-medical-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-medical-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Solicitar Demo
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-40 pb-20 px-6 lg:px-20 overflow-hidden relative">
                <div className="absolute top-20 right-0 w-1/2 h-full bg-gradient-to-l from-medical-100/30 to-transparent -z-10 blur-3xl"></div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <Zap size={14} className="fill-emerald-600" /> Inteligencia Artificial Médica
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                            Digitaliza tu consulta en <span className="text-medical-600">10 segundos.</span>
                        </h1>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                            Elimina el papeleo. MediCare usa IA de vanguardia para extraer datos de historias clínicas físicas y mantener tu agenda organizada automáticamente.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-medical-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-medical-600/30 flex items-center justify-center gap-3 hover:scale-105 transition-all"
                            >
                                Probar DEMO <ArrowRight size={20} />
                            </button>
                            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-slate-500 leading-none">+500 Médicos confían</span>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="aspect-square bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
                            <img
                                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070"
                                className="w-full h-full object-cover rounded-[2rem]"
                                alt="Dashboard Preview"
                            />
                            <div className="absolute top-12 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800">OCR Activo</p>
                                    <p className="text-[10px] text-slate-500 font-bold">Escaneando...</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features */}
            <section className="py-32 px-6 lg:px-20 bg-white">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Potencia tu eficiencia clínica</h2>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Herramientas diseñadas para que te enfoques en lo que importa: tus pacientes.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Zap}
                            title="Smart Scan AI"
                            description="Toma una foto de cualquier receta o historia clínica y nuestra IA extraerá el diagnóstico y los datos del paciente al instante."
                        />
                        <FeatureCard
                            icon={MessageSquare}
                            title="Notificaciones Seguras"
                            description="Recibe alertas de citas y resúmenes de pacientes directamente en Telegram, anonimizados para máxima seguridad."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Privacidad Total"
                            description="Datos cifrados y arquitectura segura bajo estándares internacionales de protección de información médica."
                        />
                    </div>
                </div>
            </section>

            {/* Lead Capture */}
            <section id="demo-form" className="py-32 px-6 lg:px-20 bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.1),transparent)] pointer-events-none"></div>
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8 text-white">
                        <h2 className="text-5xl font-black tracking-tight leading-tight">Empieza tu transformación hoy</h2>
                        <div className="space-y-4">
                            {[
                                "Configuración en menos de 5 minutos",
                                "Capacitación personalizada incluida",
                                "Migración de datos antiguos disponible",
                                "Soporte priority 24/7"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <CheckCircle size={14} className="text-white" />
                                    </div>
                                    <span className="font-bold text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl relative">
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10 space-y-6"
                            >
                                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">¡Solicitud Enviada!</h3>
                                <p className="text-slate-500 font-medium">Un especialista se pondrá en contacto contigo por WhatsApp en breve.</p>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                            <User size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Tu Nombre Completo"
                                            required
                                            value={leadData.nombre}
                                            onChange={e => setLeadData({ ...leadData, nombre: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                            <Building size={20} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Clínica / Centro Médico"
                                            required
                                            value={leadData.clinica}
                                            onChange={e => setLeadData({ ...leadData, clinica: e.target.value })}
                                            className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <Phone size={20} />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="WhatsApp"
                                                required
                                                value={leadData.whatsapp}
                                                onChange={e => setLeadData({ ...leadData, whatsapp: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <Stethoscope size={20} />
                                            </div>
                                            <select
                                                value={leadData.especialidad}
                                                onChange={e => setLeadData({ ...leadData, especialidad: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all appearance-none"
                                            >
                                                <option>General</option>
                                                <option>Dental</option>
                                                <option>Cardiología</option>
                                                <option>Pediatría</option>
                                                <option>Otros</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    disabled={isSubmitting}
                                    className="w-full bg-medical-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-medical-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    Solicitar Demo Prioritaria <Zap size={20} className="fill-white" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 lg:px-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                            <HeartPulse className="text-white" size={18} />
                        </div>
                        <span className="text-lg font-bold text-slate-800">MediCare v4.0</span>
                    </div>
                    <p className="text-slate-400 font-medium text-sm">© 2026 MediCare Platform. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
