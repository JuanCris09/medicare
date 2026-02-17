import { Clipboard, ChevronRight, FileDown, User } from 'lucide-react';
import { downloadPatientPDF } from '../utils/pdfGenerator';

export default function PatientTable({ patients, onViewHistory }) {
    if (!patients || patients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <User className="text-slate-400" size={32} />
                </div>
                <h3 className="text-slate-800 font-semibold text-sm">No se encontraron registros</h3>
                <p className="text-slate-500 text-xs mt-2">Inicie un nuevo escaneo para agregar pacientes.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide">Paciente</th>
                            <th className="hidden sm:table-cell px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Última Cita</th>
                            <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide">Estado</th>
                            <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map((p) => (
                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 md:px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm">
                                            {p.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate max-w-[120px] md:max-w-none">{p.nombre}</p>
                                            <p className="hidden md:block text-xs text-slate-500">ID: {p.id.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell px-6 py-4">
                                    <span className="text-sm text-slate-600">{p.ultimaCita}</span>
                                </td>
                                <td className="px-4 md:px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.estado === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <span className={`text-[10px] md:text-xs font-medium ${p.estado === 'Activo' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {p.estado}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 md:px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 md:gap-2">
                                        <button
                                            onClick={() => downloadPatientPDF(p)}
                                            className="p-1.5 md:p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                            title="Exportar PDF"
                                        >
                                            <FileDown size={14} className="md:w-4 md:h-4" />
                                        </button>
                                        <button
                                            onClick={() => onViewHistory && onViewHistory(p)}
                                            className="flex items-center gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg bg-sky-500 text-white font-medium text-xs md:text-sm hover:bg-sky-600 transition-colors"
                                        >
                                            <Clipboard size={14} className="md:w-4 md:h-4" />
                                            <span className="hidden xs:inline">Ver Historial</span>
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
