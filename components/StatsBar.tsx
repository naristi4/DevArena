interface Stat {
  label: string;
  value: string | number;
  sub:   string;
}

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm"
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {stat.label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-800">
            {stat.value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
