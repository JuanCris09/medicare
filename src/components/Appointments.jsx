import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, User, CheckCircle, X, ChevronRight, Loader2, Send, Bell, Pencil, Trash2 } from 'lucide-react';
import AppointmentModal from './AppointmentModal';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

const DEMO_DOCTOR_ID = '00000000-0000-0000-0000-000000000000';

export default function Appointments({ forcedDoctorId = null }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [searchPatient, setSearchPatient] = useState('');
    const [doctorId, setDoctorId] = useState(forcedDoctorId);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!forcedDoctorId) {
                const { data: { user } } = await supabase.auth.getUser();
                setDoctorId(user?.id || DEMO_DOCTOR_ID);
            }
        };
        init();
    }, [forcedDoctorId]);

    useEffect(() => {
        if (doctorId) {
            fetchAppointments();
            fetchPatients();
        }
    }, [doctorId]);

    const fetchAppointments = async () => {
        if (!doctorId) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('citas')
            .select(`
                *,
                pacientes (nombre)
            `)
            .eq('doctor_id', doctorId) // PRIVACY FIX
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (data) setAppointments(data);
        setLoading(false);
    };

    const fetchPatients = async () => {
        if (!doctorId) return;
        const { data } = await supabase
            .from('pacientes')
            .select('id, nombre')
            .eq('doctor_id', doctorId); // PRIVACY FIX

        if (data) setPatients(data);
    };

    const handleSaveAppointment = async (formData, isNewPatient) => {
        if (!doctorId) {
            alert("Error: No se pudo identificar al doctor.");
            return;
        }
        setIsSaving(true);
        try {
            let finalPacienteId = formData.paciente_id;
            let patientName = '';

            // 1. Create patient if new
            if (isNewPatient && !editingAppointment) {
                const { data: newPatient, error: pError } = await supabase
                    .from('pacientes')
                    .insert([{
                        nombre: formData.nombre_nuevo,
                        cedula: formData.documento_nuevo,
                        doctor_id: doctorId
                    }])
                    .select()
                    .single();

                if (pError) throw pError;
                finalPacienteId = newPatient.id;
                patientName = newPatient.nombre;
            } else {
                const patient = patients.find(p => p.id === formData.paciente_id);
                patientName = patient?.nombre || 'Paciente';
            }

            let error;
            let actionType = 'NEW_APPOINTMENT';

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
                        doctor_id: doctorId
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
                        estado: formData.estado || 'Pendiente',
                        doctor_id: doctorId
                    }]);
                error = insertError;
            }

            if (error) throw error;

            // Send Telegram
            try {
                await fetch('/api/send-telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: actionType,
                        patientName: patientName,
                        date: formData.fecha,
                        time: formData.hora,
                        motivo: formData.motivo
                    })
                });
            } catch (err) {
                console.error("Telegram notification failed", err);
            }

            setIsModalOpen(false);
            setEditingAppointment(null);
            fetchAppointments();
            fetchPatients(); // Refresh list to include new patient
        } catch (err) {
            console.error("Error saving appointment:", err);
            alert("Error: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAppointment = async (id, patientName) => {
        if (!confirm(`¿Estás seguro de cancelar la cita de ${patientName}?`)) return;

        try {
            const appointment = appointments.find(a => a.id === id);
            const { error } = await supabase
                .from('citas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Send Telegram Cancelation
            try {
                await fetch('/api/send-telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'CANCEL',
                        patientName: patientName,
                        date: appointment?.fecha,
                        time: appointment?.hora
                    })
                });
            } catch (err) {
                console.error("Telegram notification failed", err);
            }

            fetchAppointments();
            alert('Cita cancelada correctamente');
        } catch (err) {
            console.error("Error deleting appointment:", err);
            alert("Error: " + err.message);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.nombre.toLowerCase().includes(searchPatient.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic">Agenda Médica</h2>
                    <p className="text-slate-500 font-bold tracking-tight">Gestiona tus {appointments.length} citas programadas</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAppointment(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-medical-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-medical-700 shadow-xl shadow-medical-600/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Nueva Cita
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Statistics Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Resumen de Hoy</p>
                        <div className="space-y-4">
                            {[
                                { label: 'Pendientes', count: appointments.filter(a => a.estado === 'Pendiente').length, color: 'bg-amber-50 text-amber-600' },
                                { label: 'Completadas', count: appointments.filter(a => a.estado === 'Completada').length, color: 'bg-emerald-50 text-emerald-600' },
                                { label: 'Canceladas', count: appointments.filter(a => a.estado === 'Cancelada').length, color: 'bg-red-50 text-red-600' }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <span className="font-bold text-slate-600">{stat.label}</span>
                                    <span className={`px-3 py-1 rounded-xl font-black text-xs ${stat.color}`}>{stat.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-200">
                            <Loader2 size={40} className="animate-spin text-medical-600 mb-4" />
                            <p className="text-slate-400 font-bold">Cargando agenda...</p>
                        </div>
                    ) : appointments.length > 0 ? (
                        appointments.map((appt) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={appt.id}
                                className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-center gap-3 md:gap-5">
                                    <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 text-slate-400 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-slate-100 group-hover:bg-medical-50 group-hover:text-medical-600 transition-colors">
                                        <span className="text-[9px] md:text-[10px] uppercase font-black">{new Date(appt.fecha + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' })}</span>
                                        <span className="text-lg md:text-xl font-black leading-none">{new Date(appt.fecha + 'T12:00:00').getDate()}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-black text-slate-800 text-base md:text-lg truncate">{appt.pacientes?.nombre}</h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-xs md:text-sm font-medium mt-1">
                                            <span className="flex items-center gap-1 shrink-0"><Clock size={14} /> {appt.hora}</span>
                                            <span className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="truncate max-w-[150px] md:max-w-[200px]">{appt.motivo}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 md:gap-4 border-t border-slate-50 md:border-none pt-4 md:pt-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {appt.estado === 'Pendiente' && (
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                                <Bell size={12} className="fill-indigo-600 shrink-0" />
                                                <span className="text-[9px] font-black uppercase tracking-tight whitespace-nowrap">Recordatorio activo</span>
                                            </div>
                                        )}
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ${appt.estado === 'Pendiente' ? 'bg-amber-50 text-amber-600' :
                                            appt.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {appt.estado}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingAppointment(appt);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-3 hover:bg-medical-50 text-medical-600 rounded-2xl transition-all active:scale-90"
                                            title="Editar Cita"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAppointment(appt.id, appt.pacientes?.nombre)}
                                            className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-all active:scale-90"
                                            title="Cancelar Cita"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 border-dashed p-20 text-center">
                            <Calendar size={40} className="mx-auto text-slate-200 mb-6" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">No hay citas</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto">Tu agenda está despejada por ahora.</p>
                        </div>
                    )}
                </div>
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAppointment(null);
                }}
                onSave={handleSaveAppointment}
                appointmentToEdit={editingAppointment}
            />
        </div>
    );
}
