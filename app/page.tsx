"use client";

import { useCallback, useState } from "react";
import Navbar from "./components/Navbar";
import DaySection from "./components/DaySection";
import Footer from "./components/Footer";

type Problem = 1 | 2;
const TOTAL_DAYS = 12;

const buildInitialState = () => {
    const next: Record<number, Problem> = {};
    for (let day = 1; day <= TOTAL_DAYS; day++) {
        next[day] = 1;
    }
    return next;
};

export default function Home() {
    const [selectedProblems, setSelectedProblems] =
        useState<Record<number, Problem>>(buildInitialState);

    const updateProblem = useCallback((day: number, problem: Problem) => {
        setSelectedProblems((prev) => ({ ...prev, [day]: problem }));
    }, []);

    const handleNavigate = useCallback(
        (day: number, problem: Problem) => {
            updateProblem(day, problem);
            document
                .getElementById(`day-${day}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        [updateProblem]
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
            <Navbar onNavigate={handleNavigate} />
            <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
                {Array.from({ length: TOTAL_DAYS }, (_, index) => {
                    const day = index + 1;
                    return (
                        <section key={day} id={`day-${day}`}>
                            <DaySection
                                day={day}
                                selectedProblem={selectedProblems[day]}
                                onProblemChange={updateProblem}
                            />
                        </section>
                    );
                })}
            </main>
            <Footer />
        </div>
    );
}
