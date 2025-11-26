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
            <button onClick={onToggle} className="collapsible-toggle">
                {title}
            </button>
            {isOpen && <div className="collapsible-content">{children}</div>}
        </div>
    );
}
