"use client";

import { useCallback } from "react";
import { useDayContext, TOTAL_DAYS } from "../../context/DayContext";

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
    const { openDay, selectedProblems, navigateToDay } = useDayContext();

    const handleSelect = useCallback(
        (day: number, problem: 1 | 2) => {
            navigateToDay(day, problem);
            onClose();
        },
        [navigateToDay, onClose]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}>
            <div
                className="absolute top-4 right-4 w-72 rounded-lg bg-green-50 p-6 shadow-2xl border-2 border-green-700"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-900 flex items-center gap-2">
                        <span>🎄</span> Jump to day
                    </span>
                    <button
                        onClick={onClose}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                        ✕ Close
                    </button>
                </header>

                {openDay && (
                    <div className="mb-4 p-3 rounded-md border-2 border-yellow-500 bg-yellow-50 text-sm">
                        <span className="text-green-700">
                            ⭐ Currently viewing:
                        </span>
                        <p className="font-semibold text-green-900">
                            Day {openDay} — Part {selectedProblems[openDay]}
                        </p>
                    </div>
                )}

                <div
                    className="space-y-2 max-h-[70vh] overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-green-100
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-green-500
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-green-600"
                >
                    {days.map((day) => {
                        const isActiveDay = openDay === day;
                        const activeProblem = selectedProblems[day];

                        return (
                            <div
                                key={day}
                                className={`rounded-md border-2 p-3 transition-colors ${
                                    isActiveDay
                                        ? "border-yellow-500 bg-green-100"
                                        : "border-green-300 bg-white hover:border-green-500 hover:bg-green-50"
                                }`}
                            >
                                <p className="text-sm font-medium mb-2 text-green-900">
                                    🎁 Day {day}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 1
                                                ? "bg-green-800 text-yellow-300"
                                                : "bg-green-200 text-green-800 hover:bg-green-300"
                                        }`}
                                        onClick={() => handleSelect(day, 1)}
                                    >
                                        ⭐ Part 1
                                    </button>
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 2
                                                ? "bg-green-800 text-yellow-300"
                                                : "bg-green-200 text-green-800 hover:bg-green-300"
                                        }`}
                                        onClick={() => handleSelect(day, 2)}
                                    >
                                        ⭐ Part 2
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
