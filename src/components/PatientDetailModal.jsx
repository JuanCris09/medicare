import { X, Calendar, User, FileText, Activity, FileDown, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadPatientPDF } from '../utils/pdfGenerator';

export default function PatientDetailModal({ isOpen, patient, onClose }) {
    if (!isOpen || !patient) return null;

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
                className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-medical-50 text-medical-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <User size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{patient.nombre}</h2>
                            <p className="text-slate-500 text-sm font-bold tracking-tight">ID: #{patient.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-2 text-slate-400">
                                <Calendar size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Última Cita</span>
                            </div>
                            <p className="text-lg font-bold text-slate-700">{patient.ultimaCita}</p>
                        </div>
                        <div className={`p-6 rounded-3xl border border-slate-100 ${patient.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                            <div className="flex items-center gap-3 mb-2 text-slate-400">
                                <Activity size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Estado</span>
                            </div>
                            <p className="text-lg font-bold">{patient.estado}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-medical-50 rounded-3xl border border-medical-100 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-white text-medical-600 rounded-2xl flex items-center justify-center shadow-sm border border-medical-100">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-medical-600 uppercase tracking-widest mb-1">Tipo de Atención</p>
                            <p className="text-lg font-bold text-slate-800">{patient.tipoAtencion || 'Consulta General'}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-400">
                            <FileText size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Descripción / Hallazgos</span>
                        </div>
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 border-dashed">
                            <p className="text-slate-600 leading-relaxed font-bold">
                                {patient.medicalInfo || patient.diagnostico || 'No hay información registrada.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 sticky bottom-0 z-10">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={() => downloadPatientPDF(patient)}
                        className="px-8 py-4 rounded-2xl bg-medical-600 text-white font-bold hover:bg-medical-700 shadow-xl shadow-medical-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        Descargar PDF <FileDown size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}


