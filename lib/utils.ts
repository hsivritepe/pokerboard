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

// Helper function to generate email from name (name@surname.com format)
export function generateEmailFromName(name: string): string {
    if (!name.trim()) return '';

    // Split the name into parts and clean them
    const nameParts = name
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0);

    if (nameParts.length === 0) return '';

    // Get first name (first part)
    const firstName = nameParts[0].toLowerCase();

    // Get last name (last part, or first name if only one part)
    const lastName =
        nameParts.length > 1
            ? nameParts[nameParts.length - 1].toLowerCase()
            : firstName;

    // Remove special characters and Turkish characters
    const cleanFirstName = firstName
        .replace(/[çğıöşü]/g, (match) => {
            const replacements: { [key: string]: string } = {
                ç: 'c',
                ğ: 'g',
                ı: 'i',
                ö: 'o',
                ş: 's',
                ü: 'u',
            };
            return replacements[match] || match;
        })
        .replace(/[^a-z]/g, '');

    const cleanLastName = lastName
        .replace(/[çğıöşü]/g, (match) => {
            const replacements: { [key: string]: string } = {
                ç: 'c',
                ğ: 'g',
                ı: 'i',
                ö: 'o',
                ş: 's',
                ü: 'u',
            };
            return replacements[match] || match;
        })
        .replace(/[^a-z]/g, '');

    return `${cleanFirstName}@${cleanLastName}.com`;
}
