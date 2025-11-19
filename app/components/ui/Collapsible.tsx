"use client";

import { useState } from "react";

interface CollapsibleProps {
    title: string;
    children: React.ReactNode;
}

export default function Collapsible({ title, children }: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleCollapse = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="collapsible">
            <button onClick={toggleCollapse} className="collapsible-toggle">
                {title}
            </button>
            {isOpen && <div className="collapsible-content">{children}</div>}
        </div>
    );
}
