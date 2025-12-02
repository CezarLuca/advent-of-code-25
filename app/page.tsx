"use client";

import Navbar from "./components/Navbar";
import DaySection from "./components/DaySection";
import Footer from "./components/Footer";
import { DayProvider, useDayContext, TOTAL_DAYS } from "./context/DayContext";

function HomeContent() {
    const { selectedProblems, updateProblem, openDay, setOpenDay } =
        useDayContext();

    return (
        <div className="min-h-screen bg-linear-to-b from-slate-100 to-blue-50 text-gray-900 dark:from-slate-950 dark:to-green-950 dark:text-gray-50">
            <Navbar />
            <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
                {Array.from({ length: TOTAL_DAYS }, (_, index) => {
                    const day = index + 1;
                    return (
                        <section key={day} id={`day-${day}`}>
                            <DaySection
                                day={day}
                                selectedProblem={selectedProblems[day]}
                                onProblemChange={updateProblem}
                                isOpen={openDay === day}
                                onToggle={() =>
                                    setOpenDay(openDay === day ? null : day)
                                }
                            />
                        </section>
                    );
                })}
            </main>
            <Footer />
        </div>
    );
}

export default function Home() {
    return (
        <DayProvider>
            <HomeContent />
        </DayProvider>
    );
}
