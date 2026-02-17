import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabaseClient';

export const generatePatientPDF = async (patient) => {
    // 1. Fetch Clinic/Doctor Config for Signature & Branding
    let doctorProfile = {
        doctor_name: 'Dr. Especialista',
        specialty: 'Medicina General',
        logo_url: null,
        clinic_name: 'MediScan Elite'
    };

    try {
        const { data } = await supabase.from('doctor_profiles').select('*').limit(1).maybeSingle();
        if (data) {
            doctorProfile = {
                ...doctorProfile,
                ...data,
                clinic_name: data.clinic_name || 'MediScan Elite'
            };
        }
    } catch (err) {
        console.warn("Could not fetch doctor profile for PDF:", err);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- STYLES ---
    const primaryColor = [15, 23, 42]; // Midnight
    const secondaryColor = [100, 116, 139]; // Slate

    // 1. HEADER (Formal Medical Style)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('HISTORIA CLÍNICA DE CONSULTA EXTERNA', 20, 20);

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    const date = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const folio = `MC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    doc.text(`FECHA: ${date} | HORA: ${time} | FOLIO: ${folio}`, 20, 28);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);

    // 2. SECTION 1: IDENTIFICACIÓN DEL PACIENTE
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('1. IDENTIFICACIÓN DEL PACIENTE', 20, 42);

    const idData = [
        ['NOMBRE COMPLETO:', (patient.nombre || 'N/A').toUpperCase()],
        ['DOCUMENTO:', `CC ${patient.dni || patient.cedula || 'N/A'}`],
        ['FECHA DE NACIMIENTO:', patient.birthDate || 'N/A'],
        ['CIUDAD:', patient.city || 'Bucaramanga'], // Custom or default
        ['PLAN:', patient.plan || 'PARTICULAR']
    ];

    autoTable(doc, {
        startY: 46,
        margin: { left: 25 },
        body: idData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, font: 'helvetica' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 45 },
            1: { textColor: [0, 0, 0] }
        }
    });

    const afterIdY = doc.lastAutoTable.finalY + 10;
    doc.line(20, afterIdY - 5, 190, afterIdY - 5);

    // 3. SECTION 2: MOTIVO DE CONSULTA
    doc.setFont('helvetica', 'bold');
    doc.text('2. MOTIVO DE CONSULTA Y ENFERMEDAD ACTUAL', 20, afterIdY);

    doc.setFont('helvetica', 'normal');
    const motivoText = patient.motivoConsulta || 'Paciente acude para valoración médica general.';
    const motivoLines = doc.splitTextToSize(motivoText, 170);
    doc.text(motivoLines, 20, afterIdY + 8);

    const afterMotivoY = afterIdY + 8 + (motivoLines.length * 5) + 5;

    // 4. SECTION 3: EXAMEN FÍSICO
    doc.setFont('helvetica', 'bold');
    doc.text('3. EXAMEN FÍSICO', 20, afterMotivoY);

    const physical = patient.examenFisico || {
        ta: '120/80 mmHg',
        fc: '78 lpm',
        sat: '97%',
        obs: 'Mucosas húmedas, campos pulmonares bien ventilados.'
    };

    const physicalData = [
        ['Tensión Arterial:', physical.ta],
        ['Frecuencia Cardiaca:', physical.fc],
        ['Saturación O2:', physical.sat],
        ['Observaciones:', physical.obs]
    ];

    autoTable(doc, {
        startY: afterMotivoY + 4,
        margin: { left: 25 },
        body: physicalData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, font: 'helvetica' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 45 }
        }
    });

    const afterPhysicalY = doc.lastAutoTable.finalY + 10;

    // 5. SECTION 4: IMPRESIÓN DIAGNÓSTICA
    doc.setFont('helvetica', 'bold');
    doc.text('4. IMPRESIÓN DIAGNÓSTICA', 20, afterPhysicalY);

    const diagnosicos = patient.diagnosticos || [
        { code: 'J00', desc: 'RINOFARINGITIS AGUDA (RESFRIADO COMÚN)' }
    ];

    let diagY = afterPhysicalY + 6;
    diagnosicos.forEach(d => {
        doc.setFont('helvetica', 'bold');
        doc.text(`• CIE-10: ${d.code}`, 25, diagY);
        doc.setFont('helvetica', 'normal');
        doc.text(` - ${d.desc}`, 45, diagY);
        diagY += 5;
    });

    const afterDiagY = diagY + 5;

    // 6. SECTION 5: PLAN DE MANEJO
    doc.setFont('helvetica', 'bold');
    doc.text('5. PLAN DE MANEJO Y RECOMENDACIONES', 20, afterDiagY);

    const plan = patient.planManejo || [
        'Abundante Hidratación y reposo en casa.',
        'Signos de alarma: Dificultad respiratoria o fiebre >38.5 que no ceda.'
    ];

    let planY = afterDiagY + 8;
    plan.forEach((item, index) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`${index + 1}. ${item}`, 25, planY);
        planY += 5;
    });

    // 7. SIGNATURE FOOTER
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, pageHeight - 40, 190, pageHeight - 40);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`FIRMADO ELECTRÓNICAMENTE POR: ${doctorProfile.doctor_name}`, 20, pageHeight - 33);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text(`${doctorProfile.specialty || 'Especialista'} R.M. ${doctorProfile.medical_license || '741258-S'}`, 20, pageHeight - 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Generado por MediScan Elite - Sistema de Digitalización Médica IA', 20, pageHeight - 10);

    return doc;
};

export const downloadPatientPDF = async (patient) => {
    const doc = await generatePatientPDF(patient);
    doc.save(`Historia_Clinica_${patient.nombre.replace(/\s+/g, '_')}.pdf`);
};
