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
                className={`w-full p-4 text-left rounded-lg shadow-sm transition-all hover:cursor-pointer ${
                    isOpen
                        ? "border-2 border-yellow-500 bg-green-50 text-green-900 dark:bg-green-950 dark:border-yellow-600 dark:text-green-50"
                        : "collapsible-closed text-green-600 hover:text-green-700 dark:text-green-50 dark:hover:text-green-100"
                }`}
            >
                <span className="flex items-center gap-2">
                    <span className="text-yellow-500">⭐</span>
                    {title}
                </span>
            </button>
            {isOpen && (
                <div className="collapsible-content mt-2 pl-4 border-l-2 border-green-500 dark:border-green-700">
                    {children}
                </div>
            )}
        </div>
    );
}
