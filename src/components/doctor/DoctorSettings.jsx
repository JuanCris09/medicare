import { useState, useEffect } from 'react';
import { Save, User, Stethoscope, Image as ImageIcon, Loader2, CheckCircle, Palette, Type, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

export default function DoctorSettings({ profile, onUpdate }) {
    const [config, setConfig] = useState({
        doctor_name: profile?.doctor_name || '',
        specialty: profile?.specialty || '',
        brand_color: profile?.brand_color || '#0f172a',
        logo_url: profile?.logo_url || '',
        font_family: profile?.font_family || 'Outfit',
        ui_density: profile?.ui_density || 'comfortable',
        sidebar_theme: profile?.sidebar_theme || 'light'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const fonts = ['Outfit', 'Inter', 'Montserrat', 'Playfair Display', 'Roboto Mono'];
    const densities = [
        { id: 'compact', label: 'Compacto' },
        { id: 'comfortable', label: 'Cómodo' },
        { id: 'spacious', label: 'Espacioso' }
    ];

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");

            const { error } = await supabase
                .from('doctor_profiles')
                .update(config)
                .eq('id', user.id);

            if (error) throw error;

            setShowSuccess(true);
            if (onUpdate) onUpdate();
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving settings:", err.message);
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
            <div className="px-2">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic">Personalización</h2>
                <p className="text-slate-500 font-bold tracking-tight">Configura la identidad y experiencia visual de tu portal.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Perfil Section */}
                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                        <User className="text-medical-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Perfil Profesional</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nombre Completo</label>
                            <input
                                type="text"
                                value={config.doctor_name}
                                onChange={(e) => setConfig({ ...config, doctor_name: e.target.value })}
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all font-bold text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Especialidad</label>
                            <input
                                type="text"
                                value={config.specialty}
                                onChange={(e) => setConfig({ ...config, specialty: e.target.value })}
                                className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all font-bold text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Diseño Section */}
                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                        <Palette className="text-medical-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Identidad Visual</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Color de Marca</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={config.brand_color}
                                    onChange={(e) => setConfig({ ...config, brand_color: e.target.value })}
                                    className="w-16 h-16 rounded-2xl border-none cursor-pointer p-0 bg-transparent"
                                />
                                <div className="flex-1 p-4 bg-slate-50 rounded-2xl font-mono text-sm font-bold text-slate-600">
                                    {config.brand_color}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tipografía Premium</label>
                            <div className="grid grid-cols-2 gap-2">
                                {fonts.map(font => (
                                    <button
                                        key={font}
                                        type="button"
                                        onClick={() => setConfig({ ...config, font_family: font })}
                                        className={`p-3 rounded-xl text-sm font-bold transition-all border-2 ${config.font_family === font
                                            ? 'bg-medical-600 border-medical-600 text-white'
                                            : 'bg-slate-50 border-transparent text-slate-600 hover:border-slate-200'}`}
                                        style={{ fontFamily: font }}
                                    >
                                        {font}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Logo de la Clínica (URL)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={config.logo_url}
                                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                placeholder="https://ejemplo.com/logo.png"
                                className="flex-1 p-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl outline-none transition-all font-bold text-sm"
                            />
                            {config.logo_url && (
                                <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                                    <img src={config.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Experiencia UI Section */}
                <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                        <Layout className="text-medical-600" size={24} />
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Experiencia de Interfaz</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Densidad de la Interfaz</label>
                            <div className="flex gap-2">
                                {densities.map(d => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => setConfig({ ...config, ui_density: d.id })}
                                        className={`flex-1 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${config.ui_density === d.id
                                            ? 'bg-slate-900 border-slate-900 text-white'
                                            : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tema del Sidebar</label>
                            <div className="flex gap-2">
                                {['light', 'dark', 'glass'].map(theme => (
                                    <button
                                        key={theme}
                                        type="button"
                                        onClick={() => setConfig({ ...config, sidebar_theme: theme })}
                                        className={`flex-1 p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${config.sidebar_theme === theme
                                            ? 'bg-slate-900 border-slate-900 text-white'
                                            : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Cristal'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-4">
                    <p className="text-slate-400 text-xs font-medium max-w-xs">
                        * Los cambios de color y tipografía se aplicarán instantáneamente después de guardar.
                    </p>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-medical-600 text-white px-10 py-5 rounded-3xl font-black text-lg shadow-2xl shadow-medical-600/30 flex items-center justify-center gap-3 hover:bg-medical-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> GUARDAR PERSONALIZACIÓN</>}
                    </button>
                </div>
            </form>

            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: showSuccess ? 1 : 0, y: showSuccess ? 0 : 50 }}
                className="fixed bottom-10 right-10 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 pointer-events-none"
            >
                <CheckCircle size={24} />
                <span className="font-bold">Personalización aplicada con éxito</span>
            </motion.div>
        </div>
    );
}
