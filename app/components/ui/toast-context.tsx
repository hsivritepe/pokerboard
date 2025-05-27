'use client';

import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
} from 'react';
import { Toast } from './toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextProps {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(
    undefined
);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
        visible: boolean;
    }>({
        message: '',
        type: 'info',
        visible: false,
    });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({
            message,
            type,
            visible: true,
        });
    };

    const hideToast = () => {
        setToast((prev) => ({
            ...prev,
            visible: false,
        }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextProps => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error(
            'useToast must be used within a ToastProvider'
        );
    }
    return context;
};
