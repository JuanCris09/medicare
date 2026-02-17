import { X, Home, Users, Calendar, Settings, HeartPulse, ClipboardList, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-lg text-sm ${active
            ? 'bg-sky-50 text-sky-600 font-semibold'
            : 'text-slate-600 hover:bg-slate-50'
            }`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </button>
);

export default function DoctorSidebar({ activeTab, setActiveTab, isOpen, onClose, profile }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
        navigate('/doctor-login');
    };

    const menuItems = [
        { id: 'Inicio', icon: Home },
        { id: 'Pacientes', icon: Users },
        { id: 'Citas', icon: Calendar },
        { id: 'Secretaría', icon: ClipboardList },
    ];

    return (
        <aside className={`
            fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transition-transform duration-300 md:translate-x-0 md:static md:h-screen
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className="flex flex-col h-full">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center">
                            <HeartPulse className="text-white" size={24} />
                        </div>
                        <span className="text-lg font-bold text-slate-800">Doctor Portal</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-6 right-6 text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
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

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-lg mb-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm">
                            {profile?.logo_url ? (
                                <img src={profile.logo_url} className="w-full h-full object-cover rounded-lg" alt="Logo" />
                            ) : (profile?.doctor_name?.charAt(0) || 'D')}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold text-slate-800 truncate">{profile?.doctor_name || 'Dr. Usuario'}</p>
                            <p className="text-xs text-slate-500 truncate">{profile?.specialty || 'Especialista'}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
