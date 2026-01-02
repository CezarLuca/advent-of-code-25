// Web Worker code for Day 12 Part 1 - Present Fitting Problem
// This file is for debugging purposes. The actual worker code is inlined in solve1.ts

export interface WorkerMessage {
    patterns: string; // JSON serialized patterns
    gridSpec: string; // JSON serialized grid spec
}

export interface ProgressMessage {
    type: "progress";
    data: { iterations: number };
}

export interface ResultMessage {
    type: "result";
    data: { canFit: boolean; iterations: number };
}

export interface ErrorMessage {
    type: "error";
    data: { message: string };
}

export type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

// Type for a pattern - array of [row, col] coordinates
type Pattern = [number, number][];

// Type for all orientations of a pattern
type PatternOrientations = Pattern[];

/**
 * Get all unique orientations (rotations + flips) of a pattern.
 * A pattern can have up to 8 orientations (4 rotations × 2 flips),
 * but symmetric patterns may have fewer unique ones.
 */
function getAllOrientations(pattern: Pattern): PatternOrientations {
    const orientations: PatternOrientations = [];
    const seen = new Set<string>();

    let current = pattern;

    // Try both original and flipped
    for (let flip = 0; flip < 2; flip++) {
        // Try all 4 rotations
        for (let rot = 0; rot < 4; rot++) {
            const normalized = normalizePattern(current);
            const key = JSON.stringify(normalized);

            if (!seen.has(key)) {
                seen.add(key);
                orientations.push(normalized);
            }

            current = rotate90(current);
        }
        // Flip for second iteration
        current = flipHorizontal(pattern);
    }

    return orientations;
}

/**
 * Rotate pattern 90 degrees clockwise.
 * Transform: [row, col] → [col, -row]
 *
 * Example:
 *   ###      ##
 *   #..  →   ##
 *   ###      .#
 *            ##
 */
function rotate90(pattern: Pattern): Pattern {
    return pattern.map(([r, c]) => [c, -r]);
}

/**
 * Flip pattern horizontally (mirror along vertical axis).
 * Transform: [row, col] → [row, -col]
 *
 * Example:
 *   ###      ###
 *   #..  →   ..#
 *   ###      ###
 */
function flipHorizontal(pattern: Pattern): Pattern {
    return pattern.map(([r, c]) => [r, -c]);
}

/**
 * Normalize pattern so that:
 * 1. Top-left corner is at [0, 0]
 * 2. Coordinates are sorted for consistent comparison
 *
 * This allows us to detect duplicate orientations.
 */
function normalizePattern(pattern: Pattern): Pattern {
    if (pattern.length === 0) return [];

    const minRow = Math.min(...pattern.map(([r]) => r));
    const minCol = Math.min(...pattern.map(([, c]) => c));

    const normalized: Pattern = pattern.map(([r, c]) => [
        r - minRow,
        c - minCol,
    ]);

    // Sort for consistent comparison
    normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    return normalized;
}

/**
 * Check if a pattern can be placed at position (startRow, startCol).
 * A pattern can be placed if:
 * 1. All cells are within grid bounds
 * 2. All cells are currently empty (not occupied)
 */
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

        // Check bounds
        if (r < 0 || r >= height || c < 0 || c >= width) {
            return false;
        }

        // Check if cell is already occupied
        if (grid[r][c]) {
            return false;
        }
    }
    return true;
}

/**
 * Place a pattern on the grid by marking its cells as occupied.
 */
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

/**
 * Remove a pattern from the grid by marking its cells as empty.
 * Used during backtracking when a placement doesn't lead to a solution.
 */
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

/**
 * Create an empty grid of the specified dimensions.
 */
function createGrid(height: number, width: number): boolean[][] {
    return Array.from({ length: height }, () => Array(width).fill(false));
}

// Track iterations for progress reporting
let iterations = 0;
let lastProgressTime = 0;

/**
 * Main backtracking solver.
 *
 * Algorithm:
 * 1. If all patterns are placed, return true (success!)
 * 2. For the current pattern (at index):
 *    a. Try every position (row, col) on the grid
 *    b. For each position, try every orientation of the pattern
 *    c. If placement is valid:
 *       - Place the pattern
 *       - Recursively try to place remaining patterns
 *       - If successful, return true
 *       - Otherwise, remove pattern (backtrack) and try next option
 * 3. If no valid placement found, return false
 *
 * @param grid - Current state of the grid
 * @param height - Grid height
 * @param width - Grid width
 * @param patternsToPlace - Array of pattern orientations to place
 * @param index - Current pattern index we're trying to place
 */
