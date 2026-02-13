import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Building2, User, Stethoscope, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
    const [config, setConfig] = useState({
        nombre_clinica: '',
        nombre_doctor: '',
        especialidad: '',
        logo_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('configuracion')
            .select('*')
            .limit(1)
            .single();

        if (data) setConfig(data);
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const { data: existing } = await supabase.from('configuracion').select('id').limit(1);

        let error;
        if (existing && existing.length > 0) {
            const { error: err } = await supabase
                .from('configuracion')
                .update(config)
                .eq('id', existing[0].id);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('configuracion')
                .insert([config]);
            error = err;
        }

        if (!error) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
        setIsSaving(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 size={40} className="animate-spin text-medical-600 mb-4" />
                <p className="text-slate-400 font-bold">Cargando configuración...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
            <div className="px-2">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic">Configuración</h2>
                <p className="text-slate-500 font-bold tracking-tight">Personaliza la identidad de tu consultorio digital</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Clinic Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <Building2 size={12} /> Nombre de la Clínica
                            </label>
                            <input
                                type="text"
                                value={config.nombre_clinica}
                                onChange={(e) => setConfig({ ...config, nombre_clinica: e.target.value })}
                                placeholder="Ej: Clínica Dental San José"
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all text-sm font-bold"
                            />
                        </div>

                        {/* Doctor Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <User size={12} /> Nombre del Doctor
                            </label>
                            <input
                                type="text"
                                value={config.nombre_doctor}
                                onChange={(e) => setConfig({ ...config, nombre_doctor: e.target.value })}
                                placeholder="Ej: Dr. Juan Pérez"
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all text-sm font-bold"
                            />
                        </div>

                        {/* Specialization */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <Stethoscope size={12} /> Especialidad
                            </label>
                            <input
                                type="text"
                                value={config.especialidad}
                                onChange={(e) => setConfig({ ...config, especialidad: e.target.value })}
                                placeholder="Ej: Odontología General"
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all text-sm font-bold"
                            />
                        </div>

                        {/* Logo URL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                                <ImageIcon size={12} /> URL del Logo (Branding)
                            </label>
                            <input
                                type="text"
                                value={config.logo_url}
                                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                placeholder="https://ejemplo.com/logo.png"
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all text-sm font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4">
                    <p className="text-slate-400 text-xs font-medium max-w-xs">
                        Estos datos se utilizarán automáticamente en los encabezados de tus PDFs y en el perfil del sidebar.
                    </p>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-medical-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-medical-600/30 flex items-center justify-center gap-3 hover:bg-medical-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> GUARDAR CAMBIOS</>}
                    </button>
                </div>
            </form>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: showSuccess ? 1 : 0, y: showSuccess ? 0 : 50 }}
                className="fixed bottom-10 right-10 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 pointer-events-none"
            >
                <CheckCircle size={24} />
                <span className="font-bold">Configuración guardada con éxito</span>
            </motion.div>
        </div>
    );
}
