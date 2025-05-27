import * as React from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type,
    onClose,
}) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100 border-green-500 text-green-800';
            case 'error':
                return 'bg-red-100 border-red-500 text-red-800';
            case 'info':
                return 'bg-blue-100 border-blue-500 text-blue-800';
            default:
                return 'bg-gray-100 border-gray-500 text-gray-800';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-md border-l-4 shadow-md max-w-md ${getTypeStyles()}`}
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-grow">
                    <p className="text-sm">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 text-gray-500 hover:text-gray-700"
                >
                    <span className="text-xl">&times;</span>
                </button>
            </div>
        </div>
    );
};

export const useToast = () => {
    const [toast, setToast] = React.useState<{
        message: string;
        type: 'success' | 'error' | 'info';
        visible: boolean;
    }>({
        message: '',
        type: 'info',
        visible: false,
    });

    const showToast = (
        message: string,
        type: 'success' | 'error' | 'info' = 'info'
    ) => {
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

    return {
        toast,
        showToast,
        hideToast,
    };
};

export const ToastProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { toast, hideToast } = useToast();

    return (
        <>
            {children}
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            )}
        </>
    );
};
