import * as React from 'react';

interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'default',
            size = 'default',
            ...props
        },
        ref
    ) => {
        const getVariantClasses = () => {
            switch (variant) {
                case 'destructive':
                    return 'bg-red-500 text-white hover:bg-red-600';
                case 'outline':
                    return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50';
                case 'secondary':
                    return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
                case 'ghost':
                    return 'text-gray-700 hover:bg-gray-100';
                case 'link':
                    return 'text-blue-500 underline hover:text-blue-600';
                default:
                    return 'bg-blue-500 text-white hover:bg-blue-600';
            }
        };

        const getSizeClasses = () => {
            switch (size) {
                case 'sm':
                    return 'h-9 px-3 text-sm';
                case 'lg':
                    return 'h-11 px-8 text-base';
                case 'icon':
                    return 'h-10 w-10';
                default:
                    return 'h-10 px-4 py-2 text-sm';
            }
        };

        const baseClasses =
            'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
        const classes = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${
            className || ''
        }`;

        return <button className={classes} ref={ref} {...props} />;
    }
);

Button.displayName = 'Button';

export { Button };
