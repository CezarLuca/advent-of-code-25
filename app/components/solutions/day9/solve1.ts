import { SolveResult } from "../../SolutionTemplate";

interface Point {
    x: number;
    y: number;
}

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const points: Point[] = input
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
            const [x, y] = line.trim().split(",").map(Number);
            return { x, y };
        });

    steps.push(`Parsed ${points.length} points from input`);

    if (points.length < 2) {
        steps.push("Need at least 2 points to form a rectangle");
        return { steps, solution: "0" };
    }

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    steps.push(`Grid bounds: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`);
    steps.push(`Grid size: ${maxX - minX + 1} x ${maxY - minY + 1}`);

    const sortedPoints = [...points].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    steps.push(
        `Points sorted spatially: ${sortedPoints
            .map((p) => `(${p.x},${p.y})`)
            .join(", ")}`
    );

    let maxArea = 0;
    let bestRect: { p1: Point; p2: Point } | null = null;

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const p1 = points[i];
            const p2 = points[j];

            const width = Math.abs(p2.x - p1.x) + 1;
            const height = Math.abs(p2.y - p1.y) + 1;

            const area = width * height;

            if (area > maxArea) {
                maxArea = area;
                bestRect = { p1, p2 };
                steps.push(
                    `New best rectangle: (${p1.x},${p1.y}) to (${p2.x},${p2.y}) - Area: ${area} (${width}x${height})`
                );
            }
        }
    }

    if (bestRect) {
        const width = Math.abs(bestRect.p2.x - bestRect.p1.x) + 1;
        const height = Math.abs(bestRect.p2.y - bestRect.p1.y) + 1;
        steps.push(
            `Largest rectangle: corners at (${bestRect.p1.x},${bestRect.p1.y}) and (${bestRect.p2.x},${bestRect.p2.y})`
        );
        steps.push(`Dimensions: ${width} x ${height} = ${maxArea} grid points`);
    }

    return { steps, solution: maxArea.toString() };
}
