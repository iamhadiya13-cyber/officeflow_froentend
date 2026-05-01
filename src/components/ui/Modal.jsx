import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'md:max-w-lg' }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  const mobileVariants = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' }
  };

  const desktopVariants = {
    initial: { opacity: 0, scale: 0.94, y: 0 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.94, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:items-center md:justify-center p-0 md:p-4">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`fixed bottom-0 left-0 right-0 rounded-t-[16px] bg-white w-full max-h-[90vh] overflow-y-auto z-10 ${maxWidth} md:relative md:rounded-card md:mx-auto md:my-auto`}
            initial={isMobile ? mobileVariants.initial : desktopVariants.initial}
            animate={isMobile ? mobileVariants.animate : desktopVariants.animate}
            exit={isMobile ? mobileVariants.exit : desktopVariants.exit}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {isMobile && <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-4 mb-2" />}
            <div className={`flex items-center justify-between px-5 ${isMobile ? 'pb-3' : 'py-5'} border-b border-[#e5e7eb]`}>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {onClose && (
                <button onClick={onClose} className="p-2 rounded-btn hover:bg-gray-100 text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md:max-w-sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 md:gap-3">
        <button
          onClick={onClose}
          className="w-full md:w-auto border border-[#e5e7eb] text-gray-700 rounded-btn px-5 py-2.5 text-sm font-medium hover:bg-gray-50 min-h-[44px]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`w-full md:w-auto rounded-btn px-5 py-2.5 text-sm font-medium text-white min-h-[44px] ${
            variant === 'danger' ? 'bg-danger hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
