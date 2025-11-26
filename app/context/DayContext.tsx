"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";

type Problem = 1 | 2;

interface DayContextType {
    openDay: number | null;
    selectedProblems: Record<number, Problem>;
    setOpenDay: (day: number | null) => void;
    updateProblem: (day: number, problem: Problem) => void;
    navigateToDay: (day: number, problem: Problem) => void;
}

const TOTAL_DAYS = 12;

const buildInitialProblems = (): Record<number, Problem> => {
    const problems: Record<number, Problem> = {};
    for (let day = 1; day <= TOTAL_DAYS; day++) {
        problems[day] = 1;
    }
    return problems;
};

const DayContext = createContext<DayContextType | undefined>(undefined);

export function DayProvider({ children }: { children: ReactNode }) {
    const [openDay, setOpenDay] = useState<number | null>(null);
    const [selectedProblems, setSelectedProblems] =
        useState<Record<number, Problem>>(buildInitialProblems);

    const updateProblem = useCallback((day: number, problem: Problem) => {
        setSelectedProblems((prev) => ({ ...prev, [day]: problem }));
    }, []);

    const navigateToDay = useCallback(
        (day: number, problem: Problem) => {
            setOpenDay(day);
            updateProblem(day, problem);
            setTimeout(() => {
                document
                    .getElementById(`day-${day}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 0);
        },
        [updateProblem]
    );

    return (
        <DayContext.Provider
            value={{
                openDay,
                selectedProblems,
                setOpenDay,
                updateProblem,
                navigateToDay,
            }}
        >
            {children}
        </DayContext.Provider>
    );
}

export function useDayContext() {
    const context = useContext(DayContext);
    if (context === undefined) {
        throw new Error("useDayContext must be used within a DayProvider");
    }
    return context;
}

export { TOTAL_DAYS };
export type { Problem };
