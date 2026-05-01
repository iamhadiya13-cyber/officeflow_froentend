import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Input = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <motion.div
      className="space-y-1.5"
      animate={{ x: error ? [0, -8, 8, -6, 6, -3, 3, 0] : 0 }}
      transition={{ duration: 0.4 }}
    >
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none min-h-[44px]',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'transition-all',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </motion.div>
  );
});

Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, children, className, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={clsx(
          'border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none appearance-none min-h-[44px]',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'bg-white bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%236b7280%27 d=%27M2 4l4 4 4-4%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]',
          error && 'border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={clsx(
          'border border-[#d1d5db] rounded-btn px-3.5 py-2.5 text-sm w-full outline-none resize-none min-h-[100px]',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
