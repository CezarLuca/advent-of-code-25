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
    "3-1": lazy(() => import("./solutions/day3/Part1")),
    "3-2": lazy(() => import("./solutions/day3/Part2")),
    "4-1": lazy(() => import("./solutions/day4/Part1")),
    "4-2": lazy(() => import("./solutions/day4/Part2")),
    "5-1": lazy(() => import("./solutions/day5/Part1")),
    "5-2": lazy(() => import("./solutions/day5/Part2")),
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
                        <div className="text-green-600 flex items-center gap-2">
                            <span className="animate-pulse">❄️</span>
                            Loading solution...
                        </div>
                    }
                >
                    <SolutionComponent />
                </Suspense>
            ) : (
                <div className="text-green-600 italic flex items-center gap-2">
                    <span>🎁</span>
                    Solution for Day {day} Part {selectedProblem} not yet
                    implemented — coming soon!
                </div>
            )}
        </div>
    );
}
