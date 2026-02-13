import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { pdfToImage } from '../utils/pdfUtils';

export default function useOCR() {
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const cleanText = (text) => {
        return text
            .replace(/[|\\/_]/g, '') // Remove stray symbols
            .replace(/[ \t]+/g, ' ')    // Normalize spaces/tabs but KEEP newlines
            .trim();
    };

    const preprocessImage = (source) => {
        return new Promise(async (resolve, reject) => {
            try {
                // If the source is a PDF (blob or string), we rely on ScanModal to have converted it to an image URL.
                // However, for robustness, if we receive a raw PDF url/blob here, we should handle it.
                // But generally ScanModal does the preview generation (to image) and passes that URL.

                // We'll treat 'source' as an image URL/Blob URL.

                const img = new Image();
                img.src = source;
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw image
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // Grayscale and Contrast enhancement
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

                        // Simple contrast enhancement
                        let contrast = 1.5; // Factor
                        let factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                        let color = factor * (avg - 128) + 128;

                        data[i] = color;     // R
                        data[i + 1] = color; // G
                        data[i + 2] = color; // B
                    }

                    ctx.putImageData(imageData, 0, 0);
                    resolve(canvas.toDataURL());
                };
                img.onerror = (e) => reject(e);

            } catch (e) {
                reject(e);
            }
        });
    };

    const scanDocument = useCallback(async (imageSource) => {
        if (!imageSource) return null;

        setIsScanning(true);
        setProgress(0);

        try {
            // 1. Pre-process image
            const processedImage = await preprocessImage(imageSource);

            // 2. OCR with Worker
            const worker = await Tesseract.createWorker('spa', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const { data: { text, confidence } } = await worker.recognize(processedImage);
            await worker.terminate();

            const cleanedText = cleanText(text);
            console.log("OCR Text:", cleanedText);

            // 3. Deep Regex Parsing
            // Robust Synonyms Regex
            // Updated to support 'NOMBRE COMPLETO' and optional colons
            const nombreRegex = /(?:NOMBRE COMPLETO|Nombre|Paciente|A nombre de|Sr\/Sra|Atención|Nombres|Apellidos)[:\s]*([A-Za-zÀ-ÿ\s]{2,50})(?:\r?\n|$)/i;

            // Updated to support 'DOCUMENTO' and 'CC' with optional colons
            const dniRegex = /(?:CC|DNI|Cédula|ID|Documento|Identificación|D\.N\.I|CEDULA|NUMERO)[:\s]*(\d{7,12})/i;
            const dniFallbackRegex = /\b(\d{7,12})\b/g;

            // Multiple Diagnostic/Analysis Synonyms
            const patterns = [
                { key: 'Diagnóstico', regex: /(?:Diagnóstico|Dx):\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|$)/i },
                { key: 'Observaciones', regex: /Observaciones:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|$)/i },
                { key: 'Análisis', regex: /Análisis:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|$)/i },
                { key: 'Resultados', regex: /Resultados:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|$)/i },
                { key: 'Evolución', regex: /Evolución:\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+:|$)/i }
            ];

            const parsedData = {
                nombre: 'Paciente Desconocido',
                dni: 'No detectado',
                medicalInfo: '',
                tipoAtencion: 'Consulta General', // Default
                confidence: Math.round(confidence)
            };

            const nombreMatch = cleanedText.match(nombreRegex);
            if (nombreMatch) parsedData.nombre = nombreMatch[1].trim();

            const dniMatch = cleanedText.match(dniRegex);
            if (dniMatch) {
                parsedData.dni = dniMatch[1].trim();
            } else {
                // Fallback for ID: look for any 7-10 digit number
                const matches = cleanedText.match(dniFallbackRegex);
                if (matches && matches.length > 0) {
                    parsedData.dni = matches[0];
                }
            }

            // Detect Tipo de Atención
            if (/dental|diente|limpieza|extracción|ortodoncia/i.test(cleanedText)) {
                parsedData.tipoAtencion = 'Revisión Dental';
            } else if (/acústica|oído|audiometría|audición/i.test(cleanedText)) {
                parsedData.tipoAtencion = 'Evaluación Acústica';
            } else if (/cirugía|quirúrgico|operación|sala/i.test(cleanedText)) {
                parsedData.tipoAtencion = 'Cirugía';
            }

            // Merge all diagnostic/analysis sections
            let diagnosticSections = [];
            patterns.forEach(p => {
                const match = cleanedText.match(p.regex);
                if (match) {
                    diagnosticSections.push(`${p.key}: ${match[1].trim()}`);
                }
            });

            if (diagnosticSections.length > 0) {
                parsedData.medicalInfo = diagnosticSections.join('\n\n');
            } else {
                // Fallback: take a generic block if no headers found
                parsedData.medicalInfo = cleanedText.substring(0, Math.min(cleanedText.length, 300)) + (cleanedText.length > 300 ? '...' : '');
            }

            // Fallback for Name if label not found: more aggressive for IDs
            if (parsedData.nombre === 'Paciente Desconocido') {
                const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                for (let i = 0; i < Math.min(lines.length, 8); i++) {
                    // Look for lines that look like a Full Name (ALL CAPS or Mixed Case)
                    const match = lines[i].match(/^[A-ZÀ-Ÿ\s]{5,40}$/) || lines[i].match(/^[A-Z][a-zÀ-ÿ]+\s+[A-Z][a-zÀ-ÿ]+(?:\s+[A-Z][a-zÀ-ÿ]+)?$/);
                    // Avoid keywords
                    if (match && !/REPUBLICA|NACIMIENTO|EXPEDICION|IDENTIDAD|CEDULA|DOCUMENTO|FOLIO|PAGINA/i.test(lines[i])) {
                        parsedData.nombre = lines[i];
                        break;
                    }
                }
            }

            setIsScanning(false);
            setProgress(100);

            return parsedData;
        } catch (err) {
            console.error("Advanced OCR Error:", err.message);
            setIsScanning(false);
            throw err;
        }
    }, []);

    return {
        isScanning,
        progress,
        scanDocument
    };
}
