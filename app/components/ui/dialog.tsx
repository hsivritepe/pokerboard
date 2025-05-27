import * as React from 'react';

interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
    open,
    onOpenChange,
    children,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/50"
                onClick={() => onOpenChange?.(false)}
            />
            <div className="relative z-50 w-full max-w-md mx-auto">
                {children}
            </div>
        </div>
    );
};

interface DialogContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const DialogContent: React.FC<DialogContentProps> = ({
    children,
    className,
    ...props
}) => {
    return (
        <div
            className={`relative w-full max-w-md mx-auto rounded-lg bg-white p-6 shadow-lg ${
                className || ''
            }`}
            {...props}
        >
            {children}
        </div>
    );
};

interface DialogHeaderProps
    extends React.HTMLAttributes<HTMLDivElement> {}

const DialogHeader: React.FC<DialogHeaderProps> = ({
    className,
    ...props
}) => (
    <div
        className={`flex flex-col space-y-2 mb-4 ${className || ''}`}
        {...props}
    />
);

interface DialogFooterProps
    extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter: React.FC<DialogFooterProps> = ({
    className,
    ...props
}) => (
    <div
        className={`flex flex-row justify-end space-x-2 mt-6 ${
            className || ''
        }`}
        {...props}
    />
);

interface DialogTitleProps
    extends React.HTMLAttributes<HTMLHeadingElement> {}

const DialogTitle: React.FC<DialogTitleProps> = ({
    className,
    ...props
}) => (
    <h2
        className={`text-xl font-semibold ${className || ''}`}
        {...props}
    />
);

interface DialogDescriptionProps
    extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription: React.FC<DialogDescriptionProps> = ({
    className,
    ...props
}) => (
    <p
        className={`text-sm text-gray-600 whitespace-normal break-words ${
            className || ''
        }`}
        {...props}
    />
);

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
