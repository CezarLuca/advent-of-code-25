"use client";

import { useState } from "react";
import BurgerMenu from "./ui/BurgerMenu";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="flex items-center justify-between border-b border-green-800 bg-linear-to-r from-green-900 to-green-800 p-4 text-white dark:from-green-950 dark:to-slate-900">
            <h1 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-yellow-400">❄️</span>
                Solving AoC 2025
                <span className="text-red-400">🎄</span>
            </h1>

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="rounded p-2 text-2xl leading-none hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                aria-label="Open navigation menu"
            >
                ☰
            </button>

            <BurgerMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </nav>
    );
}
