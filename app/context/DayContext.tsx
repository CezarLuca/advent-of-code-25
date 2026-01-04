"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    ReactNode,
} from "react";

type Problem = 1 | 2;

interface EffectSettings {
    fluidEffect: boolean;
    starCursor: boolean;
    snowfall: boolean;
}

interface DayContextType {
    openDay: number | null;
    selectedProblems: Record<number, Problem>;
    setOpenDay: (day: number | null) => void;
    updateProblem: (day: number, problem: Problem) => void;
    navigateToDay: (day: number, problem: Problem) => void;
    effectSettings: EffectSettings;
    toggleEffect: (effect: keyof EffectSettings) => void;
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

const DEFAULT_EFFECT_SETTINGS: EffectSettings = {
    fluidEffect: true,
    starCursor: true,
    snowfall: true,
};

export function DayProvider({ children }: { children: ReactNode }) {
    const [openDay, setOpenDay] = useState<number | null>(null);
    const [selectedProblems, setSelectedProblems] =
        useState<Record<number, Problem>>(buildInitialProblems);
    const [effectSettings, setEffectSettings] = useState<EffectSettings>(
        DEFAULT_EFFECT_SETTINGS
    );

    // Load effect settings from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("effectSettings");
        if (saved) {
            try {
                setEffectSettings(JSON.parse(saved));
            } catch {
                // Use defaults if parsing fails
            }
        }
    }, []);

    // Save effect settings to localStorage when they change
    useEffect(() => {
        localStorage.setItem("effectSettings", JSON.stringify(effectSettings));
    }, [effectSettings]);

    // Apply or remove star cursor based on settings
    useEffect(() => {
        if (effectSettings.starCursor) {
            document.body.classList.remove("no-star-cursor");
        } else {
            document.body.classList.add("no-star-cursor");
        }
    }, [effectSettings.starCursor]);

    const toggleEffect = useCallback((effect: keyof EffectSettings) => {
        setEffectSettings((prev) => ({
            ...prev,
            [effect]: !prev[effect],
        }));
    }, []);

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
                effectSettings,
                toggleEffect,
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
export type { Problem, EffectSettings };
