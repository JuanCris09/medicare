import { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Info, Smartphone, Camera, RefreshCw, Save, Zap, Stethoscope, User, FileText, Send, CreditCard, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useOCR from '../hooks/useOCR';
import { supabase } from '../lib/supabaseClient';

import { pdfToImage } from '../utils/pdfUtils';
import { generatePatientPDF } from '../utils/pdfGenerator';

export default function ScanModal({ isOpen, onClose, onConfirm, isDemo = false }) {
    const DEMO_DOCTOR_ID = '00000000-0000-0000-0000-000000000000';
    const { isScanning, progress, scanDocument } = useOCR();
    const [step, setStep] = useState('idle'); // idle, preview, scanning, result
    const [extractedData, setExtractedData] = useState(null);
    const [notifyTelegram, setNotifyTelegram] = useState(true);
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setStep('idle');
            setExtractedData(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    const initializeMedicalData = (result) => ({
        ...result,
        email: result.email || '',
        birthDate: result.birthDate || '',
        city: result.city || 'Bucaramanga',
        plan: result.plan || 'Particular',
        motivoConsulta: result.motivoConsulta || result.medicalInfo || '',
        examenFisico: result.examenFisico || {
            ta: '120/80 mmHg',
            fc: '78 lpm',
            sat: '97%',
            obs: ''
        },
        diagnosticos: result.diagnosticos || [
            { code: '', desc: result.medicalInfo ? 'Ver hallazgos' : '' }
        ],
        planManejo: result.planManejo || [
            'Abundante hidratación y reposo.'
        ]
    });

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
                setExtractedData(initializeMedicalData(result));
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
        setExtractedData(initializeMedicalData(result));
        setStep('result');
    };

    const handleEmailDelivery = async () => {
        if (!extractedData.email) {
            alert("Por favor ingresa un correo electrónico para el envío.");
            return;
        }

        const doc = await generatePatientPDF(extractedData);
        doc.save(`EliteReport_${extractedData.nombre.replace(/\s+/g, '_')}.pdf`);

        const subject = encodeURIComponent(`Tu Reporte Clínico - ${extractedData.nombre}`);
        const body = encodeURIComponent(`Hola ${extractedData.nombre},\n\nAdjunto encontrarás tu reporte clínico digitalizado generado por el sistema MediScan Elite.\n\nSaludos,\nEquipo Médico`);
        window.location.href = `mailto:${extractedData.email}?subject=${subject}&body=${body}`;
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            // 1. GET CURRENT USER (OR USE DEMO ID)
            let creatorId = DEMO_DOCTOR_ID;

            if (!isDemo) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    alert("Error: No hay sesión de usuario activa. Por favor, inicia sesión para guardar pacientes.");
                    setIsSaving(false);
                    return;
                }
                creatorId = user.id;
            }

            // 2. SAVE OR UPDATE PATIENT (Get-or-Create)
            let patientId = null;

            // Try to find if patient already exists by cedula
            const { data: existingPatients, error: searchError } = await supabase
                .from('pacientes')
                .select('id')
                .eq('cedula', extractedData.dni)
                .single();

            if (existingPatients) {
                patientId = existingPatients.id;
                console.log("Patient already exists, reusing ID:", patientId);

                // Update email if provided
                if (extractedData.email) {
                    await supabase
                        .from('pacientes')
                        .update({ email: extractedData.email })
                        .eq('id', patientId);
                }
            } else {
                // Create new patient if doesn't exist
                const { data: newPatientData, error: insertError } = await supabase
                    .from('pacientes')
                    .insert([
                        {
                            nombre: extractedData.nombre,
                            cedula: extractedData.dni,
                            email: extractedData.email,
                            doctor_id: creatorId
                        }
                    ])
                    .select();

                if (insertError) throw insertError;
                patientId = newPatientData[0].id;
                console.log("Created new patient with ID:", patientId);
            }

            // 2. LINK IDENTITY
            try {
                await supabase.from('documentos_identidad').insert([
                    {
                        paciente_id: patientId,
                        tipo_documento: 'Cédula',
                        numero_documento: extractedData.dni
                    }
                ]);
            } catch (linkErr) {
                console.warn("Could not link identity document (likely already linked):", linkErr);
            }

            // 3. CREATE MEDICAL HISTORY (DIAGNOSIS)
            try {
                await supabase.from('historial_medico').insert([
                    {
                        paciente_id: patientId,
                        diagnostico: extractedData.medicalInfo || 'Sin diagnóstico inicial',
                        tipo_atencion: extractedData.tipoAtencion || 'Consulta General',
                    }
                ]);
            } catch (histErr) {
                console.warn("Could not create medical history:", histErr);
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
                            dni: extractedData.dni,
                            tipoAtencion: extractedData.tipoAtencion,
                            motivo: extractedData.motivoConsulta || extractedData.medicalInfo || 'Valoración detallada en el reporte PDF adjunto.',
                            metadata: {
                                nacimiento: extractedData.birthDate,
                                plan: extractedData.plan
                            }
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

            // 5. SEND EMAIL (IF ENABLED)
            if (notifyEmail && extractedData.email) {
                try {
                    const doc = await generatePatientPDF({
                        ...extractedData,
                        cedula: extractedData.dni // Match PDF generator expectation
                    });
                    const pdfBase64 = doc.output('datauristring').split(',')[1];

                    const emailResponse = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: extractedData.email,
                            patientName: extractedData.nombre,
                            pdfBase64: pdfBase64,
                            clinicianName: 'Tu Especialista' // Could be dynamic
                        })
                    });

                    if (emailResponse.status === 404 || emailResponse.status === 504 || emailResponse.status === 502) {
                        alert("❌ Error: No se encontró el servidor de correo. Si estás en desarrollo, asegúrate de usar 'vercel dev' o tener el servidor API en el puerto 3000.");
                        onConfirm({ ...extractedData, id: patientId, notifyEmail: false });
                        onClose();
                        return;
                    }

                    let emailData = {};
                    const responseText = await emailResponse.text();
                    try {
                        emailData = JSON.parse(responseText);
                    } catch (jsonErr) {
                        console.error("JSON Parse Error. Server response was:", responseText);
                        throw new Error(`El servidor devolvió un error inesperado. Respuesta: ${responseText.slice(0, 50)}...`);
                    }

                    if (!emailResponse.ok) {
                        console.error("Email API Error:", emailData);
                        alert(`⚠️ Paciente guardado, pero hubo un error con el correo: ${emailData.details || emailData.error}`);
                    }
                } catch (emailErr) {
                    console.error("Email Delivery Error:", emailErr);
                    alert(`⚠️ Error al intentar enviar el correo: ${emailErr.message}. El paciente se guardó correctamente.`);
                }
            }

            onConfirm({
                ...extractedData,
                id: patientId,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 min-h-screen">
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
                className="relative bg-white md:rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-full md:max-h-[90vh]"
            >
                <div className="px-5 py-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight italic">Smart Scan AI</h2>
                        <p className="text-slate-500 text-[10px] md:text-sm font-medium uppercase tracking-widest">Digitalización inteligente</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
                    {step === 'idle' && (
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="border-2 border-dashed border-medical-200 rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-16 flex flex-col items-center justify-center cursor-pointer hover:border-medical-500 hover:bg-medical-50/50 transition-all group h-64 md:h-80 relative"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,application/pdf"
                                capture="environment"
                                onChange={handleFileChange}
                                id="scan-upload"
                            />
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-medical-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-medical-600/30">
                                <Camera size={28} md:size={40} />
                            </div>
                            <p className="text-lg md:text-xl font-bold text-slate-800 mb-1 md:mb-2 text-center">Capturar o Subir Foto</p>
                            <p className="text-slate-500 font-medium text-[10px] md:text-sm text-center">Usa la cámara para mejores resultados</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="flex flex-col items-center space-y-6 md:space-y-8 animate-fade-in">
                            <div className="relative w-full max-w-xs md:max-w-md aspect-[3/4] rounded-2xl md:rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <button
                                    onClick={() => setStep('idle')}
                                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2.5 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/40 transition-colors"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                            <button
                                onClick={handleStartScan}
                                className="w-full max-w-xs md:max-w-md bg-medical-600 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-lg shadow-2xl shadow-medical-600/40 flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <Zap size={20} className="fill-white" /> COMENZAR ESCANEO LÁSER
                            </button>
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="flex flex-col items-center justify-center py-6 md:py-10">
                            <div className="relative w-48 h-64 md:w-64 md:h-80 bg-slate-100 rounded-xl md:rounded-2xl overflow-hidden shadow-inner border border-slate-200 laser-container">
                                {previewUrl ? (
                                    <img src={previewUrl} className="w-full h-full object-cover opacity-50 grayscale" alt="Scanning" />
                                ) : (
                                    <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center">
                                        <div className="w-32 h-44 md:w-40 md:h-56 border-2 border-slate-300 rounded border-dashed" />
                                    </div>
                                )}
                                <motion.div
                                    initial={{ top: 0 }}
                                    animate={{ top: "100%" }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 w-full h-1 bg-medical-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                                />
                            </div>

                            <div className="mt-8 md:mt-10 w-full max-w-sm">
                                <div className="flex justify-between items-end mb-2 md:mb-3">
                                    <span className="text-[10px] md:text-sm font-bold text-medical-600 animate-pulse truncate max-w-[200px]">
                                        {progress < 40 ? 'Procesando imagen...' : progress < 80 ? 'Extrayendo texto...' : 'Analizando diagnóstico...'}
                                    </span>
                                    <span className="text-[10px] md:text-sm font-bold text-slate-400">{progress}%</span>
                                </div>
                                <div className="w-full h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-medical-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && extractedData && (
                        <div className="animate-fade-in space-y-6 md:space-y-8">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Check size={20} md:size={28} />
                                </div>
                                <div>
                                    <h3 className="text-base md:text-lg font-black text-emerald-900 leading-tight">Mód. 2: Validar Información</h3>
                                    <p className="text-[10px] md:text-sm text-emerald-700 font-medium leading-tight">Revisa y edita los hallazgos antes de guardar.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                                {/* Left Side: Original Preview (Hidden on very small mobile if desired, or just smaller) */}
                                <div className="space-y-4">
                                    <p className="font-bold text-slate-400 uppercase text-[8px] md:text-[10px] tracking-widest px-2">Documento Original</p>
                                    <div className="aspect-[3/4] md:aspect-[3/4] max-h-[250px] md:max-h-none bg-slate-100 rounded-2xl md:rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden relative group">
                                        <img
                                            src={previewUrl}
                                            className="w-full h-full object-cover grayscale opacity-70"
                                        />
                                        <div className="absolute inset-0 bg-medical-600/5" />
                                    </div>
                                </div>

                                {/* Right Side: Validation Form */}
                                <div className="space-y-4 md:space-y-6">
                                    <p className="font-bold text-slate-400 uppercase text-[8px] md:text-[10px] tracking-widest px-2">Datos para Expediente</p>

                                    <div className="space-y-3 md:space-y-4">
                                        <div className="relative group text-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <User size={18} md:size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Nombre del Paciente"
                                                value={extractedData.nombre}
                                                onChange={(e) => setExtractedData({ ...extractedData, nombre: e.target.value })}
                                                className="w-full pl-11 md:pl-12 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="relative group text-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <CreditCard size={18} md:size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Cédula"
                                                value={extractedData.dni}
                                                onChange={(e) => setExtractedData({ ...extractedData, dni: e.target.value })}
                                                className="w-full pl-11 md:pl-12 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="relative group text-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <Mail size={18} md:size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Correo electrónico"
                                                value={extractedData.email || ''}
                                                onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                                                className="w-full pl-11 md:pl-12 pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] md:text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-tighter">Nacimiento</label>
                                                <input
                                                    type="text"
                                                    placeholder="DD/MM/AAAA"
                                                    value={extractedData.birthDate}
                                                    onChange={(e) => setExtractedData({ ...extractedData, birthDate: e.target.value })}
                                                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 text-xs md:text-sm outline-none focus:border-medical-600 shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] md:text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-tighter">Salud</label>
                                                <input
                                                    type="text"
                                                    placeholder="Plan/EPS"
                                                    value={extractedData.plan}
                                                    onChange={(e) => setExtractedData({ ...extractedData, plan: e.target.value })}
                                                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 text-xs md:text-sm outline-none focus:border-medical-600 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="relative group text-sm">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                <Stethoscope size={18} md:size={20} />
                                            </div>
                                            <select
                                                value={extractedData.tipoAtencion}
                                                onChange={(e) => setExtractedData({ ...extractedData, tipoAtencion: e.target.value })}
                                                className="w-full pl-11 md:pl-12 pr-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm appearance-none"
                                            >
                                                <option value="Consulta General">Consulta General</option>
                                                <option value="Revisión Dental">Revisión Dental</option>
                                                <option value="Evaluación Acústica">Evaluación Acústica</option>
                                                <option value="Cirugía">Cirugía</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>

                                        {/* --- DESCRIPTION FIELD --- */}
                                        <div className="pt-3 md:pt-4 border-t border-slate-100 space-y-3">
                                            <p className="font-bold text-slate-400 uppercase text-[8px] md:text-[10px] tracking-widest px-2">Descripción de la Consulta</p>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-5 md:top-6 text-slate-400 group-focus-within:text-medical-600 transition-colors">
                                                    <FileText size={18} md:size={20} />
                                                </div>
                                                <textarea
                                                    placeholder="Hallazgos clínicos..."
                                                    value={extractedData.motivoConsulta}
                                                    onChange={(e) => setExtractedData({ ...extractedData, motivoConsulta: e.target.value, medicalInfo: e.target.value })}
                                                    className="w-full pl-11 md:pl-12 pr-4 md:pr-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white border border-slate-200 font-bold text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-medical-100 focus:border-medical-600 outline-none transition-all shadow-sm min-h-[120px] md:min-h-[150px] resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* --- NOTIFICATIONS --- */}
                                        <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-slate-100">
                                            <div className="p-3 md:p-4 bg-indigo-50 rounded-xl md:rounded-2xl border border-indigo-100 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Send size={16} md:size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-indigo-900 text-[10px] md:text-sm truncate">Resumen Telegram</p>
                                                        <p className="hidden md:block text-[10px] text-indigo-600 font-medium">Notificar al bot corporativo</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setNotifyTelegram(!notifyTelegram)}
                                                    className={`w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors relative flex-shrink-0 ${notifyTelegram ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: notifyTelegram ? 22 : 2 }}
                                                        className="absolute top-0.5 md:top-1 bg-white w-4 h-4 rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>

                                            <div className="p-3 md:p-4 bg-emerald-50 rounded-xl md:rounded-2xl border border-emerald-100 flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Mail size={16} md:size={20} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-emerald-900 text-[10px] md:text-sm truncate">Reporte PDF Email</p>
                                                        <p className="hidden md:block text-[10px] text-emerald-600 font-medium tracking-tight">Envío automático al paciente</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setNotifyEmail(!notifyEmail)}
                                                    className={`w-10 h-5 md:w-12 md:h-6 rounded-full transition-colors relative flex-shrink-0 ${notifyEmail ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: notifyEmail ? 22 : 2 }}
                                                        className="absolute top-0.5 md:top-1 bg-white w-4 h-4 rounded-full shadow-sm"
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-[8px] md:text-[10px] text-slate-400 text-center uppercase tracking-widest font-black">Validación MediScan AI Finalizada</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-slate-50 md:bg-transparent pb-4 md:pb-0">
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSaving}
                                    className="flex-1 bg-medical-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base shadow-lg shadow-medical-600/20 flex items-center justify-center gap-2 hover:bg-medical-700 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-wide"
                                >
                                    {isSaving ? (
                                        <RefreshCw size={18} md:size={20} className="animate-spin" />
                                    ) : (
                                        <><Save size={18} md:size={20} /> GUARDAR Y ENVIAR</>
                                    )}
                                </button>
                                <button
                                    onClick={handleEmailDelivery}
                                    className="hidden sm:flex sm:w-20 aspect-square bg-slate-100 text-slate-400 rounded-2xl md:rounded-3xl items-center justify-center hover:bg-slate-200 hover:text-medical-600 transition-all active:scale-90"
                                    title="Descargar PDF"
                                >
                                    <FileText size={20} md:size={24} />
                                </button>
                                <button
                                    onClick={handleEmailDelivery}
                                    className="sm:hidden w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    <FileText size={18} /> DESCARGAR COPIA PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

