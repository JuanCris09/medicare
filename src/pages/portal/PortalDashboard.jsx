import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, User, CreditCard, History, AlertTriangle,
    Settings, Eye, Ear, Stethoscope, ChevronRight, X,
    Phone, Droplet, Thermometer, ShieldAlert, Camera, Loader2, ShieldCheck,
    Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import useOCR from '../../hooks/useOCR';
import AppointmentModal from '../../components/AppointmentModal'; // Import Component

const CategoryCard = ({ icon: Icon, title, count, onClick, active }) => (
    <button
        onClick={onClick}
        className={`flex-1 min-w-[120px] p-5 rounded-3xl border transition-all flex flex-col items-center gap-3 ${active ? 'bg-medical-600 border-medical-600 shadow-xl shadow-medical-600/20' : 'bg-white border-slate-100 shadow-sm'
            }`}
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <Icon size={24} />
        </div>
        <div className="text-center">
            <p className={`text-xs font-black uppercase tracking-tight ${active ? 'text-white' : 'text-slate-800'}`}>{title}</p>
            <p className={`text-[10px] font-bold ${active ? 'text-white/60' : 'text-slate-400'}`}>{count} Registros</p>
        </div>
    </button>
);

const DigitalCard = ({ type, title, name, id, photo, verified }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            className="relative w-full aspect-[1.6/1] perspective-1000"
            onClick={() => setFlipped(!flipped)}
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d cursor-pointer"
            >
                {/* Front */}
                <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-6 text-white overflow-hidden shadow-2xl ${type === 'passport' ? 'bg-indigo-900' : 'bg-slate-900'
                    }`}>
                    {/* Background Image if available */}
                    {photo && (
                        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                            <img src={photo} alt="ID Background" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 overflow-hidden">
                            {photo ? (
                                <img src={photo} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                type === 'passport' ? <ShieldAlert size={28} /> : <User size={28} />
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{type === 'passport' ? 'Pasaporte Digital' : 'Documento Nacional'}</p>
                            <p className="text-lg font-black tracking-tighter">REPÚBLICA</p>
                        </div>
                    </div>
                    <div className="mt-8 space-y-1 relative z-10">
                        <p className="text-[10px] uppercase font-bold text-white/40">Nombre Completo</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xl font-black truncate">{name}</p>
                            {verified && <ShieldCheck size={18} className="text-emerald-400" />}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-end relative z-10">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-white/40">ID Identificador</p>
                            <p className="text-sm font-black font-mono tracking-widest">{id}</p>
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <CreditCard size={20} />
                        </div>
                    </div>
                </div>

                {/* Back (QR/Info) */}
                <div className={`absolute inset-0 backface-hidden rounded-[2rem] p-8 bg-white border-2 border-slate-100 flex flex-col items-center justify-center transform rotateY-180 shadow-2xl`}>
                    <div className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <div className="w-24 h-24 border-4 border-slate-900 border-dashed rounded-lg flex items-center justify-center">
                            <p className="text-[8px] font-black text-center text-slate-400">QR DE SEGURIDAD<br />DINÁMICO</p>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Único de Validación</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">MD-{id ? id.slice(-4) : 'XXXX'}-{new Date().getFullYear()}</p>
                </div>
            </motion.div>
        </div>
    );
};

export default function PortalDashboard() {
    const [user, setUser] = useState({
        nombre: 'Usuario',
        photo: null,
        cedula: '',
        id: ''
    });
    const [loading, setLoading] = useState(true);
    const [healthProfile, setHealthProfile] = useState({
        tipoSangre: 'O +',
        alergias: 'No registradas',
        contactoEmergencia: 'No asignado',
        telefonoEmergencia: ''
    });

    const [records, setRecords] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [activeCategory, setActiveCategory] = useState('General');
    const [showSOS, setShowSOS] = useState(false);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);



    const [clinicConfig, setClinicConfig] = useState({
        doctorName: 'Dr. Juan Pérez',
        logoUrl: null
    });

    const [editingAppointment, setEditingAppointment] = useState(null);

    const fetchAppointments = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            const { data } = await supabase
                .from('citas')
                .select(`
                    *,
                    pacientes (nombre, cedula)
                `)
                .eq('doctor_id', authUser.id) // PRIVACY FIX
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true });

            if (data) setAppointments(data);
        } catch (err) {
            console.error("Error fetching appointments:", err);
        }
    };

    const handleSaveAppointment = async (formData, isNewPatient) => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error("Sesión no válida");

            let finalPacienteId = formData.paciente_id;
            let actionType = 'NEW_APPOINTMENT';

            // 1. Create patient if needed
            if (isNewPatient && !editingAppointment) {
                const { data: newP, error: pError } = await supabase
                    .from('pacientes')
                    .insert([{
                        nombre: formData.nombre_nuevo,
                        cedula: formData.documento_nuevo,
                        doctor_id: authUser.id
                    }])
                    .select()
                    .single();

                if (pError) throw pError;
                finalPacienteId = newP.id;
            }

            let error;
            if (editingAppointment) {
                actionType = 'RESCHEDULE';
                const { error: updateError } = await supabase
                    .from('citas')
                    .update({
                        paciente_id: finalPacienteId,
                        fecha: formData.fecha,
                        hora: formData.hora,
                        motivo: formData.motivo,
                        estado: formData.estado,
                        doctor_id: authUser.id
                    })
                    .eq('id', editingAppointment.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('citas')
                    .insert([{
                        paciente_id: finalPacienteId,
                        fecha: formData.fecha,
                        hora: formData.hora,
                        motivo: formData.motivo,
                        estado: formData.estado,
                        doctor_id: authUser.id
                    }]);
                error = insertError;
            }

            if (error) throw error;

            notifyTelegramChange(formData, actionType, isNewPatient ? formData.nombre_nuevo : null);
            alert(editingAppointment ? 'Cita actualizada' : 'Cita creada');
            fetchAppointments();
        } catch (err) {
            console.error("Error saving appointment:", err);
            alert("Error: " + err.message);
        }
    };

    const handleDeleteAppointment = async (id, patientName) => {
        if (!window.confirm("¿Estás seguro de cancelar esta cita?")) return;
        try {
            const { error } = await supabase.from('citas').delete().eq('id', id);
            if (error) throw error;
            notifyTelegramChange({ paciente_id: 'unknown' }, 'CANCEL', patientName);
            alert('Cita cancelada');
            fetchAppointments(user.id);
        } catch (err) {
            console.error("Error deleting:", err);
            alert("Error al cancelar");
        }
    };

    const notifyTelegramChange = async (data, type, manualName = null) => {
        try {
            let patientName = manualName;
            if (!patientName && data.paciente_id) {
                const { data: p } = await supabase.from('pacientes').select('nombre').eq('id', data.paciente_id).single();
                if (p) patientName = p.nombre;
            }
            await fetch('/api/send-telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientName: patientName || 'Paciente',
                    date: data.fecha,
                    time: data.hora,
                    motivo: data.motivo,
                    type: type
                })
            });
        } catch (e) {
            console.error("Telegram Error:", e);
        }
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await supabase.from('configuracion').select('*').limit(1).maybeSingle();
                if (data) {
                    setClinicConfig({
                        doctorName: data.nombre_doctor || 'Dr. Juan Pérez',
                        logoUrl: data.logo_url || null
                    });
                }
            } catch (error) {
                console.error("Error fetching config:", error);
            }
        };
        fetchConfig();

        const storedUser = localStorage.getItem('medicare_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("PortalDashboard: User loaded:", parsedUser);
            setUser(parsedUser);
            // Use ID for fetching records since cedula column is missing in pacientes
            setLoading(true);
            console.log("PortalDashboard: Fetching data for ID:", parsedUser.id);
            Promise.all([
                fetchRecords(parsedUser.id),
                fetchHealthProfile(parsedUser.id),
                fetchIdentityDocuments(parsedUser.cedula),
                fetchAppointments(parsedUser.id)
            ]).finally(() => {
                console.log("PortalDashboard: All fetches complete.");
                setLoading(false);
            });
        } else {
            // Redirect to login if no user found
            window.location.href = '/portal';
            return;
        }
    }, []);

    const fetchIdentityDocuments = async (cedula) => {
        if (!cedula) return;
        try {
            const { data } = await supabase
                .from('documentos_identidad')
                .select('url_frente')
                .eq('numero_documento', cedula)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data && data.url_frente) {
                setUser(prev => ({ ...prev, photo: data.url_frente, verified: true }));
            }
        } catch (err) {
            console.error("Error fetching documents:", err);
        }
    };

    const fetchRecords = async (userId) => {
        if (!userId) return;
        try {
            const { data } = await supabase
                .from('historial_medico')
                .select('*')
                .eq('paciente_id', userId)
                .order('fecha_consulta', { ascending: false });

            if (data) setRecords(data);
        } catch (err) {
            console.error("Error fetching records:", err);
        }
    };

    const fetchHealthProfile = async (userId) => {
        if (!userId) return;
        try {
            const { data } = await supabase
                .from('perfil_salud')
                .select('tipo_sangre, alergias, contacto_emergencia_tel')
                .eq('paciente_id', userId)
                .maybeSingle();

            if (data) {
                setHealthProfile({
                    tipoSangre: data.tipo_sangre || 'O +',
                    alergias: data.alergias || 'Sin alergias registradas',
                    contactoEmergencia: 'Contacto',
                    telefonoEmergencia: data.contacto_emergencia_tel || 'No registrado'
                });
            }
        } catch (err) {
            console.error("Error fetching health profile:", err);
        }
    };

    const { isScanning, scanDocument } = useOCR();

    const uploadIDImage = async (base64, cedula) => {
        const blob = await (await fetch(base64)).blob();
        const fileName = `${cedula}_${Date.now()}.jpg`;
        const filePath = `identidades/${fileName}`;

        const { error } = await supabase.storage
            .from('identidades')
            .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('identidades')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSaveProfile = async () => {
        if (!user.id) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('perfil_salud')
                .upsert({
                    paciente_id: user.id,
                    tipo_sangre: healthProfile.tipoSangre,
                    alergias: healthProfile.alergias,
                    contacto_emergencia_tel: healthProfile.telefonoEmergencia
                }, { onConflict: 'paciente_id' });

            if (error) throw error;
            alert('Perfil actualizado con éxito');
            setShowProfileEdit(false);
            fetchHealthProfile(user.id);
        } catch (err) {
            console.error("Error saving profile:", err);
            alert('Error al guardar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleScanID = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const photoUrl = event.target.result;
                const result = await scanDocument(photoUrl);

                if (result) {
                    const finalPhotoUrl = await uploadIDImage(photoUrl, user.cedula);
                    const { error: idError } = await supabase
                        .from('documentos_identidad')
                        .insert([{
                            paciente_id: user.id,
                            tipo_documento: 'Cédula',
                            numero_documento: user.cedula,
                            url_frente: finalPhotoUrl
                        }]);

                    if (idError) console.warn("Error saving document record:", idError);

                    const newUser = {
                        ...user,
                        nombre: result.nombre !== 'Paciente Desconocido' ? result.nombre : user.nombre,
                        cedula: result.dni !== 'No detectado' ? result.dni : user.cedula,
                        photo: finalPhotoUrl,
                        verified: true
                    };

                    setUser(newUser);
                    localStorage.setItem('medicare_user', JSON.stringify(newUser));
                    setShowProfileEdit(true);
                }
            } catch (err) {
                console.error("OCR Portal Error:", err);
            }
        };
        reader.readAsDataURL(file);
    };

    const categories = [
        { title: 'General', icon: Stethoscope, count: 5 },
        { title: 'Visual', icon: Eye, count: 1 },
        { title: 'Auditivo', icon: Ear, count: 2 },
        { title: 'Dental', icon: HeartPulse, count: 4 }
    ];

    const filteredRecords = activeCategory === 'General'
        ? records
        : records.filter(r => r.tipo_atencion === activeCategory);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-32 overflow-x-hidden">
            {/* Header Area */}
            <header className="px-6 pt-10 pb-6 bg-white border-b border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-medical-600 rounded-xl flex items-center justify-center shadow-lg shadow-medical-600/20">
                            <HeartPulse className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight italic">MediCare</span>
                    </div>
                    <button
                        onClick={() => setShowProfileEdit(true)}
                        className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100 hover:text-medical-600 transition-colors"
                    >
                        <User size={22} />
                    </button>
                </div>
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hola, {user.nombre}</h1>
                    <p className="text-slate-400 font-bold text-sm tracking-tight">Tu estado de salud hoy es <span className="text-emerald-500">Excelente</span></p>
                </div>
            </header>

            {/* SOS Button */}
            <div className="px-6 mb-8">
                <button
                    onClick={() => setShowProfileEdit(true)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-between group transition-all active:scale-95"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="text-white fill-white" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-lg leading-tight">SOS MÉDICO</p>
                            <p className="text-red-100 text-xs font-medium">Ver Datos de Emergencia</p>
                        </div>
                    </div>
                    <ChevronRight className="text-white/60 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex gap-2 mt-3">
                    <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <Droplet size={18} className="text-red-500" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Sangre</p>
                            <p className="text-sm font-black text-slate-800">{healthProfile.tipoSangre}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                        <Thermometer size={18} className="text-amber-500" />
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Alergias</p>
                            <p className="text-sm font-black text-slate-800 truncate max-w-[80px]">{healthProfile.alergias}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Digital Wallet (Horizontal Scroll) */}
            <section className="mt-8 space-y-4">
                <div className="px-6 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billetera Digital (Toca para girar)</p>
                    <label className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-slate-600 cursor-pointer active:scale-95 transition-all">
                        <Camera size={14} />
                        <span className="text-[10px] font-black uppercase">Escanear ID</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleScanID} className="hidden" />
                    </label>
                </div>
                <div className="flex overflow-x-auto gap-6 px-6 pb-6 custom-scrollbar snap-x no-scrollbar">
                    <div className="min-w-[85%] sm:min-w-[320px] snap-center">
                        <DigitalCard type="id" title="Cédula Digital" name={user.nombre} id={user.cedula} photo={user.photo} verified={user.verified} />
                    </div>
                    <div className="min-w-[85%] sm:min-w-[320px] snap-center">
                        <DigitalCard type="passport" title="Pasaporte Digital" name={user.nombre} id="E-90483-2026" photo={user.photo} verified={user.verified} />
                    </div>
                    <div className="min-w-[85%] sm:min-w-[320px] snap-center">
                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldAlert size={16} className="text-medical-600" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mi Carnet Digital</p>
                            </div>
                            <div className="flex justify-center">
                                <QRGenerator patient={user} size={160} />
                            </div>
                            <p className="text-center text-[10px] font-bold text-slate-400 mt-4">Escanea este QR para acceso de emergencia</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Appointments Section (Secretary View) */}
            <section className="px-6 mt-6 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de Citas</p>
                        <p className="text-xs font-bold text-slate-500">Vista de Secretaria</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingAppointment(null);
                            setShowAppointmentModal(true);
                        }}
                        className="bg-medical-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-medical-600/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        + Nueva Cita
                    </button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    {appointments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                                        <th className="p-4">Hora</th>
                                        <th className="p-4">Paciente</th>
                                        <th className="p-4">Motivo</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {appointments.map((aps) => (
                                        <tr key={aps.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-black text-slate-800 whitespace-nowrap">
                                                {aps.hora.substring(0, 5)} <br />
                                                <span className="text-[10px] text-slate-400 font-bold">{new Date(aps.fecha).toLocaleDateString()}</span>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-slate-700">{aps.pacientes?.nombre || 'Desconocido'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">ID: {aps.pacientes?.cedula}</p>
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium max-w-[150px] truncate">
                                                {aps.motivo}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${aps.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' :
                                                    aps.estado === 'Cancelada' ? 'bg-red-100 text-red-600' :
                                                        aps.estado === 'En Espera' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {aps.estado}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingAppointment(aps);
                                                            setShowAppointmentModal(true);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                                        title="Editar / Reprogramar"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteAppointment(aps.id, aps.pacientes?.nombre)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                        title="Cancelar Cita"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-10 text-center flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Calendar size={24} />
                            </div>
                            <p className="text-slate-400 font-bold">No hay citas programadas</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Categories Grid */}
            <section className="px-6 mt-4 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial Clínico</p>
                <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar">
                    {categories.map((cat, i) => (
                        <CategoryCard
                            key={i}
                            {...cat}
                            active={activeCategory === cat.title}
                            onClick={() => setActiveCategory(cat.title)}
                        />
                    ))}
                </div>
            </section>

            {/* Recent Records List */}
            <section className="px-6 mt-8 space-y-4 flex-1">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Últimos Diagnósticos</p>
                    <button className="text-[10px] font-black text-medical-600 uppercase">Ver Todo</button>
                </div>
                <div className="space-y-4">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse"></div>)
                    ) : filteredRecords.length > 0 ? (
                        filteredRecords.slice(0, 4).map((record, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={record.id}
                                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-95 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-medical-50 group-hover:text-medical-600 transition-colors">
                                        <History size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 truncate max-w-[150px]">{record.diagnostico || 'Diagnóstico General'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(record.fecha_consulta || record.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {record.tipo_atencion || 'Atención'}</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-300" />
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400 font-bold">Sin registros en esta categoría</div>
                    )}
                </div>
            </section>

            {/* Bottom Nav */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 rounded-[2.5rem] px-8 py-4 flex items-center justify-between shadow-2xl z-50">
                <button className="text-medical-400 flex flex-col items-center gap-1">
                    <History size={24} />
                    <span className="text-[8px] font-black uppercase">Home</span>
                </button>
                <button className="text-slate-500 flex flex-col items-center gap-1">
                    <CreditCard size={24} />
                    <span className="text-[8px] font-black uppercase">Wallet</span>
                </button>
                {/* SOS Center */}
                <button
                    onClick={() => setShowSOS(true)}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center -mt-12 border-8 border-slate-50 shadow-xl shadow-red-600/30 active:scale-90 transition-all"
                >
                    <AlertTriangle className="text-white animate-pulse" size={32} strokeWidth={2.5} />
                </button>
                <button className="text-slate-500 flex flex-col items-center gap-1">
                    <Stethoscope size={24} />
                    <span className="text-[8px] font-black uppercase">Citas</span>
                </button>
                <button className="text-slate-500 flex flex-col items-center gap-1">
                    <User size={24} />
                    <span className="text-[8px] font-black uppercase">Perfil</span>
                </button>
            </div>

            {/* OCR Loading Overlay */}
            <AnimatePresence>
                {isScanning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white"
                    >
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-medical-500/20 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="animate-spin text-medical-500" size={40} />
                            </div>
                        </div>
                        <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="mt-6 text-xl font-black italic tracking-tighter"
                        >
                            Procesando documento...
                        </motion.p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">MediCare Inteligencia Artificial</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SOS Modal */}
            <AnimatePresence>
                {showSOS && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-red-950/90 backdrop-blur-xl"
                            onClick={() => setShowSOS(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2 text-red-600 font-black italic">
                                    <ShieldAlert size={24} /> SOS MÉDICO
                                </div>
                                <button onClick={() => setShowSOS(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="text-center pb-6 border-b border-slate-100">
                                    <div className="w-24 h-24 bg-slate-50 border-2 border-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 overflow-hidden">
                                        <User size={60} className="text-slate-200" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800">{user.nombre}</h2>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{user.cedula}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-red-50 p-4 rounded-3xl border border-red-100 space-y-1">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <Droplet size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">SANGRE</span>
                                        </div>
                                        <p className="text-xl font-black text-red-900">{healthProfile.tipoSangre}</p>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 space-y-1">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Thermometer size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">ALERGIAS</span>
                                        </div>
                                        <p className="text-xs font-black text-amber-900 truncate">{healthProfile.alergias}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-2">Contacto de Emergencia</p>
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 truncate max-w-[180px]">{healthProfile.contactoEmergencia}</p>
                                            <p className="text-xs font-bold text-slate-500">{healthProfile.telefonoEmergencia}</p>
                                        </div>
                                        <a href={`tel:${healthProfile.telefonoEmergencia}`} className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all">
                                            <Phone size={24} />
                                        </a>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            capture="environment" // Force rear camera
                                            onChange={handleScanID}
                                        />
                                    </div>
                                </div>

                                <button
                                    className="w-full py-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                    onClick={() => setShowSOS(false)}
                                >
                                    Cerrar Pantalla de Emergencia
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Appointment Modal (New CRUD) */}
            <AnimatePresence>
                {showAppointmentModal && (
                    <AppointmentModal
                        isOpen={showAppointmentModal}
                        onClose={() => {
                            setShowAppointmentModal(false);
                            setEditingAppointment(null);
                        }}
                        onSave={handleSaveAppointment}
                        appointmentToEdit={editingAppointment}
                    />
                )}
            </AnimatePresence>

            {/* Profile Edit Modal */}
            <AnimatePresence>
                {showProfileEdit && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setShowProfileEdit(false)}
                        />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white rounded-[3rem] p-8 overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-slate-800">Perfil de Salud</h3>
                                <button onClick={() => setShowProfileEdit(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-2">Tipo de Sangre</label>
                                            <select
                                                value={healthProfile.tipoSangre}
                                                onChange={e => setHealthProfile({ ...healthProfile, tipoSangre: e.target.value })}
                                                className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none"
                                            >
                                                <option>O +</option>
                                                <option>O -</option>
                                                <option>A +</option>
                                                <option>A -</option>
                                                <option>B +</option>
                                                <option>B -</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-2">Alergias</label>
                                        <textarea
                                            rows="2"
                                            value={healthProfile.alergias}
                                            onChange={e => setHealthProfile({ ...healthProfile, alergias: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none resize-none"
                                            placeholder="Ingresa tus alergias..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-2">Contacto de Emergencia</label>
                                        <input
                                            type="text"
                                            value={healthProfile.contactoEmergencia}
                                            onChange={e => setHealthProfile({ ...healthProfile, contactoEmergencia: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none"
                                            placeholder="Nombre..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 px-2">Teléfono Emergencia</label>
                                        <input
                                            type="tel"
                                            value={healthProfile.telefonoEmergencia}
                                            onChange={e => setHealthProfile({ ...healthProfile, telefonoEmergencia: e.target.value })}
                                            className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none"
                                            placeholder="+593..."
                                        />
                                    </div>
                                </div>

                                <button
                                    className="w-full bg-medical-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-medical-600/30 active:scale-95 transition-all"
                                >
                                    GUARDAR CAMBIOS
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
