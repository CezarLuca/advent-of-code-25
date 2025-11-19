import ProblemToggle from "./ProblemToggle";
import Collapsible from "./ui/Collapsible";

interface DaySectionProps {
    day: number;
    selectedProblem: 1 | 2;
    onProblemChange: (day: number, problem: 1 | 2) => void;
}

export default function DaySection({
    day,
    selectedProblem,
    onProblemChange,
}: DaySectionProps) {
    const handleProblemToggle = (problem: number) => {
        onProblemChange(day, problem as 1 | 2);
    };

    return (
        <Collapsible title={`Day ${day}`}>
            <ProblemToggle
                selectedProblem={selectedProblem}
                onToggle={handleProblemToggle}
            />
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                {selectedProblem === 1 && (
                    <div>
                        <h3 className="font-bold mb-2">Part 1 Solution</h3>
                        <p>Solution logic for Day {day} Part 1 goes here...</p>
                    </div>
                )}
                {selectedProblem === 2 && (
                    <div>
                        <h3 className="font-bold mb-2">Part 2 Solution</h3>
                        <p>Solution logic for Day {day} Part 2 goes here...</p>
                    </div>
                )}
            </div>
        </Collapsible>
    );
}
