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
        steps.push("Need at least 2 points");
        return { steps, solution: "0" };
    }

    const allXs = points.map((p) => p.x);
    const allYs = points.map((p) => p.y);
    const minX = Math.min(...allXs);
    const maxX = Math.max(...allXs);
    const minY = Math.min(...allYs);
    const maxY = Math.max(...allYs);

    const uniqueXs = [...new Set([minX - 1, ...allXs, maxX + 1])].sort(
        (a, b) => a - b
    );
    const uniqueYs = [...new Set([minY - 1, ...allYs, maxY + 1])].sort(
        (a, b) => a - b
    );

    const xToIdx = new Map<number, number>();
    const yToIdx = new Map<number, number>();
    uniqueXs.forEach((x, i) => xToIdx.set(x, i));
    uniqueYs.forEach((y, i) => yToIdx.set(y, i));

    steps.push(`Compressed grid: ${uniqueXs.length} x ${uniqueYs.length}`);

    const inputPointSet = new Set<string>();
    for (const p of points) {
        inputPointSet.add(`${p.x},${p.y}`);
    }

    const horizontalBoundaries: { y: number; x1: number; x2: number }[] = [];
    const pointsByY = new Map<number, Point[]>();
    for (const p of points) {
        if (!pointsByY.has(p.y)) pointsByY.set(p.y, []);
        pointsByY.get(p.y)!.push(p);
    }
    for (const [y, rowPoints] of pointsByY) {
        if (rowPoints.length < 2) continue;
        rowPoints.sort((a, b) => a.x - b.x);
        for (let i = 0; i < rowPoints.length - 1; i++) {
            horizontalBoundaries.push({
                y,
                x1: rowPoints[i].x,
                x2: rowPoints[i + 1].x,
            });
        }
    }

    const verticalBoundaries: { x: number; y1: number; y2: number }[] = [];
    const pointsByX = new Map<number, Point[]>();
    for (const p of points) {
        if (!pointsByX.has(p.x)) pointsByX.set(p.x, []);
        pointsByX.get(p.x)!.push(p);
    }
    for (const [x, colPoints] of pointsByX) {
        if (colPoints.length < 2) continue;
        colPoints.sort((a, b) => a.y - b.y);
        for (let i = 0; i < colPoints.length - 1; i++) {
            verticalBoundaries.push({
                x,
                y1: colPoints[i].y,
                y2: colPoints[i + 1].y,
            });
        }
    }

    steps.push(`Horizontal boundaries: ${horizontalBoundaries.length}`);
    steps.push(`Vertical boundaries: ${verticalBoundaries.length}`);

    function crossesBoundaryHorizontal(
        x1: number,
        x2: number,
        y: number
    ): boolean {
        const lowX = Math.min(x1, x2);
        const highX = Math.max(x1, x2);
        for (const b of verticalBoundaries) {
            if (b.x > lowX && b.x < highX && y >= b.y1 && y <= b.y2) {
                return true;
            }
            if (b.x === lowX || b.x === highX) {
                if (y >= b.y1 && y <= b.y2) return true;
            }
        }
        return false;
    }

    function crossesBoundaryVertical(
        y1: number,
        y2: number,
        x: number
    ): boolean {
        const lowY = Math.min(y1, y2);
        const highY = Math.max(y1, y2);
        for (const b of horizontalBoundaries) {
            if (b.y > lowY && b.y < highY && x >= b.x1 && x <= b.x2) {
                return true;
            }
            if (b.y === lowY || b.y === highY) {
                if (x >= b.x1 && x <= b.x2) return true;
            }
        }
        return false;
    }

    const rows = uniqueYs.length;
    const cols = uniqueXs.length;
    const exterior = new Set<string>();
    const cellKey = (xi: number, yi: number) => `${xi},${yi}`;

    const queue: { xi: number; yi: number }[] = [];

    for (let xi = 0; xi < cols; xi++) {
        queue.push({ xi, yi: 0 });
        queue.push({ xi, yi: rows - 1 });
    }
    for (let yi = 0; yi < rows; yi++) {
        queue.push({ xi: 0, yi });
        queue.push({ xi: cols - 1, yi });
    }

    while (queue.length > 0) {
        const { xi, yi } = queue.pop()!;
        const key = cellKey(xi, yi);

        if (exterior.has(key)) continue;
        if (xi < 0 || xi >= cols || yi < 0 || yi >= rows) continue;

        const x = uniqueXs[xi];
        const y = uniqueYs[yi];

        exterior.add(key);

        // Right
        if (xi + 1 < cols) {
            const nextX = uniqueXs[xi + 1];
            if (!crossesBoundaryHorizontal(x, nextX, y)) {
                queue.push({ xi: xi + 1, yi });
            }
        }
        // Left
        if (xi - 1 >= 0) {
            const prevX = uniqueXs[xi - 1];
            if (!crossesBoundaryHorizontal(prevX, x, y)) {
                queue.push({ xi: xi - 1, yi });
            }
        }
        // Down
        if (yi + 1 < rows) {
            const nextY = uniqueYs[yi + 1];
            if (!crossesBoundaryVertical(y, nextY, x)) {
                queue.push({ xi, yi: yi + 1 });
            }
        }
        // Up
        if (yi - 1 >= 0) {
            const prevY = uniqueYs[yi - 1];
            if (!crossesBoundaryVertical(prevY, y, x)) {
                queue.push({ xi, yi: yi - 1 });
            }
        }
    }

    steps.push(`Exterior cells: ${exterior.size}`);

    function isBounded(x: number, y: number): boolean {
        let xi = 0;
        for (let i = 0; i < uniqueXs.length; i++) {
            if (uniqueXs[i] <= x) xi = i;
            else break;
        }
        let yi = 0;
        for (let i = 0; i < uniqueYs.length; i++) {
            if (uniqueYs[i] <= y) yi = i;
            else break;
        }
        return !exterior.has(cellKey(xi, yi));
    }

    function isRectangleBounded(
        rMinX: number,
        rMaxX: number,
        rMinY: number,
        rMaxY: number
    ): boolean {
        for (const x of uniqueXs) {
            if (x < rMinX || x > rMaxX) continue;
            for (const y of uniqueYs) {
                if (y < rMinY || y > rMaxY) continue;
                if (!isBounded(x, y)) return false;
            }
        }
        if (!isBounded(rMinX, rMinY)) return false;
        if (!isBounded(rMaxX, rMinY)) return false;
        if (!isBounded(rMinX, rMaxY)) return false;
        if (!isBounded(rMaxX, rMaxY)) return false;

        return true;
    }

    let maxArea = 0;
    let bestRect: { p1: Point; p2: Point } | null = null;

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const p1 = points[i];
            const p2 = points[j];

            const rectMinX = Math.min(p1.x, p2.x);
            const rectMaxX = Math.max(p1.x, p2.x);
            const rectMinY = Math.min(p1.y, p2.y);
            const rectMaxY = Math.max(p1.y, p2.y);

            const width = rectMaxX - rectMinX + 1;
            const height = rectMaxY - rectMinY + 1;
            const area = width * height;

            if (area <= maxArea) continue;

            if (isRectangleBounded(rectMinX, rectMaxX, rectMinY, rectMaxY)) {
                maxArea = area;
                bestRect = { p1, p2 };
                steps.push(
                    `New best: (${p1.x},${p1.y}) to (${p2.x},${p2.y}) - Area: ${area}`
                );
            }
        }
    }

    if (bestRect) {
        steps.push(
            `Largest valid rectangle: (${bestRect.p1.x},${bestRect.p1.y}) to (${bestRect.p2.x},${bestRect.p2.y})`
        );
        steps.push(`Area: ${maxArea} grid points`);
    } else {
        steps.push(`No valid rectangle found`);
    }

    return { steps, solution: maxArea.toString() };
}
