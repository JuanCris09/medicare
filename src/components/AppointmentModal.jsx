import { useState, useEffect } from 'react';
import { X, Save, User, Calendar, Clock, FileText, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';

export default function AppointmentModal({ isOpen, onClose, onSave, appointmentToEdit = null }) {
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        paciente_id: '',
        fecha: '',
        hora: '',
        motivo: '',
        estado: 'Pendiente'
    });

    useEffect(() => {
        if (isOpen) {
            fetchPatients();
            if (appointmentToEdit) {
                setFormData({
                    paciente_id: appointmentToEdit.paciente_id,
                    fecha: appointmentToEdit.fecha,
                    hora: appointmentToEdit.hora,
                    motivo: appointmentToEdit.motivo,
                    estado: appointmentToEdit.estado
                });
            } else {
                // Reset form for new appointment
                setFormData({
                    paciente_id: '',
                    fecha: new Date().toISOString().split('T')[0],
                    hora: '09:00',
                    motivo: '',
                    estado: 'Pendiente'
                });
            }
        }
    }, [isOpen, appointmentToEdit]);

    const fetchPatients = async () => {
        const { data, error } = await supabase
            .from('pacientes')
            .select('id, nombre, cedula')
            .order('nombre');

        if (error) console.error('Error fetching patients:', error);
        else setPatients(data || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            alert('Error al guardar la cita: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {appointmentToEdit ? 'Editar Cita' : 'Nueva Cita'}
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                            {appointmentToEdit ? 'Actualizar detalles' : 'Programar encuentro'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Patient Select */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Paciente</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                <User size={18} />
                            </div>
                            <select
                                required
                                value={formData.paciente_id}
                                onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="">Seleccionar Paciente...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} (ID: {p.cedula})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Fecha</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <input
                                    type="date"
                                    required
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Hora</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Clock size={18} />
                                </div>
                                <input
                                    type="time"
                                    required
                                    value={formData.hora}
                                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Motive */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Motivo de Consulta</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                <FileText size={18} />
                            </div>
                            <textarea
                                required
                                rows="3"
                                placeholder="Describe brevemente el motivo..."
                                value={formData.motivo}
                                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Status (Only on Edit) */}
                    {appointmentToEdit && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Estado</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                    <Check size={18} />
                                </div>
                                <select
                                    value={formData.estado}
                                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-medical-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En Espera">En Espera</option>
                                    <option value="Completada">Completada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl bg-medical-600 text-white font-bold hover:bg-medical-700 shadow-lg shadow-medical-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Guardando...' : (
                                <>
                                    <Save size={18} /> {appointmentToEdit ? 'Actualizar' : 'Guardar Cita'}
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </motion.div>
        </div>
    );
}
