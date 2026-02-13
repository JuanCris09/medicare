import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('--- Checking "citas" table ---');
    const { data: citas, error: citasError } = await supabase.from('citas').select('*').limit(1);
    if (citasError) console.error('Error fetching citas:', citasError);
    else {
        console.log('Citas columns:', Object.keys(citas[0] || {}));
    }

    console.log('\n--- Checking "pacientes" table ---');
    const { data: pacientes, error: pacientesError } = await supabase.from('pacientes').select('*').limit(1);
    if (pacientesError) console.error('Error fetching pacientes:', pacientesError);
    else {
        console.log('Pacientes columns:', Object.keys(pacientes[0] || {}));
    }
}

checkSchema();
