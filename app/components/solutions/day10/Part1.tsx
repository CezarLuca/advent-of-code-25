"use client";

import { useState } from "react";
import SolutionTemplate from "../../SolutionTemplate";
import { solve, PuzzleRowData, SolveResultWithData } from "./solve1";
import AnimationModal from "./AnimationModal";

export default function Part1() {
    const [puzzleData, setPuzzleData] = useState<PuzzleRowData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [initialRow, setInitialRow] = useState(0);

    const wrappedSolve = (input: string): SolveResultWithData => {
        const result = solve(input);
        if (result.puzzleData) {
            setPuzzleData(result.puzzleData);
        }
        return result;
    };

    const openVisualization = (startRow: number = 0) => {
        setInitialRow(startRow);
        setShowModal(true);
    };

    return (
        <div>
            <SolutionTemplate solve={wrappedSolve} />

            {puzzleData.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">
                        🎬 Visualize Solutions:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => openVisualization(0)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            ▶ Play All ({puzzleData.length} machines)
                        </button>
                        <div className="w-px bg-green-300 mx-2" />
                        {puzzleData.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => openVisualization(idx)}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                                #{idx + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showModal && puzzleData.length > 0 && (
                <AnimationModal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    allRows={puzzleData}
                    initialRowIndex={initialRow}
                />
            )}
        </div>
    );
}
