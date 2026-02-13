import { Clipboard, ChevronRight, FileDown } from 'lucide-react';
import { downloadPatientPDF } from '../utils/pdfGenerator';

export default function PatientTable({ patients, onViewHistory }) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-[0.15em] font-black">
                            <th className="px-8 py-5">Nombre / ID</th>
                            <th className="px-8 py-5">Última Cita</th>
                            <th className="px-8 py-5">Estado</th>
                            <th className="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {patients.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <p className="font-bold text-slate-800 group-hover:text-medical-600 transition-colors">{p.nombre}</p>
                                    <p className="text-xs text-slate-400 font-medium">#{p.id}</p>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-slate-600">{p.ultimaCita}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${p.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        p.estado === 'En Revisión' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                        {p.estado}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => downloadPatientPDF(p)}
                                            className="p-2 border border-slate-200 rounded-xl hover:bg-white hover:border-medical-600 hover:text-medical-600 hover:shadow-lg transition-all"
                                            title="Descargar PDF"
                                        >
                                            <FileDown size={18} />
                                        </button>
                                        <button
                                            onClick={() => onViewHistory && onViewHistory(p)}
                                            className="p-2 border border-slate-200 rounded-xl hover:bg-white hover:border-medical-600 hover:text-medical-600 hover:shadow-lg transition-all"
                                            title="Ver Historia"
                                        >
                                            <Clipboard size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
