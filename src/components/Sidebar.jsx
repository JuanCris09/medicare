import { useState, useEffect } from 'react';
import { X, Home, Users, Calendar, Settings, HeartPulse } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-8 py-4 cursor-pointer transition-all border-r-4 ${active
            ? 'bg-medical-50 border-medical-600 text-medical-600 font-bold'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-transparent'
            }`}
    >
        <Icon size={20} />
        <span className="text-sm tracking-tight">{label}</span>
    </button>
);

export default function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
    const [doctorConfig, setDoctorConfig] = useState({
        nombre_doctor: 'Dr. Juan Pérez',
        especialidad: 'Especialista',
        logo_url: ''
    });

    useEffect(() => {
        const fetchDoctor = async () => {
            const { data } = await supabase.from('configuracion').select('*').limit(1).single();
            if (data) setDoctorConfig(data);
        };
        fetchDoctor();
    }, []);

    const menuItems = [
        { id: 'Inicio', icon: Home },
        { id: 'Pacientes', icon: Users },
        { id: 'Citas', icon: Calendar },
        { id: 'Configuración', icon: Settings },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-medical-600 rounded-xl flex items-center justify-center shadow-lg shadow-medical-600/20">
                            <HeartPulse className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold text-slate-800 tracking-tight">MediCare</span>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 mt-4">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.id}
                            icon={item.icon}
                            label={item.id}
                            active={activeTab === item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                onClose();
                            }}
                        />
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-300 ring-2 ring-white overflow-hidden shadow-sm">
                            <img
                                src={doctorConfig.logo_url || `https://ui-avatars.com/api/?name=${doctorConfig.nombre_doctor.replace(/\s+/g, '+')}&background=0D8ABC&color=fff`}
                                alt="Perfil"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{doctorConfig.nombre_doctor}</p>
                            <p className="text-xs text-slate-500 truncate">{doctorConfig.especialidad}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
