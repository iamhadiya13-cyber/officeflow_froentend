import { motion } from 'framer-motion';

export const SettleToggle = ({ isSettled, onToggle, disabled }) => {
  return (
    <motion.button
      type="button"
      onClick={!disabled ? onToggle : undefined}
      className={`relative w-11 h-6 rounded-full transition-colors flex items-center shrink-0 ${
        isSettled ? 'bg-green-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{ x: isSettled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};
