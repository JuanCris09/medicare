
const nombreRegex = /(?:NOMBRE COMPLETO|Nombre|Paciente|A nombre de|Sr\/Sra|Atención|Nombres|Apellidos)[:\s]*([A-Za-zÀ-ÿ\s]{2,50})(?:\r?\n|$)/i;
const dniRegex = /(?:CC|DNI|Cédula|ID|Documento|Identificación|D\.N\.I|CEDULA|NUMERO)[:\s]*(\d{7,12})/i;

const testCases = [
    { text: "DOCUMENTO 12345678", type: 'dni', expected: '12345678' },
    { text: "CC 87654321", type: 'dni', expected: '87654321' },
    { text: "NOMBRE COMPLETO Juan Perez", type: 'nombre', expected: 'Juan Perez' },
    { text: "Nombre: Maria Lopez", type: 'nombre', expected: 'Maria Lopez' },
    { text: "Documento: 11223344", type: 'dni', expected: '11223344' },
    { text: "CC: 99887766", type: 'dni', expected: '99887766' },
    { text: "Random text without ID", type: 'dni', expected: null },
    { text: "NOMBRE COMPLETO", type: 'nombre', expected: null }, // incomplete
];

console.log("Running OCR Regex Verification...\n");

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    let result = null;
    let match;
    if (test.type === 'dni') {
        match = test.text.match(dniRegex);
        if (match) result = match[1];
    } else {
        match = test.text.match(nombreRegex);
        if (match) result = match[1].trim();
    }

    // Normalized comparison
    const res = result === undefined ? null : result;
    const exp = test.expected;

    if (res === exp) {
        console.log(`✅ Test ${index + 1} Passed: "${test.text}" -> "${res}"`);
        passed++;
    } else {
        console.log(`❌ Test ${index + 1} Failed: "${test.text}"`);
        console.log(`   Expected: ${exp}, Got: ${res}`);
        console.log(`   Match object: ${JSON.stringify(match)}`);
        failed++;
    }
});

console.log(`\nSummary: ${passed} Passed, ${failed} Failed.`);

if (failed > 0) process.exit(1);
