import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../hooks/useToast';

export default function Toast() {
  const { message, visible, type } = useToastStore();

  const bg = {
    default: 'bg-gray-900',
    success: 'bg-sage-600',
    error:   'bg-red-600',
    warning: 'bg-amber-500',
  }[type] || 'bg-gray-900';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] ${bg} text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl whitespace-nowrap`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
