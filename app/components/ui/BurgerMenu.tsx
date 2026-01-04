"use client";

import { useCallback } from "react";
import { useDayContext, TOTAL_DAYS } from "../../context/DayContext";

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

interface ToggleSwitchProps {
    label: string;
    icon: string;
    enabled: boolean;
    onToggle: () => void;
}

function ToggleSwitch({ label, icon, enabled, onToggle }: ToggleSwitchProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                <span>{icon}</span> {label}
            </span>
            <button
                onClick={onToggle}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    enabled
                        ? "bg-green-600 dark:bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Toggle ${label}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                />
            </button>
        </div>
    );
}

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
    const {
        openDay,
        selectedProblems,
        navigateToDay,
        effectSettings,
        toggleEffect,
    } = useDayContext();

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
                className="absolute top-4 right-4 w-72 rounded-lg bg-green-50 dark:bg-slate-900 p-6 shadow-2xl border-2 border-green-700 dark:border-green-600"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                        <span>🎄</span> Jump to day
                    </span>
                    <button
                        onClick={onClose}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                        ✕ Close
                    </button>
                </header>

                {/* Effect Toggles */}
                <div className="mb-4 p-3 rounded-md border-2 border-green-300 bg-green-50 dark:bg-slate-800 dark:border-green-700 space-y-3">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                        <span>✨</span> Visual Effects
                    </p>
                    <ToggleSwitch
                        label="Fluid Effect"
                        icon="🌊"
                        enabled={effectSettings.fluidEffect}
                        onToggle={() => toggleEffect("fluidEffect")}
                    />
                    <ToggleSwitch
                        label="Star Cursor"
                        icon="⭐"
                        enabled={effectSettings.starCursor}
                        onToggle={() => toggleEffect("starCursor")}
                    />
                    <ToggleSwitch
                        label="Snowfall"
                        icon="❄️"
                        enabled={effectSettings.snowfall}
                        onToggle={() => toggleEffect("snowfall")}
                    />
                </div>

                {openDay && (
                    <div className="mb-4 p-3 rounded-md border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-600 text-sm">
                        <span className="text-green-700 dark:text-green-400">
                            ⭐ Currently viewing:
                        </span>
                        <p className="font-semibold text-green-900 dark:text-green-100">
                            Day {openDay} — Part {selectedProblems[openDay]}
                        </p>
                    </div>
                )}

                <div
                    className="space-y-2 max-h-[70vh] overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-green-100 dark:[&::-webkit-scrollbar-track]:bg-green-900
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-green-500 dark:[&::-webkit-scrollbar-thumb]:bg-green-600
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-green-600 dark:[&::-webkit-scrollbar-thumb]:hover:bg-green-500"
                >
                    {days.map((day) => {
                        const isActiveDay = openDay === day;
                        const activeProblem = selectedProblems[day];

                        return (
                            <div
                                key={day}
                                className={`rounded-md border-2 p-3 transition-colors ${
                                    isActiveDay
                                        ? "border-yellow-500 bg-green-100 dark:bg-green-900/40 dark:border-yellow-600"
                                        : "border-green-300 bg-white hover:border-green-500 hover:bg-green-50 dark:border-green-700 dark:bg-slate-800 dark:hover:border-green-500 dark:hover:bg-slate-700"
                                }`}
                            >
                                <p className="text-sm font-medium mb-2 text-green-900 dark:text-green-100">
                                    🎁 Day {day}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 1
                                                ? "bg-green-800 text-yellow-300 dark:bg-green-700 dark:text-yellow-300"
                                                : "bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
                                        }`}
                                        onClick={() => handleSelect(day, 1)}
                                    >
                                        ⭐ Part 1
                                    </button>
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 2
                                                ? "bg-green-800 text-yellow-300 dark:bg-green-700 dark:text-yellow-300"
                                                : "bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
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
