import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

export const StatCard = ({ label, value, icon: Icon, color, prefix = '', suffix = '' }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => {
    const num = Math.round(v);
    return prefix + num.toLocaleString('en-IN') + suffix;
  });

  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
    const controls = animate(count, numValue, { duration: 0.7, ease: 'easeOut' });
    return controls.stop;
  }, [value]);

  return (
    <div className="bg-white rounded-card border border-[#e5e7eb] p-4 sm:p-5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-btn flex items-center justify-center ${color || 'bg-primary/10 text-primary'}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <motion.span className="text-2xl sm:text-3xl font-semibold text-gray-950 tracking-[-0.02em]">
        {rounded}
      </motion.span>
    </div>
  );
};
