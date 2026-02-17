import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoctorSidebar from '../../components/doctor/DoctorSidebar';
import StatCard from '../../components/StatCard';
import PatientTable from '../../components/PatientTable';
import ScanModal from '../../components/ScanModal';
import NotificationToast from '../../components/NotificationToast';
import PatientDetailModal from '../../components/PatientDetailModal';
import Appointments from '../../components/Appointments';
import DoctorSettings from '../../components/doctor/DoctorSettings';
import { supabase } from '../../lib/supabaseClient';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import SecretaryAppointments from '../../components/SecretaryAppointments';
import {
    Users,
    Zap,
    Search,
    Bell,
    Activity,
    Clock,
    Menu,
} from 'lucide-react';

export default function DoctorPortal() {
    const { profile, loading: profileLoading } = useDoctorProfile();
    const [activeTab, setActiveTab] = useState('Inicio');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'telegram' });

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, text: 'Nuevo paciente: Tulio Santamaría escaneado', time: 'Hace 5 min', type: 'scan' },
        { id: 2, text: 'Cita de Pepito Perez confirmada', time: 'Hace 30 min', type: 'appointment' },
        { id: 3, text: 'Reporte médico generado con éxito', time: 'Hace 1 hora', type: 'system' },
    ]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setPatients([]);
                return;
            }

            const { data: patientsData, error: patientsError } = await supabase
                .from('pacientes')
                .select('id, nombre, created_at')
                .eq('doctor_id', user.id)
                .order('created_at', { ascending: false });

            if (patientsError) throw patientsError;

            const mapped = patientsData.map(p => ({
                id: p.id,
                nombre: p.nombre,
                ultimaCita: p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
                estado: 'Activo',
                medicalInfo: 'Ver Historial'
            }));

            setPatients(mapped);
        } catch (error) {
            console.error("Error fetching patients:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || p.estado === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <DoctorLayout>
            <div className="flex min-h-screen bg-slate-50">
                <DoctorSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    profile={profile}
                />

                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    className="w-full md:w-96 bg-slate-50 border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 rounded-lg py-2 pl-10 pr-4 outline-none transition-all text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsScanModalOpen(true)}
                                className="hidden md:flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-sky-600 transition-colors shadow-lg shadow-sky-400/20"
                            >
                                <Zap size={16} /> Nuevo Escaneo
                            </button>
                            <div className="relative">
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className={`relative p-2 rounded-lg transition-all ${isNotificationsOpen ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <Bell size={20} />
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                                </button>

                                <AnimatePresence>
                                    {isNotificationsOpen && (
                                        <>
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setIsNotificationsOpen(false)}
                                                className="fixed inset-0 z-40"
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-2"
                                            >
                                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                                    <h4 className="text-sm font-bold text-slate-800">Notificaciones</h4>
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto px-2">
                                                    {notifications.map(notif => (
                                                        <div key={notif.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer mb-1">
                                                            <p className="text-xs text-slate-700 font-medium leading-relaxed">{notif.text}</p>
                                                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{notif.time}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="px-4 py-2 border-t border-slate-50 mt-2 text-center">
                                                    <button className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:text-sky-700">Ver todas</button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'Inicio' ? (
                            <div className="max-w-7xl mx-auto space-y-6">
                                <section className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        <span className="text-xs font-semibold uppercase tracking-wider opacity-90">MediScan AI v4.0</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                                        Tu consulta física,<br />
                                        <span className="text-sky-200">ahora digital.</span>
                                    </h1>
                                    <p className="text-sky-100 text-sm">Portal del Doctor: Gestiona tu clínica con inteligencia artificial.</p>
                                </section>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Pacientes Totales" value={patients.length} icon={Users} trend="+12%" />
                                    <StatCard title="Uso MediScan AI" value="84%" icon={Zap} trend="+3.2%" color="indigo" />
                                    <StatCard title="Citas de Hoy" value="12" icon={Clock} trend="-2" color="amber" />
                                    <StatCard title="Nivel Salud" value="98%" icon={Activity} trend="+1.5%" color="emerald" />
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800">Actividad Reciente</h3>
                                        <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">Ver Todos</button>
                                    </div>
                                    <PatientTable patients={filteredPatients.slice(0, 5)} onViewHistory={(p) => setSelectedPatient(p)} />
                                </div>
                            </div>
                        ) : activeTab === 'Pacientes' ? (
                            <div className="max-w-7xl mx-auto">
                                <div className="mb-6 flex items-end justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Expedientes</h2>
                                        <p className="text-sm text-slate-500 mt-1">{filteredPatients.length} Registros activos</p>
                                    </div>
                                    <button
                                        onClick={() => setIsScanModalOpen(true)}
                                        className="bg-sky-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-sky-600 transition-colors"
                                    >
                                        Nuevo Paciente
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    <PatientTable patients={filteredPatients} onViewHistory={(p) => setSelectedPatient(p)} />
                                </div>
                            </div>
                        ) : activeTab === 'Citas' ? (
                            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <Appointments />
                            </div>
                        ) : activeTab === 'Secretaría' ? (
                            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                                <SecretaryAppointments />
                            </div>
                        ) : null}
                    </div>
                </main>
            </div>

            <ScanModal
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onConfirm={() => fetchPatients()}
            />

            <PatientDetailModal
                isOpen={!!selectedPatient}
                patient={selectedPatient}
                onClose={() => setSelectedPatient(null)}
            />

            <NotificationToast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </DoctorLayout>
    );
}
