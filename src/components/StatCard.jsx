export default function StatCard({ title, value, icon: Icon, trend, color = "medical" }) {
    const isPositive = trend?.startsWith('+');

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        color === 'amber' ? 'bg-amber-50 text-amber-600' :
                            'bg-medical-50 text-medical-600'
                    }`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-sm font-bold text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
    );
}
