export interface RowResult {
    rowIndex: number;
    presses: number;
    status: "pending" | "processing" | "done" | "error";
    progress?: string;
    elapsedMs?: number;
}

export interface ProgressCallback {
    (
        rowIndex: number,
        presses: number,
        status: RowResult["status"],
        progress?: string,
        elapsedMs?: number
    ): void;
}

// Detect optimal worker count (use navigator.hardwareConcurrency or default to 4)
function getWorkerCount(): number {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        // Use up to 8 workers, but leave 1-2 cores free for UI
        return Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 8);
    }
    return 4; // Safe default
}

interface WorkerTask {
    lineIdx: number;
    line: string;
    startTime: number;
    resolve: (presses: number) => void;
    reject: (error: Error) => void;
}

interface WorkerInstance {
    worker: Worker;
    busy: boolean;
    currentTask: WorkerTask | null;
}

export async function solveAsync(
    input: string,
    onProgress: ProgressCallback,
    signal?: AbortSignal
): Promise<number> {
    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());

    if (lines.length === 0) return 0;

    const workerCode = getWorkerCode();
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);

    const workerCount = Math.min(getWorkerCount(), lines.length);
    const workers: WorkerInstance[] = [];
    const taskQueue: WorkerTask[] = [];
    const results: Map<number, number> = new Map();

    // Create worker pool
    for (let i = 0; i < workerCount; i++) {
        const worker = new Worker(workerUrl);
        const workerInstance: WorkerInstance = {
            worker,
            busy: false,
            currentTask: null,
        };

        worker.onmessage = (e) => {
            const task = workerInstance.currentTask;
            if (!task) return;

            if (e.data.type === "progress") {
                const elapsed = Date.now() - task.startTime;
                onProgress(
                    task.lineIdx,
                    0,
                    "processing",
                    e.data.message,
                    elapsed
                );
            } else if (e.data.type === "result") {
                const elapsed = Date.now() - task.startTime;
                workerInstance.busy = false;
                workerInstance.currentTask = null;

                if (e.data.presses === -1) {
                    onProgress(task.lineIdx, 0, "error", undefined, elapsed);
                } else {
                    onProgress(
                        task.lineIdx,
                        e.data.presses,
                        "done",
                        undefined,
                        elapsed
                    );
                }
                task.resolve(e.data.presses);

                // Process next task in queue
                processNextTask(workerInstance);
            } else if (e.data.type === "error") {
                const elapsed = Date.now() - task.startTime;
                workerInstance.busy = false;
                workerInstance.currentTask = null;
                onProgress(task.lineIdx, 0, "error", undefined, elapsed);
                task.resolve(-1);

                processNextTask(workerInstance);
            }
        };

        worker.onerror = () => {
            const task = workerInstance.currentTask;
            if (task) {
                const elapsed = Date.now() - task.startTime;
                workerInstance.busy = false;
                workerInstance.currentTask = null;
                onProgress(task.lineIdx, 0, "error", undefined, elapsed);
                task.reject(new Error("Worker error"));
            }
        };

        workers.push(workerInstance);
    }

    const processNextTask = (workerInstance: WorkerInstance) => {
        if (signal?.aborted || taskQueue.length === 0) return;

        const task = taskQueue.shift()!;
        workerInstance.busy = true;
        workerInstance.currentTask = task;
        task.startTime = Date.now();
        onProgress(task.lineIdx, 0, "processing", "Starting...", 0);
        workerInstance.worker.postMessage({
            type: "solve",
            line: task.line,
            rowIndex: task.lineIdx,
        });
    };

    // Create promises for all rows
    const rowPromises: Promise<number>[] = lines.map((line, lineIdx) => {
        return new Promise<number>((resolve, reject) => {
            taskQueue.push({
                lineIdx,
                line,
                startTime: 0,
                resolve: (presses) => {
                    results.set(lineIdx, presses);
                    resolve(presses);
                },
                reject,
            });
        });
    });

    // Handle abort
    if (signal) {
        signal.addEventListener(
            "abort",
            () => {
                // Clear queue and terminate workers
                taskQueue.length = 0;
                workers.forEach((w) => {
                    if (w.currentTask) {
                        w.currentTask.reject(new Error("Aborted"));
                    }
                    w.worker.terminate();
                });
            },
            { once: true }
        );
    }

    // Start initial tasks on available workers
    workers.forEach((workerInstance) => {
        processNextTask(workerInstance);
    });

    // Wait for all rows to complete
    try {
        await Promise.all(rowPromises);
    } catch (e) {
        // Cleanup on error
        workers.forEach((w) => w.worker.terminate());
        URL.revokeObjectURL(workerUrl);
        throw e;
    }

    // Cleanup
    workers.forEach((w) => w.worker.terminate());
    URL.revokeObjectURL(workerUrl);

    // Sum up results
    let totalPresses = 0;
    for (let i = 0; i < lines.length; i++) {
        const presses = results.get(i) ?? 0;
        if (presses > 0) {
            totalPresses += presses;
        }
    }

    return totalPresses;
}

