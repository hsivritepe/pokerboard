'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface AccordionSection {
    id: string;
    title: string;
    content: React.ReactNode;
    defaultExpanded?: boolean;
}

interface SessionAccordionProps {
    sections: AccordionSection[];
    isCompleted: boolean;
}

export default function SessionAccordion({
    sections,
    isCompleted,
}: SessionAccordionProps) {
    const t = useTranslations();

    // Set default expanded state based on session completion
    const getDefaultExpanded = (sectionId: string) => {
        if (isCompleted) {
            // When completed, only show "Kaydedilen Hesaplama Sonuçları" (saved results)
            return sectionId === 'saved-results';
        }
        // When ongoing, expand all sections by default
        return true;
    };

    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >(
        sections.reduce((acc, section) => {
            acc[section.id] = getDefaultExpanded(section.id);
            return acc;
        }, {} as Record<string, boolean>)
    );

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    return (
        <div className="space-y-2">
            {sections.map((section) => (
                <div
                    key={section.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                >
                    <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-lg font-semibold text-gray-900">
                            {section.title}
                        </h3>
                        <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${
                                expandedSections[section.id]
                                    ? 'rotate-180'
                                    : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>

                    {expandedSections[section.id] && (
                        <div className="px-2 pb-2 border-t border-gray-100">
                            {section.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