function canFitAll(
    grid: boolean[][],
    height: number,
    width: number,
    patternsToPlace: PatternOrientations[],
    index: number
): boolean {
    // Base case: all patterns placed successfully
    if (index >= patternsToPlace.length) {
        return true;
    }

    iterations++;

    // Report progress every 200ms to keep UI responsive
    const now = Date.now();
    if (now - lastProgressTime > 200) {
        lastProgressTime = now;
        self.postMessage({
            type: "progress",
            data: { iterations },
        });
    }

    const orientations = patternsToPlace[index];

    // Try all positions on the grid
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            // Try all orientations of this pattern
            for (const pattern of orientations) {
                if (canPlace(grid, pattern, r, c, height, width)) {
                    // Place the pattern
                    placePattern(grid, pattern, r, c);

                    // Recursively try to place remaining patterns
                    if (
                        canFitAll(
                            grid,
                            height,
                            width,
                            patternsToPlace,
                            index + 1
                        )
                    ) {
                        return true; // Found a valid solution!
                    }

                    // Backtrack: remove the pattern and try another position/orientation
                    removePattern(grid, pattern, r, c);
                }
            }
        }
    }

    // No valid placement found for this pattern
    return false;
}

/**
 * Worker message handler.
 * Receives patterns and grid spec, runs the solver, returns result.
 */
self.onmessage = function (e: MessageEvent<WorkerMessage>) {
    try {
        // Parse input data
        const patterns: Pattern[] = JSON.parse(e.data.patterns);
        const spec: {
            width: number;
            height: number;
            patternCounts: number[];
        } = JSON.parse(e.data.gridSpec);

        // Reset iteration counter
        iterations = 0;
        lastProgressTime = Date.now();

        // Pre-compute all orientations for each pattern type
        const allOrientations: PatternOrientations[] = patterns.map((p) =>
            getAllOrientations(p)
        );

        // Build list of all pattern instances we need to place
        // If patternCounts is [0, 0, 0, 0, 2, 0], we need 2 instances of pattern 4
        const patternsToPlace: PatternOrientations[] = [];

        for (
            let patternIdx = 0;
            patternIdx < spec.patternCounts.length;
            patternIdx++
        ) {
            const count = spec.patternCounts[patternIdx];
            for (let j = 0; j < count; j++) {
                if (allOrientations[patternIdx]) {
                    patternsToPlace.push(allOrientations[patternIdx]);
                }
            }
        }

        // Calculate total cells needed
        const totalCells = patternsToPlace.reduce(
            (sum, orients) => sum + (orients[0]?.length || 0),
            0
        );
        const gridCells = spec.width * spec.height;

        // Quick check: if total cells > grid cells, impossible to fit
        if (totalCells > gridCells) {
            self.postMessage({
                type: "result",
                data: { canFit: false, iterations },
            } as ResultMessage);
            return;
        }

        // Sort patterns by size (largest first) for better pruning
        // Larger patterns are more constrained, so placing them first
        // leads to faster detection of impossible configurations
        patternsToPlace.sort(
            (a, b) => (b[0]?.length || 0) - (a[0]?.length || 0)
        );

        // Create empty grid
        const grid = createGrid(spec.height, spec.width);

        // Run the backtracking solver
        const canFit = canFitAll(
            grid,
            spec.height,
            spec.width,
            patternsToPlace,
            0
        );

        // Send result back to main thread
        self.postMessage({
            type: "result",
            data: { canFit, iterations },
        } as ResultMessage);
    } catch (err) {
        // Send error back to main thread
        self.postMessage({
            type: "error",
            data: { message: (err as Error).message },
        } as ErrorMessage);
    }
};

// Export for testing purposes (won't be used in actual worker)
export {
    getAllOrientations,
    rotate90,
    flipHorizontal,
    normalizePattern,
    canPlace,
    placePattern,
    removePattern,
    createGrid,
    canFitAll,
};
