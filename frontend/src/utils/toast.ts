import toast from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'loading' | 'blank';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
};

export const toastService = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, { ...defaultOptions, ...options });
  },

  blank: (message: string, options?: ToastOptions) => {
    toast(message, { ...defaultOptions, ...options });
  },
};

export default toastService;
