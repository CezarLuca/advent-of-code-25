// Types for the solver
export interface GridResult {
    gridIndex: number;
    canFit: boolean;
    status: "pending" | "processing" | "done" | "error";
    elapsedMs?: number;
    gridSpec?: string;
}

export interface WorkerProgress {
    workerId: number;
    gridIndex: number;
    iterations: number;
    elapsedMs: number;
    gridSpec: string;
}

export interface ProgressCallback {
    (
        gridIndex: number,
        canFit: boolean,
        status: GridResult["status"],
        elapsedMs?: number,
        workerProgress?: WorkerProgress,
        gridSpec?: string
    ): void;
}

// Detect optimal worker count
function getWorkerCount(): number {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 8);
    }
    return 4;
}

interface WorkerTask {
    gridIndex: number;
    patterns: string; // JSON serialized patterns
    gridSpec: string; // JSON serialized grid spec
    gridSpecDisplay: string;
    startTime: number;
    resolve: (canFit: boolean) => void;
    reject: (error: Error) => void;
}

interface WorkerInstance {
    worker: Worker;
    busy: boolean;
    currentTask: WorkerTask | null;
}

export interface ParsedInput {
    patterns: [number, number][][];
    gridSpecs: {
        width: number;
        height: number;
        patternCounts: number[];
        display: string;
    }[];
}

