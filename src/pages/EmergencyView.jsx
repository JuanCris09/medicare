import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HeartPulse, Droplet, AlertTriangle, Phone, User,
    ShieldAlert, Thermometer, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function EmergencyView() {
    const { token } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatientByToken();
    }, [token]);

    const fetchPatientByToken = async () => {
        setLoading(true);
        try {
            // Try to fetch from documentos_identidad first (since pacientes has no cedula in this context? Wait, user said cedula IS in pacientes)
            // But for emergency token lookup (which is ID or Cedula), let's resolved.
            // Actually, if token is UUID (qr_token or id)

            // Let's assume the token is the QR Token or ID.
            // We need to join perfil_salud

            const { data: patientData, error: dbError } = await supabase
                .from('pacientes')
                .select(`
                    *,
                    perfil_salud (*)
                `)
                .or(`id.eq.${token},qr_token.eq.${token},cedula.eq.${token}`) // Try all unique identifiers
                .maybeSingle();

            if (dbError || !patientData) {
                setError('Paciente no encontrado.');
                setLoading(false);
                return;
            }

            // Fetch ID photo separately
            const { data: docData } = await supabase
                .from('documentos_identidad')
                .select('url_frente')
                .eq('paciente_id', patientData.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const salud = patientData.perfil_salud && patientData.perfil_salud.length > 0 ? patientData.perfil_salud[0] : (patientData.perfil_salud || {});
            // Note: if relation is 1-1, supabase returns object or array depending on setup. usually array for * join unless specified foreign key
            // Assuming 1:1, but select(*) usually returns array for relations unless using !inner or single() logic on relation.
            // Actually, for one-to-many it returns array. perfil_salud refers to pacientes, implies many profiles per patient or 1-1? 
            // We will take the first one.

            setPatient({
                nombre: patientData.nombre,
                cedula: patientData.cedula,
                tipoSangre: salud.tipo_sangre || 'O +',
                alergias: salud.alergias || 'No registradas',
                contactoEmergencia: 'Contacto',
                telefonoEmergencia: salud.contacto_emergencia_tel || '911',
                photo: docData?.url_frente || null
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching patient data:", err);
            setError('Error al cargar los datos del paciente.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-red-500" size={48} />
                <p className="mt-4 text-lg font-bold animate-pulse">Cargando perfil de emergencia...</p>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-black">Token inválido</h1>
                <p className="text-slate-400 mt-2 text-center">Este código QR no está vinculado a ningún paciente registrado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Emergency Header Bar */}
            <div className="bg-red-600 py-3 px-6 flex items-center justify-center gap-2">
                <AlertTriangle className="animate-pulse" size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Perfil de Emergencia Médica</span>
            </div>

            <div className="max-w-md mx-auto p-6 space-y-6">
                {/* MediCare Branding */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 pt-4"
                >
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <HeartPulse className="text-white" size={18} />
                    </div>
                    <span className="text-lg font-black italic tracking-tight text-white/60">MediCare</span>
                </motion.div>

                {/* Patient Identity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-white/10 text-center"
                >
                    <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 overflow-hidden border border-white/20">
                        {patient.photo ? (
                            <img src={patient.photo} alt="Official ID" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-white/30" />
                        )}
                    </div>
                    <h1 className="text-2xl font-black tracking-tight">{patient.nombre}</h1>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">CC: {patient.cedula}</p>
                </motion.div>

                {/* Blood Type - HERO SIZE */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-red-950/60 backdrop-blur-sm rounded-[2rem] p-8 border border-red-500/30 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                        <Droplet size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Tipo de Sangre</span>
                    </div>
                    <p className="text-7xl font-black text-red-500 tracking-tighter">{patient.tipoSangre}</p>
                </motion.div>

                {/* Allergies - Highlighted */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-amber-950/40 backdrop-blur-sm rounded-[2rem] p-6 border border-amber-500/30"
                >
                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                        <Thermometer size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Alergias Conocidas</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {patient.alergias.split(',').map((alergia, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 bg-red-600/20 text-red-400 rounded-full text-sm font-black border border-red-500/30"
                            >
                                ⚠️ {alergia.trim()}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Emergency Contact - Click to Call */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-6 border border-white/10"
                >
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Contacto de Emergencia</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-black">{patient.contactoEmergencia}</p>
                            <p className="text-sm font-bold text-white/40">{patient.telefonoEmergencia}</p>
                        </div>
                        <a
                            href={`tel:${patient.telefonoEmergencia.replace(/\s/g, '')}`}
                            className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-all"
                        >
                            <Phone size={28} />
                        </a>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="text-center pt-4 pb-8 space-y-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        Generado por MediCare • Datos Confidenciales
                    </p>
                    <p className="text-[10px] font-bold text-white/10">
                        Token: {token}
                    </p>
                </div>
            </div>
        </div>
    );
}
