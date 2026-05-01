import { motion } from 'framer-motion';

export const ProgressBar = ({ percentage, label, sublabel }) => {
  const getColor = (pct) => {
    if (pct >= 100) return 'bg-red-600';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-2">
      {(label || sublabel) && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-gray-500">{sublabel}</span>
        </div>
      )}
      <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getColor(percentage)}`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
};

export const BudgetCard = ({ type, budget, used, percentage }) => {
  return (
    <div className="bg-white rounded-card border border-[#e5e7eb] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Q{Math.ceil((new Date().getMonth() + 1) / 3)} {type} Budget
        </h3>
        <span className="text-xs text-gray-500">{percentage}%</span>
      </div>
      <ProgressBar percentage={percentage} />
      <div className="flex justify-between mt-3 text-xs text-gray-500">
        <span>Rs.{Number(used).toLocaleString('en-IN')} used</span>
        <span>Rs.{Number(budget).toLocaleString('en-IN')} total</span>
      </div>
    </div>
  );
};
