"use client";

import { useState } from "react";
import BurgerMenu from "./ui/BurgerMenu";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="flex items-center justify-between border-b border-gray-200 bg-white p-4 text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50">
            <h1 className="text-lg font-semibold">Advent of Code 2025</h1>

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="rounded p-2 text-2xl leading-none hover:bg-gray-100 dark:hover:bg-gray-900"
                aria-label="Open navigation menu"
            >
                ☰
            </button>

            <BurgerMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </nav>
    );
}