// Parse input on main thread to share patterns across workers
export function parseInput(input: string): ParsedInput {
    const lines = input.trim().split("\n");
    const patterns: [number, number][][] = [];
    const gridSpecs: ParsedInput["gridSpecs"] = [];

    let currentPatternLines: string[] = [];

    for (const line of lines) {
        const trimmedLine = line.trim();

        const gridMatch = trimmedLine.match(/^(\d+)x(\d+):\s*(.+)$/);
        if (gridMatch) {
            if (currentPatternLines.length > 0) {
                patterns.push(parsePatternLines(currentPatternLines));
                currentPatternLines = [];
            }
            const width = parseInt(gridMatch[1]);
            const height = parseInt(gridMatch[2]);
            const counts = gridMatch[3].split(/\s+/).map(Number);
            gridSpecs.push({
                width,
                height,
                patternCounts: counts,
                display: trimmedLine,
            });
        } else if (/^\d+:$/.test(trimmedLine)) {
            if (currentPatternLines.length > 0) {
                patterns.push(parsePatternLines(currentPatternLines));
            }
            currentPatternLines = [];
        } else if (/^[#.]+$/.test(trimmedLine)) {
            currentPatternLines.push(trimmedLine);
        } else if (trimmedLine === "") {
            if (currentPatternLines.length > 0) {
                patterns.push(parsePatternLines(currentPatternLines));
                currentPatternLines = [];
            }
        }
    }

    if (currentPatternLines.length > 0) {
        patterns.push(parsePatternLines(currentPatternLines));
    }

    return { patterns, gridSpecs };
}

function parsePatternLines(lines: string[]): [number, number][] {
    const coords: [number, number][] = [];
    for (let row = 0; row < lines.length; row++) {
        for (let col = 0; col < lines[row].length; col++) {
            if (lines[row][col] === "#") {
                coords.push([row, col]);
            }
        }
    }
    return coords;
}

export async function solveAsync(
    input: string,
    onProgress: ProgressCallback,
    signal?: AbortSignal
): Promise<number> {
    const { patterns, gridSpecs } = parseInput(input);

    if (gridSpecs.length === 0) {
        return 0;
    }

    const workerCode = getWorkerCode();
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);

    const workerCount = Math.min(getWorkerCount(), gridSpecs.length);
    const workers: WorkerInstance[] = [];
    const taskQueue: WorkerTask[] = [];
    const results: Map<number, boolean> = new Map();

    // Create worker pool
    for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(workerUrl);
        const workerInstance: WorkerInstance = {
            worker,
            busy: false,
            currentTask: null,
        };

        worker.onmessage = (e) => {
            const { type, data } = e.data;

            if (type === "progress" && workerInstance.currentTask) {
                const task = workerInstance.currentTask;
                const elapsedMs = Date.now() - task.startTime;

                onProgress(
                    task.gridIndex,
                    false,
                    "processing",
                    elapsedMs,
                    {
                        workerId: i,
                        gridIndex: task.gridIndex,
                        iterations: data.iterations,
                        elapsedMs,
                        gridSpec: task.gridSpecDisplay,
                    },
                    task.gridSpecDisplay
                );
            } else if (type === "result" && workerInstance.currentTask) {
                const task = workerInstance.currentTask;
                const elapsedMs = Date.now() - task.startTime;

                results.set(task.gridIndex, data.canFit);
                onProgress(
                    task.gridIndex,
                    data.canFit,
                    "done",
                    elapsedMs,
                    undefined,
                    task.gridSpecDisplay
                );
                task.resolve(data.canFit);

                workerInstance.busy = false;
                workerInstance.currentTask = null;
                processNextTask(workerInstance);
            } else if (type === "error" && workerInstance.currentTask) {
                const task = workerInstance.currentTask;
                onProgress(task.gridIndex, false, "error");
                task.reject(new Error(data.message));

                workerInstance.busy = false;
                workerInstance.currentTask = null;
                processNextTask(workerInstance);
            }
        };

        worker.onerror = (err) => {
            if (workerInstance.currentTask) {
                workerInstance.currentTask.reject(new Error(err.message));
                workerInstance.busy = false;
                workerInstance.currentTask = null;
            }
        };

        workers.push(workerInstance);
    }

    const processNextTask = (workerInstance: WorkerInstance) => {
        if (taskQueue.length === 0 || workerInstance.busy) return;

        const task = taskQueue.shift()!;
        workerInstance.busy = true;
        workerInstance.currentTask = task;

        onProgress(
            task.gridIndex,
            false,
            "processing",
            0,
            {
                workerId: workers.indexOf(workerInstance),
                gridIndex: task.gridIndex,
                iterations: 0,
                elapsedMs: 0,
                gridSpec: task.gridSpecDisplay,
            },
            task.gridSpecDisplay
        );

        workerInstance.worker.postMessage({
            patterns: task.patterns,
            gridSpec: task.gridSpec,
        });
    };

    const gridPromises: Promise<boolean>[] = gridSpecs.map(
        (spec, gridIndex) => {
            return new Promise<boolean>((resolve, reject) => {
                const task: WorkerTask = {
                    gridIndex,
                    patterns: JSON.stringify(patterns),
                    gridSpec: JSON.stringify({
                        width: spec.width,
                        height: spec.height,
                        patternCounts: spec.patternCounts,
                    }),
                    gridSpecDisplay: spec.display,
                    startTime: Date.now(),
                    resolve,
                    reject,
                };
                taskQueue.push(task);
            });
        }
    );

    if (signal) {
        signal.addEventListener("abort", () => {
            workers.forEach((w) => {
                w.worker.terminate();
            });
            URL.revokeObjectURL(workerUrl);
            throw new Error("Aborted");
        });
    }

    workers.forEach((workerInstance) => {
        processNextTask(workerInstance);
    });

    try {
        await Promise.all(gridPromises);
    } catch (e) {
        workers.forEach((w) => w.worker.terminate());
        URL.revokeObjectURL(workerUrl);
        throw e;
    }

    workers.forEach((w) => w.worker.terminate());
    URL.revokeObjectURL(workerUrl);

    let validRegions = 0;
    for (let i = 0; i < gridSpecs.length; i++) {
        if (results.get(i)) {
            validRegions++;
        }
    }

    return validRegions;
}

