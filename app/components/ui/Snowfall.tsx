"use client";

import { useState, useEffect } from "react";

interface Snowflake {
    id: number;
    x: number;
    size: number;
    animationDuration: number;
    delay: number;
    opacity: number;
}

function generateSnowflakes(count: number): Snowflake[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 4 + 2,
        animationDuration: Math.random() * 10 + 10,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.6 + 0.4,
    }));
}

export default function Snowfall({ count = 50 }: { count?: number }) {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

    useEffect(() => {
        setSnowflakes(generateSnowflakes(count));
    }, [count]);

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="absolute animate-snowfall rounded-full bg-white"
                    style={{
                        left: `${flake.x}%`,
                        width: `${flake.size}px`,
                        height: `${flake.size}px`,
                        opacity: flake.opacity,
                        animationDuration: `${flake.animationDuration}s`,
                        animationDelay: `${flake.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}
