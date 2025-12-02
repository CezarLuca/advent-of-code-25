interface ProblemToggleProps {
    selectedProblem: number;
    onToggle: (problem: number) => void;
}

export default function ProblemToggle({
    selectedProblem,
    onToggle,
}: ProblemToggleProps) {
    return (
        <div className="flex gap-2 mb-4 border-b border-green-200 dark:border-green-800">
            <button
                onClick={() => onToggle(1)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedProblem === 1
                        ? "border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                }`}
            >
                ⭐ Part 1
            </button>
            <button
                onClick={() => onToggle(2)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedProblem === 2
                        ? "border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                }`}
            >
                ⭐ Part 2
            </button>
        </div>
    );
}
