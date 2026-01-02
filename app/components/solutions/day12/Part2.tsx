"use client";

export default function Part2() {
    const asciiArt = `

    ╔═══════════════════════════╗
    ║    🎅 Ho Ho Ho! 🎅        ║
    ╚═══════════════════════════╝

    ❄️ ⭐ Merry Christmas! ⭐ ❄️
    `;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="bg-green-50 border-2 border-green-200 p-6 rounded-lg">
                <pre className="font-mono text-green-800 text-center whitespace-pre">
                    {asciiArt}
                </pre>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg text-center">
                <h3 className="font-bold text-yellow-800">⭐ Solution:</h3>
                <p className="font-mono text-lg text-yellow-900">
                    🎄 Christmas Spirit Achieved! 🎄
                </p>
            </div>
        </div>
    );
}
