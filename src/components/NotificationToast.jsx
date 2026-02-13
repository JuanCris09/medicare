import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Check, AlertCircle } from 'lucide-react';

export default function NotificationToast({ show, message, onClose, type = "telegram" }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className={`fixed top-24 right-10 z-[60] bg-white rounded-[1.5rem] shadow-2xl border-l-[6px] p-6 w-80 flex items-start gap-4 ${type === 'telegram' ? 'border-indigo-500' :
                        type === 'error' ? 'border-red-500' :
                            'border-medical-600'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${type === 'telegram' ? 'bg-indigo-50 text-indigo-600' :
                        type === 'error' ? 'bg-red-50 text-red-600' :
                            'bg-medical-50 text-medical-600'
                        }`}>
                        {type === 'telegram' ? <Send size={24} /> :
                            type === 'error' ? <AlertCircle size={24} /> :
                                <Check size={24} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-black text-slate-800 leading-tight mb-1 truncate">
                            {type === 'telegram' ? 'Notificación Telegram' :
                                type === 'error' ? 'Error del Sistema' :
                                    'Registro Exitoso'}
                        </p>
                        <p className="text-xs text-slate-500 font-bold tracking-tight line-clamp-2">
                            {message}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
