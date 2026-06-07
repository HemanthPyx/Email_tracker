/**
 * Stats widget card component.
 */

const colorMap = {
  blue: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', border: 'border-brand-blue/20' },
  green: { bg: 'bg-brand-green/10', text: 'text-brand-green', border: 'border-brand-green/20' },
  yellow: { bg: 'bg-brand-yellow/10', text: 'text-yellow-500', border: 'border-brand-yellow/20' },
  red: { bg: 'bg-brand-red/10', text: 'text-brand-red', border: 'border-brand-red/20' },
};

export default function StatsWidget({ icon: Icon, label, value, color = 'blue', subtitle = '' }) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className={`card border ${colors.border} animate-slide-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className={`stat-value mt-1 ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
