// hooks/useToast.js
import { create } from 'zustand';

export const useToastStore = create((set) => ({
  message: '',
  visible: false,
  type: 'default', // default | success | error | warning
  show: (message, type = 'default') => {
    set({ message, visible: true, type });
    setTimeout(() => set({ visible: false }), 2800);
  },
}));

export const useToast = () => {
  const show = useToastStore(s => s.show);
  return {
    showToast:   (msg) => show(msg, 'default'),
    showSuccess: (msg) => show(msg, 'success'),
    showError:   (msg) => show(msg, 'error'),
  };
};
