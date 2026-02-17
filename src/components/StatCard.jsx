export default function StatCard({ title, value, icon: Icon, trend, color = "medical" }) {
    const isPositive = trend?.startsWith('+');

    const colorClasses = {
        medical: 'bg-sky-500 text-white',
        emerald: 'bg-emerald-500 text-white',
        amber: 'bg-amber-500 text-white',
        indigo: 'bg-indigo-500 text-white',
    };

    const trendColorClasses = isPositive
        ? 'text-emerald-600 bg-emerald-50'
        : 'text-red-600 bg-red-50';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon size={24} strokeWidth={2} />
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${trendColorClasses}`}>
                        {trend}
                    </span>
                )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide mb-1 truncate">{title}</p>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 truncate">{value}</h3>
        </div>
    );
}
