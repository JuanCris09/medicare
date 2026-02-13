import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabaseClient';

export const downloadPatientPDF = async (patient) => {
    // Fetch Clinic Config
    const { data: config } = await supabase.from('configuracion').select('*').limit(1).single();
    const clinicName = config?.nombre_clinica || 'MediCare';
    const doctorName = config?.nombre_doctor || 'Dr. Especialista';

    const doc = jsPDF();

    // 1. Header & Branding
    doc.setFillColor(79, 70, 229); // Indigo color
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(clinicName, 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma de Digitalización Inteligente', 20, 28);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 150, 20);

    // 2. Patient Info Header
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte Clínico Digitalizado', 20, 55);

    // 3. Table with Info
    const tableData = [
        ['Nombre del Paciente', patient.nombre],
        ['Identificación / ID', patient.dni || patient.id],
        ['Tipo de Atención', patient.tipoAtencion || 'Consulta General'],
        ['Estado', patient.estado || 'Activo'],
        ['Fecha de Escaneo', patient.ultimaCita || new Date().toLocaleDateString('es-ES')],
    ];

    autoTable(doc, {
        startY: 65,
        head: [['Detalle', 'Información']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 10, cellPadding: 5 }
    });

    // 4. Clinical Content
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción / Hallazgos:', 20, finalY);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);

    const content = patient.medicalInfo || patient.diagnostico || 'Sin información registrada.';
    const splitText = doc.splitTextToSize(content, 170);
    doc.text(splitText, 20, finalY + 10);

    // 5. Footer (Simple for mobile compatibility)
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const pageHeight = doc.internal.pageSize.height;
    doc.text(`Generado automáticamente por ${clinicName} AI. Verificado por ${doctorName}.`, 20, pageHeight - 10);

    // Save PDF
    doc.save(`MediCare_${patient.nombre.replace(/\s+/g, '_')}.pdf`);
};
