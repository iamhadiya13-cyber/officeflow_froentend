import { motion } from 'framer-motion';
import clsx from 'clsx';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-[#e5e7eb] text-gray-700 hover:bg-gray-50',
  danger: 'bg-danger text-white hover:bg-red-700',
  ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
};

export const Button = ({ variant = 'primary', className, children, loading, disabled, ...props }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={clsx(
        'rounded-btn px-5 py-2.5 text-sm font-medium transition-all inline-flex items-center justify-center gap-2 min-h-[44px] md:min-h-0',
        variants[variant],
        (loading || disabled) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
};
