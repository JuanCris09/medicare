import { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Info, Smartphone, Camera, RefreshCw, Save, Zap, Stethoscope, User, FileText, Send, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useOCR from '../hooks/useOCR';
import { supabase } from '../lib/supabaseClient';

import { pdfToImage } from '../utils/pdfUtils';

export default function ScanModal({ isOpen, onClose, onConfirm }) {
    const { isScanning, progress, scanDocument } = useOCR();
    const [step, setStep] = useState('idle'); // idle, preview, scanning, result
    const [extractedData, setExtractedData] = useState(null);
    const [notifyTelegram, setNotifyTelegram] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setStep('idle');
            setExtractedData(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            let url;
            if (file.type === 'application/pdf') {
                try {
                    // Generate ID card preview from PDF
                    url = await pdfToImage(file);
                } catch (error) {
                    console.error("Error generating PDF preview:", error);
                    alert("Error al procesar el PDF. Por favor intenta de nuevo.");
                    return;
                }
            } else {
                url = URL.createObjectURL(file);
            }

            setPreviewUrl(url);
            setStep('scanning');
            try {
                // Pass the preview URL (which is now always an image) to the scanner
                const result = await scanDocument(url);
                setExtractedData(result);
                setStep('result');
            } catch (err) {
                console.error("Scan error:", err);
                setStep('idle');
                alert("Error durante el escaneo. Por favor intenta de nuevo.");
            }
        }
    };

    const handleStartScan = async () => {
        setStep('scanning');
        const result = await scanDocument(previewUrl);
        setExtractedData(result);
        setStep('result');
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            // 1. SAVE TO SUPABASE
            const { data, error } = await supabase
                .from('pacientes')
                .insert([
                    {
                        nombre: extractedData.nombre,
                        cedula: extractedData.dni,
                        // qr_token auto-generated
                    }
                ])
                .select();

            if (error) throw error;
            const newPatient = data[0];

            // 2. LINK IDENTITY
            try {
                await supabase.from('documentos_identidad').insert([
                    {
                        paciente_id: newPatient.id,
                        tipo_documento: 'Cédula',
                        numero_documento: extractedData.dni
                    }
                ]);
            } catch (linkErr) {
                console.warn("Could not link identity document:", linkErr);
            }

            // 3. CREATE MEDICAL HISTORY (DIAGNOSIS)
            try {
                await supabase.from('historial_medico').insert([
                    {
                        paciente_id: newPatient.id,
                        diagnostico: extractedData.medicalInfo || 'Sin diagnóstico inicial',
                        tipo_atencion: extractedData.tipoAtencion || 'Consulta General',
                        // medico_id: user.id // If we had the logged-in doctor's ID
                    }
                ]);
            } catch (histErr) {
                console.warn("Could not create medical history:", histErr);
                // Don't fail the whole process if this fails (e.g. table doesn't exist yet)
            }

            // 4. SEND TELEGRAM (IF ENABLED)
            let telegramSid = null;
            if (notifyTelegram) {
                try {
                    const response = await fetch('/api/send-telegram', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'HISTORY',
                            patientName: extractedData.nombre,
                            tipoAtencion: extractedData.tipoAtencion,
                            motivo: extractedData.medicalInfo
                        })
                    });

                    const tgData = await response.json();

                    if (response.ok) {
                        telegramSid = tgData.sid;
                    } else {
                        console.error("Telegram API Error Response:", tgData);
                        if (response.status === 404) {
                            alert("❌ Error: No se encontró el servidor de Telegram. Si estás en desarrollo, asegúrate de estar usando 'vercel dev' en lugar de 'npm run dev'.");
                        } else {
                            alert(`❌ Error enviando a Telegram: ${tgData.details || tgData.error || 'Error desconocido'}`);
                        }
                    }
                } catch (tgErr) {
                    console.error("Telegram Fetch Error:", tgErr);
                    alert("❌ Error de conexión al intentar enviar a Telegram. Verifica tu conexión a internet.");
                }
            }

            onConfirm({
                ...extractedData,
                id: newPatient.id,
                notifyTelegram,
                telegramSid
            });
            onClose();
        } catch (error) {
            console.error("Save Error:", error);
            alert("Error al guardar el paciente: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Scan AI</h2>
                        <p className="text-slate-500 text-sm font-medium">Digitalización inteligente de historias clínicas</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {step === 'idle' && (
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="border-2 border-dashed border-medical-200 rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-medical-500 hover:bg-medical-50/50 transition-all group h-80 relative"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,application/pdf"
                                capture="environment" // Force rear camera
                                onChange={handleFileChange}
                                id="scan-upload"
                            />
                            <div className="w-24 h-24 bg-medical-600 text-white rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-medical-600/30">
                                <Camera size={40} />
                            </div>
                            <p className="text-xl font-bold text-slate-800 mb-2">Capturar o Subir Foto</p>
                            <p className="text-slate-500 font-medium text-sm text-center">Usa la cámara de tu celular para mejores resultados</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="flex flex-col items-center space-y-8 animate-fade-in">
                            <div className="relative w-full max-w-md aspect-[3/4] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <button
                                    onClick={() => setStep('idle')}
                                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-white/40 transition-colors"
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>
                            <button
                                onClick={handleStartScan}
                                className="w-full max-w-md bg-medical-600 text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-medical-600/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <Zap size={24} className="fill-white" /> COMENZAR ESCANEO LÁSER
                            </button>
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="relative w-64 h-80 bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 laser-container">
                                {previewUrl ? (
                                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 grayscale" alt="Scanning" />
                                ) : (
                                    <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
                                        <div className="w-40 h-56 border-2 border-slate-300 rounded border-dashed" />
                                    </div>
                                )}
                                <motion.div
                                    initial={{ top: 0 }}
                                    animate={{ top: "100%" }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 w-full h-1 bg-medical-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                                />
                            </div>

                            <div className="mt-10 w-full max-w-sm">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-sm font-bold text-medical-600 animate-pulse">
                                        {progress < 40 ? 'Procesando imagen...' : progress < 80 ? 'Extrayendo texto con IA...' : 'Analizando diagnóstico...'}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400">{progress}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-medical-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && extractedData && (
                        <div className="animate-fade-in space-y-8">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <Check size={28} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-emerald-900">Paso 2: Validar Información</h3>
                                    <p className="text-sm text-emerald-700 font-medium">Revisa y edita los hallazgos de la IA antes de guardar.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side: Original Preview */}
                                <div className="space-y-4">
                                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest px-2">Documento Original</p>
                                    <div className="aspect-[3/4] bg-slate-100 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden relative group">
                                        <img
                                            src={previewUrl}
                                            className="w-full h-full object-cover grayscale opacity-70"
                                        />
                                        <div className="absolute inset-0 bg-medical-600/5" />
                                    </div>
                                </div>

                                {/* Right Side: Validation Form */}
                                <div className="space-y-6">
                                    <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest px-2">Datos para Expediente</p>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nombre del Paciente"
                                                value={extractedData.nombre}
                                                onChange={(e) => setExtractedData({ ...extractedData, nombre: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        {/* New Cedula Input */}
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <CreditCard size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Cédula de Identidad"
                                                value={extractedData.dni}
                                                onChange={(e) => setExtractedData({ ...extractedData, dni: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <Stethoscope size={20} />
                                            </div>
                                            <select
                                                value={extractedData.tipoAtencion}
                                                onChange={(e) => setExtractedData({ ...extractedData, tipoAtencion: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm appearance-none"
                                            >
                                                <option value="Consulta General">Consulta General</option>
                                                <option value="Revisión Dental">Revisión Dental</option>
                                                <option value="Evaluación Acústica">Evaluación Acústica</option>
                                                <option value="Cirugía">Cirugía</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>

                                        <div className="relative group">
                                            <div className="absolute left-4 top-5 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <FileText size={20} />
                                            </div>
                                            <textarea
                                                rows="8"
                                                placeholder="Descripción / Hallazgos Clínicos"
                                                value={extractedData.medicalInfo}
                                                onChange={(e) => setExtractedData({ ...extractedData, medicalInfo: e.target.value })}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm resize-none custom-scrollbar"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-5 bg-indigo-50 rounded-[1.5rem] border border-indigo-100 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <Send size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-indigo-900 text-sm">Notificar Telegram</p>
                                                <p className="text-[10px] text-indigo-600 font-medium tracking-tight">Enviar resumen al bot corporativo</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setNotifyTelegram(!notifyTelegram)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${notifyTelegram ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                        >
                                            <motion.div
                                                animate={{ x: notifyTelegram ? 26 : 2 }}
                                                className="absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {step === 'result' && (
                    <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 sticky bottom-0 z-10">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Descartar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="px-8 py-4 rounded-2xl bg-medical-600 text-white font-black hover:bg-medical-700 shadow-xl shadow-medical-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} /> Guardando...
                                </>
                            ) : (
                                <>
                                    Confirmar y Guardar <Save size={20} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

