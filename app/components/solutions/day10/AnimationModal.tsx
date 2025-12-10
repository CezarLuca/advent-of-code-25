"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { PuzzleRowData } from "./solve1";

interface AnimationModalProps {
    isOpen: boolean;
    onClose: () => void;
    allRows: PuzzleRowData[];
    initialRowIndex?: number;
}

export default function AnimationModal({
    isOpen,
    onClose,
    allRows,
    initialRowIndex = 0,
}: AnimationModalProps) {
    const [currentRowIndex, setCurrentRowIndex] = useState(initialRowIndex);
    const [currentState, setCurrentState] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [autoPlay, setAutoPlay] = useState(true);

    const toggleRefs = useRef<(HTMLDivElement | null)[]>([]);
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const machineRef = useRef<HTMLDivElement | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const playAnimationRef = useRef<() => void>(() => {});
    const prevRowIndexRef = useRef(currentRowIndex);

    const currentRow = allRows[currentRowIndex];
    const { targetPattern, buttons, solutionSequence } = useMemo(
        () =>
            currentRow || {
                targetPattern: [],
                buttons: [],
                solutionSequence: [],
            },
        [currentRow]
    );

    useEffect(() => {
        if (!currentRow) return;
        if (prevRowIndexRef.current === currentRowIndex) return;
        prevRowIndexRef.current = currentRowIndex;
        if (currentState.length !== currentRow.targetPattern.length) {
            const timeoutId = setTimeout(() => {
                setCurrentState(
                    new Array(currentRow.targetPattern.length).fill(0)
                );
                setCurrentStep(-1);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [currentRowIndex, currentRow, currentState.length]);

    useEffect(() => {
        if (currentRow && currentState.length === 0) {
            const timeoutId = setTimeout(() => {
                setCurrentState(
                    new Array(currentRow.targetPattern.length).fill(0)
                );
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const advanceToNextRow = useCallback(() => {
        if (currentRowIndex < allRows.length - 1) {
            const tl = gsap.timeline();
            tl.to(machineRef.current, {
                x: -80,
                opacity: 0,
                duration: 0.15,
                ease: "power2.in",
            });
            tl.call(() => {
                setCurrentRowIndex((prev) => prev + 1);
                setCurrentState(
                    new Array(
                        allRows[currentRowIndex + 1]?.targetPattern.length || 0
                    ).fill(0)
                );
                setCurrentStep(-1);
            });
            tl.fromTo(
                machineRef.current,
                { x: 80, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.15, ease: "power2.out" }
            );
            tl.call(() => {
                setTimeout(() => {
                    playAnimationRef.current();
                }, 50);
            });
        }
    }, [currentRowIndex, allRows]);

    const playAnimation = useCallback(() => {
        if (timelineRef.current) {
            timelineRef.current.kill();
        }

        const state = new Array(targetPattern.length).fill(0);
        setCurrentState([...state]);
        setCurrentStep(-1);
        setIsPlaying(true);

        const tl = gsap.timeline({
            onComplete: () => {
                setIsPlaying(false);
                if (autoPlay && currentRowIndex < allRows.length - 1) {
                    setTimeout(() => {
                        advanceToNextRow();
                    }, 600);
                }
            },
        });
        timelineRef.current = tl;

        // Initial machine "power on" effect
        tl.fromTo(
            machineRef.current,
            { boxShadow: "0 0 0px 0px rgba(34, 197, 94, 0)" },
            {
                boxShadow: "0 0 30px 5px rgba(34, 197, 94, 0.3)",
                duration: 0.2,
            }
        );

        solutionSequence.forEach((btnIdx, seqIndex) => {
            const affectedToggles = buttons[btnIdx] || [];

            tl.call(() => {
                setCurrentStep(seqIndex);
            });

            // Highlight button
            tl.to(buttonRefs.current[btnIdx], {
                boxShadow: "0 0 15px 3px rgba(34, 197, 94, 0.8)",
                duration: 0.1,
            });

            // Press button
            tl.to(buttonRefs.current[btnIdx], {
                scale: 0.9,
                backgroundColor: "#22c55e",
                y: 4,
                duration: 0.06,
                ease: "power2.in",
            });

            // Toggle lights
            tl.call(() => {
                affectedToggles.forEach((toggleIdx) => {
                    if (toggleIdx >= 0 && toggleIdx < state.length) {
                        state[toggleIdx] ^= 1;
                    }
                });
                setCurrentState([...state]);
            });

            // Animate affected toggles
            const validToggles = affectedToggles
                .filter((i) => i >= 0 && i < targetPattern.length)
                .map((i) => toggleRefs.current[i])
                .filter(Boolean);

            if (validToggles.length > 0) {
                tl.to(validToggles, {
                    scale: 1.2,
                    duration: 0.08,
                    ease: "back.out(2)",
                });
                tl.to(validToggles, {
                    scale: 1,
                    duration: 0.08,
                });
            }

            // Release button
            tl.to(buttonRefs.current[btnIdx], {
                scale: 1,
                backgroundColor: "#991b1b",
                y: 0,
                boxShadow: "none",
                duration: 0.08,
                ease: "power2.out",
            });

            tl.to({}, { duration: 0.15 });
        });

        // Success flash
        tl.to(machineRef.current, {
            boxShadow: "0 0 50px 10px rgba(34, 197, 94, 0.6)",
            duration: 0.15,
        });
        tl.to(machineRef.current, {
            boxShadow: "0 0 20px 5px rgba(34, 197, 94, 0.2)",
            duration: 0.2,
        });

        tl.call(() => {
            setCurrentStep(-1);
        });
    }, [
        buttons,
        solutionSequence,
        targetPattern.length,
        autoPlay,
        currentRowIndex,
        allRows.length,
        advanceToNextRow,
    ]);

    useEffect(() => {
        playAnimationRef.current = playAnimation;
    }, [playAnimation]);

    const resetState = useCallback(() => {
        timelineRef.current?.kill();
        setCurrentState(new Array(targetPattern.length).fill(0));
        setCurrentStep(-1);
        setIsPlaying(false);
    }, [targetPattern.length]);

    const goToRow = useCallback(
        (index: number) => {
            timelineRef.current?.kill();
            setIsPlaying(false);
            setCurrentRowIndex(index);
            setCurrentState(
                new Array(allRows[index]?.targetPattern.length || 0).fill(0)
            );
            setCurrentStep(-1);
        },
        [allRows]
    );

    if (!isOpen || !currentRow) return null;

    const isComplete = currentState.every(
        (val, idx) => val === targetPattern[idx]
    );

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2">
            <div className="w-full max-w-5xl h-full max-h-[95vh] flex flex-col">
                {/* Top controls bar */}
                <div className="flex justify-between items-center mb-3 px-2">
                    {/* Left: Reset */}
                    <button
                        onClick={resetState}
                        disabled={isPlaying}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-mono text-sm hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                        ↺ RESET
                    </button>

                    {/* Center: Navigation dots */}
                    <div className="flex justify-center gap-2">
                        {allRows.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goToRow(idx)}
                                disabled={isPlaying}
                                className={`w-3 h-3 rounded-full transition-all ${
                                    idx === currentRowIndex
                                        ? "bg-yellow-400 scale-125"
                                        : idx < currentRowIndex
                                        ? "bg-green-500"
                                        : "bg-gray-600 hover:bg-gray-500"
                                }`}
                                title={`Machine ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Right: Auto-advance & Close */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-gray-400 text-xs font-mono cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoPlay}
                                onChange={(e) => setAutoPlay(e.target.checked)}
                                className="rounded"
                                disabled={isPlaying}
                            />
                            AUTO-ADVANCE
                        </label>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-xl px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* The Machine */}
                <div
                    ref={machineRef}
                    className="flex-1 bg-linear-to-b from-gray-800 to-gray-900 rounded-xl border-4 border-gray-600 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Machine Header Plate */}
                    <div className="bg-linear-to-r from-gray-700 via-gray-600 to-gray-700 px-8 py-4 border-b-4 border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Indicator LEDs */}
                            <div
                                className={`w-4 h-4 rounded-full ${
                                    isPlaying
                                        ? "bg-green-400 animate-pulse"
                                        : "bg-gray-500"
                                }`}
                            />
                            <div
                                className={`w-4 h-4 rounded-full ${
                                    isComplete ? "bg-green-400" : "bg-red-400"
                                }`}
                            />
                        </div>
                        <div className="text-center">
                            <span className="font-mono text-gray-300 text-lg tracking-widest">
                                TOGGLE-MATIC 3000
                            </span>
                            <span className="ml-4 font-mono text-yellow-400 text-lg">
                                #{currentRowIndex + 1}/{allRows.length}
                            </span>
                        </div>
                        <div className="text-sm text-gray-400 font-mono">
                            {solutionSequence.length} STEPS
                        </div>
                    </div>

                    {/* Light Display Panel */}
                    <div className="bg-gray-950 px-8 py-8 border-b-2 border-gray-700 flex-1 flex flex-col justify-center">
                        <div className="text-center text-sm text-gray-500 font-mono mb-4 tracking-wider">
                            ◆ LIGHT ARRAY ◆
                        </div>

                        {/* Target indicator row */}
                        <div className="flex justify-center gap-4 mb-2">
                            {targetPattern.map((target, idx) => (
                                <div
                                    key={`target-${idx}`}
                                    className="w-16 text-center text-sm text-gray-500"
                                >
                                    {target ? "▼" : ""}
                                </div>
                            ))}
                        </div>

                        {/* Actual lights */}
                        <div className="flex justify-center gap-4">
                            {targetPattern.map((_, idx) => (
                                <div
                                    key={idx}
                                    ref={(el) => {
                                        toggleRefs.current[idx] = el;
                                    }}
                                    className={`w-16 h-16 rounded-xl border-3 flex items-center justify-center text-sm font-bold transition-all duration-150 ${
                                        currentState[idx]
                                            ? "bg-green-400 border-green-300 shadow-lg shadow-green-400/60 text-green-900"
                                            : "bg-gray-800 border-gray-600 text-gray-600"
                                    }`}
                                    style={{
                                        boxShadow: currentState[idx]
                                            ? "0 0 25px 8px rgba(74, 222, 128, 0.4), inset 0 0 15px rgba(255,255,255,0.3)"
                                            : "inset 0 3px 6px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {idx}
                                </div>
                            ))}
                        </div>

                        {/* Status display */}
                        <div className="mt-6 flex justify-center gap-8 text-sm font-mono">
                            <div className="text-gray-500">
                                TARGET:{" "}
                                <span className="text-yellow-400 text-lg">
                                    {targetPattern
                                        .map((t) => (t ? "●" : "○"))
                                        .join(" ")}
                                </span>
                            </div>
                            <div className="text-gray-500">
                                CURRENT:{" "}
                                <span className="text-green-400 text-lg">
                                    {currentState
                                        .map((t) => (t ? "●" : "○"))
                                        .join(" ")}
                                </span>
                            </div>
                            {isComplete && !isPlaying && (
                                <span className="text-green-400 animate-pulse text-lg">
                                    ✓ MATCHED
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Button Control Panel */}
                    <div className="bg-linear-to-b from-gray-800 to-gray-850 px-8 py-6">
                        <div className="text-center text-sm text-gray-500 font-mono mb-4 tracking-wider">
                            ◆ CONTROL SWITCHES ◆
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {buttons.map((toggleIndices, btnIdx) => (
                                <button
                                    key={btnIdx}
                                    ref={(el) => {
                                        buttonRefs.current[btnIdx] = el;
                                    }}
                                    className="px-4 py-3 rounded-lg font-mono text-sm border-b-4 transition-all bg-red-800 border-red-950 text-red-200 hover:bg-red-700"
                                    disabled={isPlaying}
                                    style={{
                                        boxShadow:
                                            "inset 0 1px 0 rgba(255,255,255,0.1)",
                                    }}
                                >
                                    {toggleIndices.join(",")}
                                </button>
                            ))}
                        </div>

                        {/* Progress indicator */}
                        {isPlaying && currentStep >= 0 && (
                            <div className="text-center mt-4 text-yellow-400 text-sm font-mono animate-pulse">
                                EXECUTING STEP {currentStep + 1}/
                                {solutionSequence.length}
                            </div>
                        )}
                    </div>

                    {/* Start Button Area */}
                    <div className="bg-gray-900 px-8 py-6 border-t-2 border-gray-700 flex justify-center">
                        <button
                            onClick={playAnimation}
                            disabled={isPlaying}
                            className="w-24 h-24 rounded-full bg-linear-to-b from-green-500 to-green-700 text-white font-mono text-lg font-bold hover:from-green-400 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-lg border-4 border-green-800 disabled:border-gray-700 flex items-center justify-center"
                            style={{
                                boxShadow: isPlaying
                                    ? "0 0 20px 5px rgba(34, 197, 94, 0.5)"
                                    : "0 4px 15px rgba(0,0,0,0.3)",
                            }}
                        >
                            {isPlaying ? (
                                <span className="animate-pulse">●</span>
                            ) : (
                                "▶"
                            )}
                        </button>
                    </div>
                </div>

                {/* Machine base/shadow */}
                <div className="h-3 bg-linear-to-b from-gray-900 to-transparent mx-6 rounded-b-xl" />
            </div>
        </div>
    );
}
