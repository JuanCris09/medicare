import DoctorSidebar from '../../components/doctor/DoctorSidebar';
import DoctorLayout from '../../components/doctor/DoctorLayout';
import SecretaryAppointments from '../../components/SecretaryAppointments';
import { useDoctorProfile } from '../../hooks/useDoctorProfile';
import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';

export default function SecretaryAppointmentsPage() {
    const { profile } = useDoctorProfile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <DoctorLayout>
            <div className="flex min-h-screen bg-slate-50 font-sans">
                <DoctorSidebar
                    activeTab="Secretaría"
                    setActiveTab={() => { }} // Static in this view
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    profile={profile}
                />

                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <header className="h-20 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-30">
                        <div className="flex items-center gap-4 md:hidden mr-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-3 -ml-2 bg-slate-50 text-medical-600 border border-slate-200 rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center hover:bg-white"
                            >
                                <Menu size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-slate-800">Módulo de Secretaría</h1>
                        </div>

                        <div className="flex items-center gap-4 ml-6">
                            <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center relative transition-colors text-slate-500">
                                <Bell size={20} />
                            </button>
                            <div className="w-10 h-10 rounded-xl bg-medical-50 text-medical-600 flex items-center justify-center font-bold text-xs uppercase">
                                {profile?.doctor_name?.charAt(0) || 'S'}
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar">
                        <div className="max-w-7xl mx-auto">
                            <SecretaryAppointments />
                        </div>
                    </div>
                </main>
            </div>
        </DoctorLayout>
    );
}
