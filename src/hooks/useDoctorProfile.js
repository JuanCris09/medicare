import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useDoctorProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setProfile(null);
                    return;
                }

                const { data, error: profileError } = await supabase
                    .from('doctor_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                setProfile(data);

                // Set CSS Variables for global branding and customization
                if (data) {
                    if (data.brand_color) {
                        document.documentElement.style.setProperty('--medical-primary', data.brand_color);
                    }
                    if (data.font_family) {
                        document.documentElement.style.setProperty('--font-family-base', `'${data.font_family}', sans-serif`);
                        document.body.style.fontFamily = `'${data.font_family}', sans-serif`;
                    }
                    if (data.ui_density) {
                        const spacing = data.ui_density === 'compact' ? '0.75' : data.ui_density === 'spacious' ? '1.5' : '1';
                        document.documentElement.style.setProperty('--ui-spacing-multiplier', spacing);
                    }
                }
            } catch (err) {
                console.error('Error fetching doctor profile:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    return { profile, loading, error };
}
