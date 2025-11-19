interface ProblemToggleProps {
    selectedProblem: number;
    onToggle: (problem: number) => void;
}

export default function ProblemToggle({
    selectedProblem,
    onToggle,
}: ProblemToggleProps) {
    return (
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => onToggle(1)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedProblem === 1
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                Part 1
            </button>
            <button
                onClick={() => onToggle(2)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedProblem === 2
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                Part 2
            </button>
        </div>
    );
}
