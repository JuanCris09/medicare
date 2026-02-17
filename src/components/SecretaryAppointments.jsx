import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, User, CheckCircle, X, Loader2, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecretaryAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTodayAppointments();
    }, []);

    const fetchTodayAppointments = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('citas')
                .select(`
                    id,
                    fecha,
                    hora,
                    estado,
                    pacientes (nombre)
                `)
                .eq('fecha', today)
                .eq('doctor_id', user.id) // PRIVACY FIX
                .order('hora', { ascending: true });

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching today appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Error: No hay sesión de usuario activa.");
                return;
            }

            const { error } = await supabase
                .from('citas')
                .update({ estado: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setAppointments(prev => prev.map(appt =>
                appt.id === id ? { ...appt, estado: newStatus } : appt
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200">
                <Loader2 size={40} className="animate-spin text-medical-600 mb-4" />
                <p className="text-slate-400 font-bold">Cargando citas de hoy...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Gestión de Citas (Hoy)</h3>
                    <p className="text-sm text-slate-500 font-bold tracking-tight">Viendo {appointments.length} citas programadas para hoy</p>
                </div>
                <button
                    onClick={fetchTodayAppointments}
                    className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                    <RefreshCcw size={18} />
                </button>
            </div>

            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paciente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hora</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {appointments.length > 0 ? (
                                appointments.map((appt) => (
                                    <tr key={appt.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {appt.pacientes?.nombre?.charAt(0) || 'P'}
                                                </div>
                                                <span className="font-bold text-slate-700">{appt.pacientes?.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <Clock size={16} />
                                                <span>{appt.hora}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${appt.estado === 'Pendiente' ? 'bg-amber-50 text-amber-600' :
                                                appt.estado === 'Arrived' || appt.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                {appt.estado === 'Arrived' ? 'LLEGÓ' : appt.estado}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => updateStatus(appt.id, 'Arrived')}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                                                    title="Marcar como Arrived"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(appt.id, 'Cancelada')}
                                                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                    title="Cancelar Cita"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                                                <Clock size={32} />
                                            </div>
                                            <h4 className="font-bold text-slate-800 mb-1">Sin citas para hoy</h4>
                                            <p className="text-slate-400 text-sm">No hay pacientes programados para esta fecha.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-50">
                    {appointments.length > 0 ? (
                        appointments.map((appt) => (
                            <div key={appt.id} className="p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                            {appt.pacientes?.nombre?.charAt(0) || 'P'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-slate-700 truncate">{appt.pacientes?.nombre}</p>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
                                                <Clock size={12} />
                                                <span>{appt.hora}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${appt.estado === 'Pendiente' ? 'bg-amber-50 text-amber-600' :
                                        appt.estado === 'Arrived' || appt.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                        {appt.estado === 'Arrived' ? 'LLEGÓ' : appt.estado}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus(appt.id, 'Arrived')}
                                        className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={14} /> MARCAR LLEGADA
                                    </button>
                                    <button
                                        onClick={() => updateStatus(appt.id, 'Cancelada')}
                                        className="flex-1 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2"
                                    >
                                        <X size={14} /> CANCELAR
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-12 text-center">
                            <Clock size={32} className="mx-auto text-slate-200 mb-3" />
                            <h4 className="font-bold text-slate-800 text-sm mb-1">Sin citas hoy</h4>
                            <p className="text-slate-400 text-[11px]">No hay pacientes programados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
