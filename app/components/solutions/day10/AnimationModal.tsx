"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { PuzzleRowData } from "./solve1";
import ServerRack from "./ServerRack";
import CenterMachine from "./CenterMachine";
import ControlBar from "./ControlBar";

interface AnimationModalProps {
    isOpen: boolean;
    onClose: () => void;
    allRows: PuzzleRowData[];
    initialRowIndex?: number;
}

const ROWS_PER_RACK = 50;

export default function AnimationModal({
    isOpen,
    onClose,
    allRows,
    initialRowIndex = 0,
}: AnimationModalProps) {
    const [currentRowIndex, setCurrentRowIndex] = useState(initialRowIndex);
    const [currentState, setCurrentState] = useState<number[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [autoPlay, setAutoPlay] = useState(true);
    const [completedRows, setCompletedRows] = useState<number[][]>([]);

    const toggleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
    const machineRef = useRef<HTMLDivElement | null>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const playAnimationRef = useRef<() => void>(() => {});
    const prevRowIndexRef = useRef(currentRowIndex);
    const isInitializedRef = useRef(false);

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
        toggleRefs.current.clear();
        buttonRefs.current.clear();
    }, [currentRowIndex]);

    const rack1Rows = allRows.slice(0, ROWS_PER_RACK);
    const rack2Rows = allRows.slice(ROWS_PER_RACK, ROWS_PER_RACK * 2);
    const rack3Rows = allRows.slice(ROWS_PER_RACK * 2, ROWS_PER_RACK * 3);
    const rack4Rows = allRows.slice(ROWS_PER_RACK * 3, ROWS_PER_RACK * 4);

    const getCurrentRackInfo = (rowIndex: number) => {
        if (rowIndex < ROWS_PER_RACK)
            return { rackIndex: 0, localIndex: rowIndex };
        if (rowIndex < ROWS_PER_RACK * 2)
            return { rackIndex: 1, localIndex: rowIndex - ROWS_PER_RACK };
        if (rowIndex < ROWS_PER_RACK * 3)
            return { rackIndex: 2, localIndex: rowIndex - ROWS_PER_RACK * 2 };
        return { rackIndex: 3, localIndex: rowIndex - ROWS_PER_RACK * 3 };
    };

    useEffect(() => {
        if (allRows.length > 0 && !isInitializedRef.current) {
            isInitializedRef.current = true;
            const id = window.setTimeout(() => {
                setCompletedRows(allRows.map(() => []));
            }, 0);
            return () => clearTimeout(id);
        }
    }, [allRows]);

    const initializedState = useMemo(() => {
        if (currentRow) {
            return new Array(currentRow.targetPattern.length).fill(0);
        }
        return [];
    }, [currentRow]);

    useEffect(() => {
        if (prevRowIndexRef.current !== currentRowIndex && currentRow) {
            prevRowIndexRef.current = currentRowIndex;
            const id = window.setTimeout(() => {
                setCurrentState(
                    new Array(currentRow.targetPattern.length).fill(0)
                );
                setCurrentStep(-1);
            }, 0);
            return () => clearTimeout(id);
        }
    }, [currentRowIndex, currentRow]);

    useEffect(() => {
        if (currentRow && currentState.length === 0) {
            const id = window.setTimeout(() => {
                setCurrentState(initializedState);
            }, 0);
            return () => clearTimeout(id);
        }
    }, [currentRow, currentState.length, initializedState]);

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
                }, 100);
            });
        }
    }, [currentRowIndex, allRows]);

    const togglePlayPause = useCallback(() => {
        if (!isPlaying) {
            playAnimationRef.current();
        } else if (isPaused) {
            timelineRef.current?.resume();
            setIsPaused(false);
        } else {
            timelineRef.current?.pause();
            setIsPaused(true);
        }
    }, [isPlaying, isPaused]);

    const playAnimation = useCallback(() => {
        if (timelineRef.current) {
            timelineRef.current.kill();
        }

        const state = new Array(targetPattern.length).fill(0);
        setCurrentState([...state]);
        setCurrentStep(-1);
        setIsPlaying(true);
        setIsPaused(false);

        const tl = gsap.timeline({
            onComplete: () => {
                setIsPlaying(false);
                setIsPaused(false);

                setCompletedRows((prev) => {
                    const newCompleted = [...prev];
                    newCompleted[currentRowIndex] = [...targetPattern];
                    return newCompleted;
                });

                if (autoPlay && currentRowIndex < allRows.length - 1) {
                    setTimeout(() => {
                        advanceToNextRow();
                    }, 400);
                }
            },
        });
        timelineRef.current = tl;

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

            tl.call(() => {
                const btnEl = buttonRefs.current.get(btnIdx);
                if (btnEl) {
                    gsap.to(btnEl, {
                        boxShadow: "0 0 15px 3px rgba(34, 197, 94, 0.8)",
                        duration: 0.1,
                    });
                }
            });

            tl.to({}, { duration: 0.1 });

            tl.call(() => {
                const btnEl = buttonRefs.current.get(btnIdx);
                if (btnEl) {
                    gsap.to(btnEl, {
                        scale: 0.9,
                        backgroundColor: "#22c55e",
                        y: 4,
                        duration: 0.06,
                        ease: "power2.in",
                    });
                }
            });

            tl.to({}, { duration: 0.06 });

            tl.call(() => {
                affectedToggles.forEach((toggleIdx) => {
                    if (toggleIdx >= 0 && toggleIdx < state.length) {
                        state[toggleIdx] ^= 1;
                    }
                });
                setCurrentState([...state]);

                const validToggles = affectedToggles
                    .filter((i) => i >= 0 && i < targetPattern.length)
                    .map((i) => toggleRefs.current.get(i))
                    .filter((el): el is HTMLDivElement => el !== undefined);

                if (validToggles.length > 0) {
                    gsap.to(validToggles, {
                        scale: 1.2,
                        duration: 0.08,
                        ease: "back.out(2)",
                        onComplete: () => {
                            gsap.to(validToggles, {
                                scale: 1,
                                duration: 0.08,
                            });
                        },
                    });
                }
            });

            tl.to({}, { duration: 0.16 });

            tl.call(() => {
                const btnEl = buttonRefs.current.get(btnIdx);
                if (btnEl) {
                    gsap.to(btnEl, {
                        scale: 1,
                        backgroundColor: "#991b1b",
                        y: 0,
                        boxShadow: "none",
                        duration: 0.08,
                        ease: "power2.out",
                    });
                }
            });

            tl.to({}, { duration: 0.2 });
        });

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
        targetPattern,
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
        setIsPaused(false);
    }, [targetPattern.length]);

    const resetAll = useCallback(() => {
        timelineRef.current?.kill();
        setCurrentRowIndex(0);
        setCurrentState(
            new Array(allRows[0]?.targetPattern.length || 0).fill(0)
        );
        setCurrentStep(-1);
        setIsPlaying(false);
        setIsPaused(false);
        setCompletedRows(allRows.map(() => []));
    }, [allRows]);

    const goToRow = useCallback(
        (index: number) => {
            timelineRef.current?.kill();
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentRowIndex(index);
            setCurrentState(
                new Array(allRows[index]?.targetPattern.length || 0).fill(0)
            );
            setCurrentStep(-1);
        },
        [allRows]
    );

    const setToggleRef = useCallback(
        (index: number, el: HTMLDivElement | null) => {
            if (el) {
                toggleRefs.current.set(index, el);
            } else {
                toggleRefs.current.delete(index);
            }
        },
        []
    );

    const setButtonRef = useCallback(
        (index: number, el: HTMLButtonElement | null) => {
            if (el) {
                buttonRefs.current.set(index, el);
            } else {
                buttonRefs.current.delete(index);
            }
        },
        []
    );

    if (!isOpen || !currentRow) return null;

    const isComplete = currentState.every(
        (val, idx) => val === targetPattern[idx]
    );

    const { rackIndex: currentRackIndex } = getCurrentRackInfo(currentRowIndex);

    const getRackProps = (
        rackRows: PuzzleRowData[],
        rackIdx: number,
        title: string
    ) => ({
        rows: rackRows,
        completedRows: completedRows.slice(
            rackIdx * ROWS_PER_RACK,
            (rackIdx + 1) * ROWS_PER_RACK
        ),
        currentRowIndex:
            currentRackIndex === rackIdx
                ? currentRowIndex - rackIdx * ROWS_PER_RACK
                : -1,
        currentState: currentRackIndex === rackIdx ? currentState : [],
        onRowClick: (idx: number) => goToRow(idx + rackIdx * ROWS_PER_RACK),
        startIndex: rackIdx * ROWS_PER_RACK,
        title,
        isPlaying,
    });

    const machineProps = {
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
        onTogglePlayPause: togglePlayPause,
    };

    const controlBarProps = {
        currentRowIndex,
        totalRows: allRows.length,
        autoPlay,
        isPlaying,
        isPaused,
        onResetState: resetState,
        onResetAll: resetAll,
        onAutoPlayChange: setAutoPlay,
        onClose,
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-1 sm:p-2 lg:p-4 overflow-hidden">
            {/* Large screen layout: 4 racks side by side */}
            <div className="lg:flex w-full h-full max-h-[95vh] gap-2 items-stretch justify-center">
                {/* RACK A */}
                {rack1Rows.length > 0 && (
                    <div className="flex-1 max-w-[200px]">
                        <ServerRack {...getRackProps(rack1Rows, 0, "RACK A")} />
                    </div>
                )}

                {/* RACK B */}
                {rack2Rows.length > 0 && (
                    <div className="flex-1 max-w-[200px]">
                        <ServerRack {...getRackProps(rack2Rows, 1, "RACK B")} />
                    </div>
                )}

                {/* Center Machine */}
                <div className="shrink-0 w-[500px] flex flex-col">
                    <ControlBar {...controlBarProps} variant="desktop" />
                    <CenterMachine
                        ref={machineRef}
                        {...machineProps}
                        // variant="desktop"
                    />
                </div>

                {/* RACK C */}
                {rack3Rows.length > 0 && (
                    <div className="flex-1 max-w-[200px]">
                        <ServerRack {...getRackProps(rack3Rows, 2, "RACK C")} />
                    </div>
                )}

                {/* RACK D */}
                {rack4Rows.length > 0 && (
                    <div className="flex-1 max-w-[200px]">
                        <ServerRack {...getRackProps(rack4Rows, 3, "RACK D")} />
                    </div>
                )}
            </div>

            {/* Mobile/Tablet layout */}
            {/* <div className="lg:hidden w-full h-full flex flex-col max-h-screen">
                <ControlBar {...controlBarProps} variant="mobile" />
                <CenterMachine
                    ref={machineRef}
                    {...machineProps}
                    variant="mobile"
                /> */}

            {/* Bottom Rack - Horizontal scrolling */}
            {/* <div className="flex-1 mt-2 mx-1 min-h-0">
                    <ServerRack
                        rows={allRows}
                        completedRows={completedRows}
                        currentRowIndex={currentRowIndex}
                        currentState={currentState}
                        onRowClick={goToRow}
                        startIndex={0}
                        title="ALL ROWS"
                        isPlaying={isPlaying}
                        horizontal
                    />
                </div>
            </div> */}
        </div>
    );
}
