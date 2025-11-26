"use client";

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

export default function Collapsible({
    title,
    children,
    isOpen,
    onToggle,
}: CollapsibleProps) {
    return (
        <div className="collapsible">
            <button
                onClick={onToggle}
                className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 hover:cursor-pointer transition-colors"
            >
                {title}
            </button>
            {isOpen && (
                <div className="collapsible-content mt-2">{children}</div>
            )}
        </div>
    );
}