function getWorkerCode(): string {
    return `
// Worker code for solving a single grid

function getAllOrientations(pattern) {
    const orientations = [];
    const seen = new Set();

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

function rotate90(pattern) {
    return pattern.map(([r, c]) => [c, -r]);
}

function flipHorizontal(pattern) {
    return pattern.map(([r, c]) => [r, -c]);
}

function normalizePattern(pattern) {
    if (pattern.length === 0) return [];
    const minRow = Math.min(...pattern.map(([r]) => r));
    const minCol = Math.min(...pattern.map(([, c]) => c));
    const normalized = pattern.map(([r, c]) => [r - minRow, c - minCol]);
    normalized.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return normalized;
}

function canPlace(grid, pattern, startRow, startCol, height, width) {
    for (const [dr, dc] of pattern) {
        const r = startRow + dr;
        const c = startCol + dc;
        if (r < 0 || r >= height || c < 0 || c >= width || grid[r][c]) {
            return false;
        }
    }
    return true;
}

function placePattern(grid, pattern, startRow, startCol) {
    for (const [dr, dc] of pattern) {
        grid[startRow + dr][startCol + dc] = true;
    }
}

function removePattern(grid, pattern, startRow, startCol) {
    for (const [dr, dc] of pattern) {
        grid[startRow + dr][startCol + dc] = false;
    }
}

function createGrid(height, width) {
    return Array.from({ length: height }, () => Array(width).fill(false));
}

// Find first empty cell to constrain search
function findFirstEmpty(grid, height, width) {
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            if (!grid[r][c]) return [r, c];
        }
    }
    return null;
}

let iterations = 0;
let lastProgressTime = 0;

// Simple backtracking solver - tries all valid positions for each pattern
function canFitAll(grid, height, width, patternsToPlace, index) {
    if (index >= patternsToPlace.length) {
        return true; // All patterns placed successfully
    }

    iterations++;
    
    const now = Date.now();
    if (now - lastProgressTime > 200) {
        lastProgressTime = now;
        self.postMessage({
            type: "progress",
            data: { iterations }
        });
    }

    const orientations = patternsToPlace[index];

    // Try all positions and orientations for this pattern
    for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
            for (const pattern of orientations) {
                if (canPlace(grid, pattern, r, c, height, width)) {
                    placePattern(grid, pattern, r, c);

                    if (canFitAll(grid, height, width, patternsToPlace, index + 1)) {
                        return true;
                    }

                    removePattern(grid, pattern, r, c);
                }
            }
        }
    }

    return false;
}

self.onmessage = function(e) {
    try {
        const patterns = JSON.parse(e.data.patterns);
        const spec = JSON.parse(e.data.gridSpec);
        
        iterations = 0;
        lastProgressTime = Date.now();

        // Pre-compute all orientations for each pattern
        const allOrientations = patterns.map(p => getAllOrientations(p));

        // Build list of all pattern instances we need to place
        const patternsToPlace = [];
        for (let patternIdx = 0; patternIdx < spec.patternCounts.length; patternIdx++) {
            const count = spec.patternCounts[patternIdx];
            for (let j = 0; j < count; j++) {
                if (allOrientations[patternIdx]) {
                    patternsToPlace.push(allOrientations[patternIdx]);
                }
            }
        }

        const totalCells = patternsToPlace.reduce(
            (sum, orients) => sum + (orients[0]?.length || 0),
            0
        );
        const gridCells = spec.width * spec.height;

        // Quick check: if total cells > grid cells, impossible
        if (totalCells > gridCells) {
            self.postMessage({
                type: "result",
                data: { canFit: false, iterations }
            });
            return;
        }

        // Sort patterns by size (largest first) for better pruning
        patternsToPlace.sort((a, b) => (b[0]?.length || 0) - (a[0]?.length || 0));

        const grid = createGrid(spec.height, spec.width);
        
        // Use optimized solver with first-empty-cell heuristic
        const canFit = canFitAll(grid, spec.height, spec.width, patternsToPlace, 0);

        self.postMessage({
            type: "result",
            data: { canFit, iterations }
        });
    } catch (err) {
        self.postMessage({
            type: "error",
            data: { message: err.message }
        });
    }
};
`;
}
