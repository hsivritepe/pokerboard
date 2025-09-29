import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Helper function to format numbers with thousands separators (Turkish format)
export function formatNumber(num: number): string {
    // If the number is a whole number, don't show decimal places
    if (num % 1 === 0) {
        return num.toLocaleString('tr-TR', {
            maximumFractionDigits: 0,
        });
    }
    return num.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}
