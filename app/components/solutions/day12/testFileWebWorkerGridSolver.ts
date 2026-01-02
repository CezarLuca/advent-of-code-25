// Debug utilities for Day 12 Part 1
// Run this file to test the algorithm without the web worker

type Pattern = [number, number][];
type PatternOrientations = Pattern[];

// Copy of worker functions for debugging
function getAllOrientations(pattern: Pattern): PatternOrientations {
    const orientations: PatternOrientations = [];
    const seen = new Set<string>();

    let current = pattern;

    for (let flip = 0; flip < 2; flip++) {
        for (let rot = 0; rot < 4; rot++) {
            const normalized = normalizePattern(current);
            const key = JSON.stringify(normalized);

            if (!seen.has(key)) {
                seen.add(key);
                orientations.push(normalized);
            }

            current = rotate90(current);
        }
        current = flipHorizontal(pattern);
    }

    return orientations;
}

function rotate90(pattern: Pattern): Pattern {
    return pattern.map(([r, c]) => [c, -r]);
}

function flipHorizontal(pattern: Pattern): Pattern {
    return pattern.map(([r, c]) => [r, -c]);
}

function normalizePattern(pattern: Pattern): Pattern {
    if (pattern.length === 0) return [];

    const minRow = Math.min(...pattern.map(([r]) => r));
    const minCol = Math.min(...pattern.map(([, c]) => c));

    const normalized: Pattern = pattern.map(([r, c]) => [
        r - minRow,
        c - minCol,
    ]);

    normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    return normalized;
}

function canPlace(
    grid: boolean[][],
    pattern: Pattern,
    startRow: number,
    startCol: number,
    height: number,
    width: number
): boolean {
    for (const [dr, dc] of pattern) {
        const r = startRow + dr;
        const c = startCol + dc;

        if (r < 0 || r >= height || c < 0 || c >= width) {
            return false;
        }

        if (grid[r][c]) {
            return false;
        }
    }
    return true;
}

function placePattern(
    grid: boolean[][],
    pattern: Pattern,
    startRow: number,
    startCol: number
): void {
    for (const [dr, dc] of pattern) {
        grid[startRow + dr][startCol + dc] = true;
    }
}

function removePattern(
    grid: boolean[][],
    pattern: Pattern,
    startRow: number,
    startCol: number
): void {
    for (const [dr, dc] of pattern) {
        grid[startRow + dr][startCol + dc] = false;
    }
}

function createGrid(height: number, width: number): boolean[][] {
    return Array.from({ length: height }, () => Array(width).fill(false));
}

let iterations = 0;

function canFitAll(
    grid: boolean[][],
    height: number,
    width: number,
    patternsToPlace: PatternOrientations[],
    index: number,
    debug: boolean = false
): boolean {
    if (index >= patternsToPlace.length) {
        return true;
    }

    iterations++;

    const orientations = patternsToPlace[index];

    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            for (const pattern of orientations) {
                if (canPlace(grid, pattern, r, c, height, width)) {
                    placePattern(grid, pattern, r, c);

                    if (debug) {
                        console.log(`Placed pattern ${index} at (${r}, ${c}):`);
                        printGrid(grid);
                    }

                    if (
                        canFitAll(
                            grid,
                            height,
                            width,
                            patternsToPlace,
                            index + 1,
                            debug
                        )
                    ) {
                        return true;
                    }

                    removePattern(grid, pattern, r, c);

                    if (debug) {
                        console.log(`Backtracked pattern ${index}`);
                    }
                }
            }
        }
    }

    return false;
}

// Helper to visualize the grid
function printGrid(grid: boolean[][]): void {
    for (const row of grid) {
        console.log(row.map((cell) => (cell ? "#" : ".")).join(""));
    }
    console.log("");
}

// Helper to visualize a pattern
function printPattern(pattern: Pattern): void {
    if (pattern.length === 0) {
        console.log("(empty pattern)");
        return;
    }

    const maxRow = Math.max(...pattern.map(([r]) => r));
    const maxCol = Math.max(...pattern.map(([, c]) => c));

    const grid: string[][] = Array.from({ length: maxRow + 1 }, () =>
        Array(maxCol + 1).fill(".")
    );

    for (const [r, c] of pattern) {
        grid[r][c] = "#";
    }

    for (const row of grid) {
        console.log(row.join(""));
    }
}

// Test with the example input
function testExample() {
    console.log("=== Day 12 Part 1 Debug ===\n");

    // Pattern 4: ###, #.., ###
    const pattern4: Pattern = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
    ];

    console.log("Pattern 4:");
    printPattern(pattern4);

    const orientations = getAllOrientations(pattern4);
    console.log(
        `\nPattern 4 has ${orientations.length} unique orientations:\n`
    );

    orientations.forEach((orient, i) => {
        console.log(`Orientation ${i}:`);
        printPattern(orient);
        console.log("");
    });

    // Test case 1: 4x4 grid with 2 copies of pattern 4
    console.log("=== Test Case 1: 4x4 grid, 2 copies of pattern 4 ===\n");

    const patternsToPlace1: PatternOrientations[] = [
        orientations,
        orientations,
    ];

    // Sort by size (both same size here)
    patternsToPlace1.sort((a, b) => (b[0]?.length || 0) - (a[0]?.length || 0));

    const grid1 = createGrid(4, 4);
    iterations = 0;

    const result1 = canFitAll(grid1, 4, 4, patternsToPlace1, 0, false);

    console.log(`Result: ${result1 ? "CAN FIT" : "CANNOT FIT"}`);
    console.log(`Iterations: ${iterations}`);

    if (result1) {
        // Run again with debug to see final placement
        const grid1Debug = createGrid(4, 4);
        canFitAll(grid1Debug, 4, 4, patternsToPlace1, 0, false);
        console.log("\nFinal grid:");
        printGrid(grid1Debug);
    }

    console.log("\n");

    // Expected result: CAN FIT (2 valid regions out of 3)
    // Pattern 4 takes 7 cells, 2 copies = 14 cells
    // 4x4 grid = 16 cells, so 2 cells will be empty

    return result1;
}

// Run test if this file is executed directly
// In browser console or Node.js:
// testExample();

export { testExample, printGrid, printPattern, getAllOrientations };
