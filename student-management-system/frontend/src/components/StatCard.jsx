const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">
        {value ?? <span className="text-gray-300 animate-pulse">—</span>}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export default StatCard;
