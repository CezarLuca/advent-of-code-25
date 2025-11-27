import ProblemToggle from "./ProblemToggle";
import Collapsible from "./ui/Collapsible";
import DayTemplate from "./DayTemplate";

interface DaySectionProps {
    day: number;
    selectedProblem: 1 | 2;
    onProblemChange: (day: number, problem: 1 | 2) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function DaySection({
    day,
    selectedProblem,
    onProblemChange,
    isOpen,
    onToggle,
}: DaySectionProps) {
    const handleProblemToggle = (problem: number) => {
        onProblemChange(day, problem as 1 | 2);
    };

    return (
        <Collapsible title={`Day ${day}`} isOpen={isOpen} onToggle={onToggle}>
            <ProblemToggle
                selectedProblem={selectedProblem}
                onToggle={handleProblemToggle}
            />
            <DayTemplate day={day} selectedProblem={selectedProblem} />
        </Collapsible>
    );
}