function getWorkerCode(): string {
    return `
let iterationCount = 0;
let lastProgressTime = 0;
let startTime = 0;
let bestFound = Infinity;

function reportProgress(msg) {
    const now = Date.now();
    if (now - lastProgressTime > 250) {
        const elapsed = ((now - startTime) / 1000).toFixed(1);
        self.postMessage({ type: "progress", message: msg + " [" + elapsed + "s]" });
        lastProgressTime = now;
    }
}

self.onmessage = function(e) {
    const { line, rowIndex } = e.data;
    iterationCount = 0;
    bestFound = Infinity;
    startTime = Date.now();
    lastProgressTime = startTime;
    
    try {
        const presses = processRow(line);
        self.postMessage({ type: "result", rowIndex, presses });
    } catch (error) {
        self.postMessage({ type: "error", rowIndex, presses: -1, error: error.message });
    }
};

function processRow(line) {
    const targetMatch = line.match(/\\{([^}]+)\\}/);
    if (!targetMatch) return 0;

    const targets = targetMatch[1].split(",").map(n => parseInt(n.trim()));
    const afterBracket = line.substring(line.indexOf("]") + 1);
    const beforeCurly = afterBracket.split("{")[0];
    const buttonMatches = beforeCurly.match(/\\(([^)]+)\\)/g) || [];

    const buttons = buttonMatches.map(match => {
        const inside = match.slice(1, -1);
        return inside.split(",").map(n => parseInt(n.trim()));
    });

    reportProgress("Parsed: " + buttons.length + " buttons, " + targets.length + " positions");
    return solveRow(targets, buttons);
}

function solveRow(targets, buttons) {
    const numPositions = targets.length;
    const numButtons = buttons.length;

    if (numButtons === 0) {
        return targets.every(t => t === 0) ? 0 : -1;
    }

    // Build the matrix: matrix[pos][btn] = 1 if button affects position
    const matrix = [];
    for (let pos = 0; pos < numPositions; pos++) {
        matrix[pos] = new Uint8Array(numButtons);
    }
    for (let btn = 0; btn < numButtons; btn++) {
        for (const pos of buttons[btn]) {
            if (pos >= 0 && pos < numPositions) {
                matrix[pos][btn] = 1;
            }
        }
    }

    // Sort buttons by coverage (most positions first) - helps pruning
    const buttonOrder = [];
    for (let i = 0; i < numButtons; i++) buttonOrder.push(i);
    buttonOrder.sort((a, b) => {
        let countA = 0, countB = 0;
        for (let pos = 0; pos < numPositions; pos++) {
            countA += matrix[pos][a];
            countB += matrix[pos][b];
        }
        return countB - countA; // Most coverage first
    });

    const maxTarget = Math.max(...targets);
    bestFound = maxTarget * numButtons; // Upper bound

    reportProgress("Starting search, upper bound: " + bestFound);

    const remaining = Int32Array.from(targets);
    const result = backtrackSolve(matrix, remaining, buttonOrder, 0, 0, numPositions, numButtons);

    return result === null ? -1 : result;
}

function backtrackSolve(matrix, remaining, buttonOrder, btnIdx, currentSum, numPositions, numButtons) {
    iterationCount++;

    if (iterationCount % 100000 === 0) {
        reportProgress("Iter: " + (iterationCount/1000000).toFixed(2) + "M, best: " + bestFound + ", sum: " + currentSum + ", btn: " + (btnIdx+1) + "/" + numButtons);
    }

    // Prune if we already exceed best
    if (currentSum >= bestFound) {
        return null;
    }

    // Check current state
    let allZero = true;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] < 0) return null; // Invalid state
        if (remaining[pos] > 0) allZero = false;
    }

    // Found a solution
    if (allZero) {
        if (currentSum < bestFound) {
            bestFound = currentSum;
            reportProgress("Found solution: " + currentSum);
        }
        return currentSum;
    }

    // No more buttons to try
    if (btnIdx >= numButtons) {
        return null;
    }

    // Compute lower bound: for each position, how many presses minimum are needed?
    let lowerBound = 0;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] > 0) {
            // Count how many remaining buttons can affect this position
            let contributors = 0;
            for (let i = btnIdx; i < numButtons; i++) {
                contributors += matrix[pos][buttonOrder[i]];
            }
            if (contributors === 0) {
                return null; // This position can never be satisfied
            }
            const bound = Math.ceil(remaining[pos] / contributors);
            if (bound > lowerBound) lowerBound = bound;
        }
    }

    // Prune if lower bound exceeds best
    if (currentSum + lowerBound >= bestFound) {
        return null;
    }

    const btn = buttonOrder[btnIdx];

    // Find max presses allowed for this button (limited by minimum remaining of affected positions)
    let maxPresses = Infinity;
    let affectsAny = false;

    for (let pos = 0; pos < numPositions; pos++) {
        if (matrix[pos][btn] === 1) {
            affectsAny = true;
            if (remaining[pos] < maxPresses) {
                maxPresses = remaining[pos];
            }
        }
    }

    // If this button doesn't affect any position, skip it
    if (!affectsAny) {
        return backtrackSolve(matrix, remaining, buttonOrder, btnIdx + 1, currentSum, numPositions, numButtons);
    }

    if (maxPresses === Infinity) maxPresses = 0;
    
    // Limit by remaining budget
    maxPresses = Math.min(maxPresses, bestFound - currentSum - 1);

    let bestResult = null;

    // Try from high to low (more likely to find good solutions faster for pruning)
    for (let presses = maxPresses; presses >= 0; presses--) {
        // Apply presses
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][btn] === 1) {
                remaining[pos] -= presses;
            }
        }

        const result = backtrackSolve(
            matrix, remaining, buttonOrder, btnIdx + 1,
            currentSum + presses, numPositions, numButtons
        );

        // Restore
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][btn] === 1) {
                remaining[pos] += presses;
            }
        }

        if (result !== null) {
            if (bestResult === null || result < bestResult) {
                bestResult = result;
            }
        }
    }

    return bestResult;
}
`;
}
