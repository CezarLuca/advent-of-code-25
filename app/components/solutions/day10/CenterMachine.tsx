"use client";

import { forwardRef } from "react";

interface CenterMachineProps {
    targetPattern: number[];
    currentState: number[];
    buttons: number[][];
    solutionSequence: number[];
    isPlaying: boolean;
    isPaused: boolean;
    isComplete: boolean;
    currentStep: number;
    setToggleRef: (index: number, el: HTMLDivElement | null) => void;
    setButtonRef: (index: number, el: HTMLButtonElement | null) => void;
    onTogglePlayPause: () => void;
    // variant: "desktop" | "mobile";
}

const CenterMachine = forwardRef<HTMLDivElement, CenterMachineProps>(
    (
        {
            targetPattern,
            currentState,
            buttons,
            solutionSequence,
            isPlaying,
            isPaused,
            isComplete,
            currentStep,
            setToggleRef,
            setButtonRef,
            onTogglePlayPause,
            // variant,
        },
        ref
    ) => {
        // const isMobile = variant === "mobile";

        // const lightsRow1 = targetPattern.slice(0, 5);
        // const lightsRow2 = targetPattern.slice(5);

        // if (isMobile) {
        //     return (
        //         <div
        //             ref={ref}
        //             className="shrink-0 bg-linear-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 shadow-2xl overflow-hidden mx-1"
        //         >
        //             {/* Header */}
        //             <div className="bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 px-2 py-1.5 border-b-2 border-gray-800 flex items-center justify-between">
        //                 <div className="flex items-center gap-1.5">
        //                     <div
        //                         className={`w-2.5 h-2.5 rounded-full ${
        //                             isPlaying && !isPaused
        //                                 ? "bg-green-400 animate-pulse"
        //                                 : isPaused
        //                                 ? "bg-yellow-400"
        //                                 : "bg-gray-500"
        //                         }`}
        //                     />
        //                     <div
        //                         className={`w-2.5 h-2.5 rounded-full ${
        //                             isComplete ? "bg-green-400" : "bg-red-400"
        //                         }`}
        //                     />
        //                 </div>
        //                 <span className="font-mono text-gray-300 text-[10px] tracking-wider">
        //                     TOGGLE-MATIC 3000
        //                 </span>
        //                 <div className="text-[10px] text-gray-400 font-mono">
        //                     {solutionSequence.length} STEPS
        //                 </div>
        //             </div>

        //             {/* Light Array - Two rows on mobile */}
        //             <div className="bg-gray-950 px-2 py-3 border-b border-gray-700">
        //                 <div className="text-center text-[10px] text-gray-500 font-mono mb-2 tracking-wider">
        //                     ◆ LIGHT ARRAY ◆
        //                 </div>

        //                 {/* Row 1 of lights (0-4) */}
        //                 <div className="flex justify-center gap-1.5 mb-1">
        //                     {lightsRow1.map((target, idx) => (
        //                         <div
        //                             key={`target-${idx}`}
        //                             className="w-7 text-center text-[10px] text-gray-500"
        //                         >
        //                             {target ? "▼" : ""}
        //                         </div>
        //                     ))}
        //                 </div>
        //                 <div className="flex justify-center gap-1.5 mb-2">
        //                     {lightsRow1.map((_, idx) => (
        //                         <div
        //                             key={idx}
        //                             ref={(el) => setToggleRef(idx, el)}
        //                             className={`w-7 h-7 rounded-md border-2 flex items-center justify-center text-[10px] font-bold ${
        //                                 currentState[idx]
        //                                     ? "bg-green-400 border-green-300 text-green-900"
        //                                     : "bg-gray-800 border-gray-600 text-gray-600"
        //                             }`}
        //                             style={{
        //                                 boxShadow: currentState[idx]
        //                                     ? "0 0 10px 2px rgba(74, 222, 128, 0.4)"
        //                                     : "inset 0 1px 2px rgba(0,0,0,0.5)",
        //                             }}
        //                         >
        //                             {idx}
        //                         </div>
        //                     ))}
        //                 </div>

        //                 {/* Row 2 of lights (5-9) */}
        //                 {lightsRow2.length > 0 && (
        //                     <>
        //                         <div className="flex justify-center gap-1.5 mb-1">
        //                             {lightsRow2.map((target, idx) => (
        //                                 <div
        //                                     key={`target-${idx + 5}`}
        //                                     className="w-7 text-center text-[10px] text-gray-500"
        //                                 >
        //                                     {target ? "▼" : ""}
        //                                 </div>
        //                             ))}
        //                         </div>
        //                         <div className="flex justify-center gap-1.5">
        //                             {lightsRow2.map((_, idx) => (
        //                                 <div
        //                                     key={idx + 5}
        //                                     ref={(el) =>
        //                                         setToggleRef(idx + 5, el)
        //                                     }
        //                                     className={`w-7 h-7 rounded-md border-2 flex items-center justify-center text-[10px] font-bold ${
        //                                         currentState[idx + 5]
        //                                             ? "bg-green-400 border-green-300 text-green-900"
        //                                             : "bg-gray-800 border-gray-600 text-gray-600"
        //                                     }`}
        //                                     style={{
        //                                         boxShadow: currentState[idx + 5]
        //                                             ? "0 0 10px 2px rgba(74, 222, 128, 0.4)"
        //                                             : "inset 0 1px 2px rgba(0,0,0,0.5)",
        //                                     }}
        //                                 >
        //                                     {idx + 5}
        //                                 </div>
        //                             ))}
        //                         </div>
        //                     </>
        //                 )}

        //                 {/* Status */}
        //                 <div className="mt-2 flex justify-center gap-3 text-[10px] font-mono">
        //                     <span className="text-yellow-400">
        //                         {targetPattern
        //                             .map((t) => (t ? "●" : "○"))
        //                             .join("")}
        //                     </span>
        //                     <span className="text-green-400">
        //                         {currentState
        //                             .map((t) => (t ? "●" : "○"))
        //                             .join("")}
        //                     </span>
        //                     {isComplete && !isPlaying && (
        //                         <span className="text-green-400 animate-pulse">
        //                             ✓
        //                         </span>
        //                     )}
        //                 </div>
        //             </div>

        //             {/* Control Switches - All buttons with original indices */}
        //             <div className="bg-linear-to-b from-gray-800 to-gray-850 px-2 py-2">
        //                 <div className="text-center text-[10px] text-gray-500 font-mono mb-1.5 tracking-wider">
        //                     ◆ SWITCHES ◆
        //                 </div>

        //                 <div className="flex flex-wrap justify-center gap-1">
        //                     {buttons.map((toggleIndices, btnIdx) => (
        //                         <button
        //                             key={btnIdx}
        //                             ref={(el) => setButtonRef(btnIdx, el)}
        //                             className="px-1.5 py-1 rounded font-mono text-[10px] border-b-2 bg-red-800 border-red-950 text-red-200"
        //                             disabled={isPlaying}
        //                         >
        //                             {toggleIndices.join(",")}
        //                         </button>
        //                     ))}
        //                 </div>

        //                 {isPlaying && currentStep >= 0 && (
        //                     <div className="text-center mt-1.5 text-yellow-400 text-[10px] font-mono animate-pulse">
        //                         STEP {currentStep + 1}/{solutionSequence.length}
        //                         {isPaused && " (PAUSED)"}
        //                     </div>
        //                 )}
        //             </div>

        //             {/* Play Button */}
        //             <div className="bg-gray-900 px-2 py-3 border-t border-gray-700 flex justify-center">
        //                 <button
        //                     onClick={onTogglePlayPause}
        //                     className={`w-12 h-12 rounded-full font-mono text-lg font-bold shadow-lg border-4 flex items-center justify-center ${
        //                         isPlaying && !isPaused
        //                             ? "bg-linear-to-b from-yellow-500 to-yellow-700 border-yellow-800 text-yellow-900"
        //                             : isPaused
        //                             ? "bg-linear-to-b from-blue-500 to-blue-700 border-blue-800 text-white"
        //                             : "bg-linear-to-b from-green-500 to-green-700 border-green-800 text-white"
        //                     }`}
        //                     style={{
        //                         boxShadow:
        //                             isPlaying && !isPaused
        //                                 ? "0 0 15px 3px rgba(234, 179, 8, 0.5)"
        //                                 : isPaused
        //                                 ? "0 0 15px 3px rgba(59, 130, 246, 0.5)"
        //                                 : "0 3px 10px rgba(0,0,0,0.3)",
        //                     }}
        //                 >
        //                     {isPlaying && !isPaused ? "⏸" : "▶"}
        //                 </button>
        //             </div>
        //         </div>
        //     );
        // }

        // Desktop variant
        return (
            <div
                ref={ref}
                className="flex-1 bg-linear-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 px-4 py-2 border-b-2 border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className={`w-3 h-3 rounded-full ${
                                isPlaying && !isPaused
                                    ? "bg-green-400 animate-pulse"
                                    : isPaused
                                    ? "bg-yellow-400"
                                    : "bg-gray-500"
                            }`}
                        />
                        <div
                            className={`w-3 h-3 rounded-full ${
                                isComplete ? "bg-green-400" : "bg-red-400"
                            }`}
                        />
                    </div>
                    <span className="font-mono text-gray-300 text-sm tracking-widest">
                        TOGGLE-MATIC 3000
                    </span>
                    <div className="text-xs text-gray-400 font-mono">
                        {solutionSequence.length} STEPS
                    </div>
                </div>

                <div className="bg-gray-950 px-4 py-6 border-b border-gray-700 flex-1 flex flex-col justify-center">
                    <div className="text-center text-xs text-gray-500 font-mono mb-3 tracking-wider">
                        ◆ LIGHT ARRAY ◆
                    </div>

                    <div className="flex justify-center gap-2 mb-1">
                        {targetPattern.map((target, idx) => (
                            <div
                                key={`target-${idx}`}
                                className="w-10 text-center text-xs text-gray-500"
                            >
                                {target ? "▼" : ""}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-2">
                        {targetPattern.map((_, idx) => (
                            <div
                                key={idx}
                                ref={(el) => setToggleRef(idx, el)}
                                className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${
                                    currentState[idx]
                                        ? "bg-green-400 border-green-300 text-green-900"
                                        : "bg-gray-800 border-gray-600 text-gray-600"
                                }`}
                                style={{
                                    boxShadow: currentState[idx]
                                        ? "0 0 15px 4px rgba(74, 222, 128, 0.4), inset 0 0 10px rgba(255,255,255,0.3)"
                                        : "inset 0 2px 4px rgba(0,0,0,0.5)",
                                }}
                            >
                                {idx}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-center gap-4 text-xs font-mono">
                        <div className="text-gray-500">
                            TARGET:{" "}
                            <span className="text-yellow-400">
                                {targetPattern
                                    .map((t) => (t ? "●" : "○"))
                                    .join("")}
                            </span>
                        </div>
                        <div className="text-gray-500">
                            CURRENT:{" "}
                            <span className="text-green-400">
                                {currentState
                                    .map((t) => (t ? "●" : "○"))
                                    .join("")}
                            </span>
                        </div>
                        {isComplete && !isPlaying && (
                            <span className="text-green-400 animate-pulse">
                                ✓
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-linear-to-b from-gray-800 to-gray-850 px-4 py-4">
                    <div className="text-center text-xs text-gray-500 font-mono mb-2 tracking-wider">
                        ◆ CONTROL SWITCHES ◆
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {buttons.map((toggleIndices, btnIdx) => (
                            <button
                                key={btnIdx}
                                ref={(el) => setButtonRef(btnIdx, el)}
                                className="px-3 py-2 rounded font-mono text-xs border-b-2 bg-red-800 border-red-950 text-red-200"
                                disabled={isPlaying}
                            >
                                {toggleIndices.join(",")}
                            </button>
                        ))}
                    </div>

                    {isPlaying && currentStep >= 0 && (
                        <div className="text-center mt-3 text-yellow-400 text-xs font-mono animate-pulse">
                            STEP {currentStep + 1}/{solutionSequence.length}
                            {isPaused && " (PAUSED)"}
                        </div>
                    )}
                </div>

                <div className="bg-gray-900 px-4 py-4 border-t border-gray-700 flex justify-center">
                    <button
                        onClick={onTogglePlayPause}
                        className={`w-16 h-16 rounded-full font-mono text-xl font-bold shadow-lg border-4 flex items-center justify-center ${
                            isPlaying && !isPaused
                                ? "bg-linear-to-b from-yellow-500 to-yellow-700 border-yellow-800 text-yellow-900"
                                : isPaused
                                ? "bg-linear-to-b from-blue-500 to-blue-700 border-blue-800 text-white"
                                : "bg-linear-to-b from-green-500 to-green-700 border-green-800 text-white"
                        }`}
                        style={{
                            boxShadow:
                                isPlaying && !isPaused
                                    ? "0 0 20px 5px rgba(234, 179, 8, 0.5)"
                                    : isPaused
                                    ? "0 0 20px 5px rgba(59, 130, 246, 0.5)"
                                    : "0 4px 15px rgba(0,0,0,0.3)",
                        }}
                    >
                        {isPlaying && !isPaused ? "⏸" : "▶"}
                    </button>
                </div>
            </div>
        );
    }
);

CenterMachine.displayName = "CenterMachine";

export default CenterMachine;
