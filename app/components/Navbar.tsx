"use client";

import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <h1 className="text-xl">Advent of Code 2025 Solutions</h1>
            <div className="relative">
                <button onClick={toggleMenu} className="focus:outline-none">
                    ☰
                </button>
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg">
                        <ul>
                            <li className="px-4 py-2 hover:bg-gray-200">
                                Link 1
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-200">
                                Link 2
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-200">
                                Link 3
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
}
