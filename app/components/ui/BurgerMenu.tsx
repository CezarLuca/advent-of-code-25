"use client";

import { useCallback } from "react";

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (day: number, problem: 1 | 2) => void;
}

const days = Array.from({ length: 12 }, (_, i) => i + 1);

export default function BurgerMenu({
    isOpen,
    onClose,
    onNavigate,
}: BurgerMenuProps) {
    const handleSelect = useCallback(
        (day: number, problem: 1 | 2) => {
            onNavigate(day, problem);
            onClose();
        },
        [onNavigate, onClose]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
            <div
                className="absolute top-4 right-4 w-72 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">Jump to day</span>
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-800"
                    >
                        Close
                    </button>
                </header>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {days.map((day) => (
                        <div
                            key={day}
                            className="rounded border border-gray-200 p-3 dark:border-gray-700"
                        >
                            <p className="text-sm font-medium mb-2">
                                Day {day}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-500"
                                    onClick={() => handleSelect(day, 1)}
                                >
                                    Part 1
                                </button>
                                <button
                                    className="flex-1 rounded border border-blue-600 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                    onClick={() => handleSelect(day, 2)}
                                >
                                    Part 2
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
