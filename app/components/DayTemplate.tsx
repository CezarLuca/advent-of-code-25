import { lazy, Suspense } from "react";

interface DayTemplateProps {
    day: number;
    selectedProblem: 1 | 2;
}

const solutionComponents: Record<
    string,
    React.LazyExoticComponent<React.ComponentType>
> = {
    "1-1": lazy(() => import("./solutions/day1/Part1")),
    "1-2": lazy(() => import("./solutions/day1/Part2")),
    "2-1": lazy(() => import("./solutions/day2/Part1")),
    "2-2": lazy(() => import("./solutions/day2/Part2")),
};

export default function DayTemplate({
    day,
    selectedProblem,
}: DayTemplateProps) {
    const key = `${day}-${selectedProblem}`;
    const SolutionComponent = solutionComponents[key];

    return (
        <div className="mt-4">
            {SolutionComponent ? (
                <Suspense
                    fallback={
                        <div className="text-gray-500">Loading solution...</div>
                    }
                >
                    <SolutionComponent />
                </Suspense>
            ) : (
                <div className="text-gray-500 italic">
                    Solution for Day {day} Part {selectedProblem} not yet
                    implemented.
                </div>
            )}
        </div>
    );
}
