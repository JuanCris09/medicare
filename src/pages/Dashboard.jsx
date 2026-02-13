import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import PatientTable from '../components/PatientTable';
import ScanModal from '../components/ScanModal';
import NotificationToast from '../components/NotificationToast';
import PatientDetailModal from '../components/PatientDetailModal';
import Appointments from '../components/Appointments';
import Settings from '../components/Settings';
import { supabase } from '../lib/supabaseClient';
import {
    Users,
    Zap,
    Search,
    Plus,
    Bell,
    TrendingUp,
    ClipboardList,
    Activity,
    Loader2,
    Filter,
    CheckCircle,
    Clock,
    Menu,
    X as CloseIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('Inicio');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'telegram' });

    const fetchPatients = async () => {
        try {
            setLoading(true);
            // Fetch patients
            const { data: patientsData, error: patientsError } = await supabase
                .from('pacientes')
                .select('id, nombre, created_at') // Removed diagnostico
                .order('created_at', { ascending: false });

            if (patientsError) throw patientsError;

            const mapped = patientsData.map(p => ({
                id: p.id,
                nombre: p.nombre,
                ultimaCita: p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
                estado: 'Activo',
                medicalInfo: 'Ver Historial' // Placeholder since column is in another table
            }));

            setPatients(mapped);
        } catch (error) {
            console.error("Error fetching patients:", error.message);
            setToast({ show: true, message: `Error: ${error.message || 'Error de conexión'}`, type: 'error' });
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

    const handleConfirmScan = (data) => {
        fetchPatients();
        setToast({
            show: true,
            message: data.notifyTelegram
                ? `Se envió resumen de ${data.nombre} a Telegram`
                : `Paciente ${data.nombre} añadido.`,
            type: data.notifyTelegram ? 'telegram' : 'success'
        });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-4 md:hidden mr-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-3 -ml-2 bg-slate-50 text-medical-600 border border-slate-200 rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center hover:bg-white"
                        >
                            <Menu size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar pacientes por nombre o ID..."
                                className="w-full bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-medical-100 focus:border-medical-600 rounded-2xl py-3 pl-12 pr-4 outline-none transition-all text-sm font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                        <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center relative transition-colors text-slate-500">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-xs uppercase">
                            JP
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'Inicio' ? (
                            <motion.div
                                key="inicio"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-7xl mx-auto space-y-10"
                            >
                                <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 lg:p-16 text-white shadow-2xl border border-slate-800">
                                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-medical-600/20 to-transparent pointer-events-none"></div>
                                    <div className="relative z-10 max-w-2xl">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-medical-500/10 border border-medical-500/20 text-medical-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                                            <Zap size={14} className="fill-medical-300" /> MediScan AI v4.0
                                        </div>
                                        <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                                            Tu consulta física, <span className="text-medical-400">ahora digital.</span>
                                        </h1>
                                        <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                                            Digitaliza historias clínicas en papel con precisión instantánea. Nuestra IA procesa, extrae y organiza tus datos médicos por ti.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => setIsScanModalOpen(true)}
                                                className="bg-medical-600 hover:bg-medical-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-medical-600/30"
                                            >
                                                Comenzar Smart Scan <Zap size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard title="Pacientes Totales" value={patients.length} icon={Users} trend="+12%" />
                                    <StatCard title="Uso MediScan AI" value="84%" icon={Zap} trend="+5.2%" color="indigo" />
                                    <StatCard title="Citas de Hoy" value="12" icon={TrendingUp} trend="-2" color="amber" />
                                    <StatCard title="Nivel Salud" value="98%" icon={Activity} trend="+1.5%" color="emerald" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Pacientes Recientes</h3>
                                            <p className="text-sm text-slate-500 font-bold tracking-tight">Viendo {filteredPatients.slice(0, 5).length} resultados destacados</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('Pacientes')}
                                            className="text-medical-600 text-xs font-black tracking-widest hover:bg-medical-50 px-5 py-2.5 rounded-xl transition-all uppercase"
                                        >
                                            VER TODO
                                        </button>
                                    </div>
                                    <PatientTable
                                        patients={filteredPatients.slice(0, 5)}
                                        onViewHistory={(p) => setSelectedPatient(p)}
                                    />
                                </div>
                            </motion.div>
                        ) : activeTab === 'Pacientes' ? (
                            <motion.div
                                key="pacientes"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-7xl mx-auto space-y-10"
                            >
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                                    <div>
                                        <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic">Directorio Médico</h2>
                                        <p className="text-slate-500 font-bold tracking-tight">Gestión integral de {patients.length} historias clínicas digitalizadas</p>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {['Todos', 'Activo', 'Inactivo', 'En Revisión'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all uppercase border-2 ${statusFilter === status
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    <div className="lg:col-span-1 space-y-6">
                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-8">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filtros Rápidos</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Citas Hoy', icon: Clock, count: 4 },
                                                        { label: 'Resultados IA', icon: Zap, count: 12 },
                                                        { label: 'Verificados', icon: CheckCircle, count: 45 }
                                                    ].map((item, i) => (
                                                        <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-slate-500 hover:text-medical-600 transition-all font-bold text-sm">
                                                            <div className="flex items-center gap-3">
                                                                <item.icon size={18} />
                                                                <span>{item.label}</span>
                                                            </div>
                                                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px]">{item.count}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-dashed border-slate-100">
                                                <button
                                                    onClick={() => setIsScanModalOpen(true)}
                                                    className="w-full bg-medical-50 text-medical-600 p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-medical-100 transition-all border border-medical-100"
                                                >
                                                    <Plus size={18} /> Nuevo Registro
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-3">
                                        {loading ? (
                                            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 flex flex-col items-center justify-center">
                                                <Loader2 className="animate-spin text-medical-600 mb-4" size={40} />
                                                <p className="text-slate-400 font-bold">Cargando directorio...</p>
                                            </div>
                                        ) : filteredPatients.length > 0 ? (
                                            <PatientTable
                                                patients={filteredPatients}
                                                onViewHistory={(p) => setSelectedPatient(p)}
                                            />
                                        ) : (
                                            <div className="bg-white rounded-[2.5rem] border border-slate-100 border-dashed p-20 text-center">
                                                <Search size={40} className="mx-auto text-slate-200 mb-6" />
                                                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Sin resultados</h3>
                                                <p className="text-slate-400 font-medium max-w-xs mx-auto">No encontramos pacientes que coincidan con tu búsqueda actual.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : activeTab === 'Citas' ? (
                            <Appointments />
                        ) : activeTab === 'Configuración' ? (
                            <Settings />
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center h-[60vh] text-center"
                            >
                                <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-3xl flex items-center justify-center mb-6">
                                    <ClipboardList size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 mb-2 italic">Sección {activeTab}</h2>
                                <p className="text-slate-500 font-bold max-w-xs mx-auto">Esta funcionalidad estará disponible en la próxima actualización de MediCare.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => setIsScanModalOpen(true)}
                    className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-medical-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 z-40"
                >
                    <Plus size={24} />
                </button>

                <ScanModal
                    isOpen={isScanModalOpen}
                    onClose={() => setIsScanModalOpen(false)}
                    onConfirm={handleConfirmScan}
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
            </main>
        </div>
    );
}
