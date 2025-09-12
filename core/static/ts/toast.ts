export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
    autoDismiss?: boolean;
    duration?: number;
}

export function createToastContainer(id:string) {
    return {
        id,
        toasts: [] as ToastData[],
        addToast(toast: Partial<ToastData>) {
            const newToast: ToastData = {
                id: 'toast' + Date.now(),
                message: toast.message || '',
                type: toast.type || 'info',
                autoDismiss: true,
                duration: 5000,
            };

            this.toasts = [...this.toasts, newToast];
        },
        removeToast(id: string) {
            this.toasts = this.toasts.filter(toast => toast.id !== id);
        }
    }
}



// Global toast utility functions
export class ToastManager {
    static show(message: string, type: ToastType = 'info', options?: Partial<ToastData>) {
        const event = new CustomEvent('show-toast', {
            detail: {
                message,
                type,
                ...options
            }
        });
        document.dispatchEvent(event);
    }

    static success(message: string, options?: Partial<ToastData>) {
        this.show(message, 'success', options);
    }

    static error(message: string, options?: Partial<ToastData>) {
        this.show(message, 'error', options);
    }

    static warning(message: string, options?: Partial<ToastData>) {
        this.show(message, 'warning', options);
    }

    static info(message: string, options?: Partial<ToastData>) {
        this.show(message, 'info', options);
    }
}

function showToast(message: string, type: ToastType = 'info', options?: Partial<ToastData>) {
    ToastManager.show(message, type, options);
}

window['showToast'] = showToast;