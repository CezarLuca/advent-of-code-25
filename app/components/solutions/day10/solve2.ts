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

export async function solveAsync(
    input: string,
    onProgress: ProgressCallback,
    signal?: AbortSignal
): Promise<number> {
    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());

    let totalPresses = 0;

    const workerCode = getWorkerCode();
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        if (signal?.aborted) {
            URL.revokeObjectURL(workerUrl);
            throw new Error("Aborted");
        }

        onProgress(lineIdx, 0, "processing", "Starting...", 0);

        const line = lines[lineIdx];
        const rowStartTime = Date.now();

        try {
            const rowPresses = await solveRowInWorker(
                workerUrl,
                line,
                lineIdx,
                signal,
                (progress) => {
                    const elapsed = Date.now() - rowStartTime;
                    onProgress(lineIdx, 0, "processing", progress, elapsed);
                }
            );

            const rowElapsed = Date.now() - rowStartTime;

            if (rowPresses === -1) {
                onProgress(lineIdx, 0, "error", undefined, rowElapsed);
            } else {
                totalPresses += rowPresses;
                onProgress(lineIdx, rowPresses, "done", undefined, rowElapsed);
            }
        } catch (e) {
            if (signal?.aborted) {
                URL.revokeObjectURL(workerUrl);
                throw e;
            }
            console.error(`Row ${lineIdx} error:`, e);
            const rowElapsed = Date.now() - rowStartTime;
            onProgress(lineIdx, 0, "error", undefined, rowElapsed);
        }
    }

    URL.revokeObjectURL(workerUrl);
    return totalPresses;
}

function solveRowInWorker(
    workerUrl: string,
    line: string,
    rowIndex: number,
    signal?: AbortSignal,
    onProgress?: (progress: string) => void
): Promise<number> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(workerUrl);

        const cleanup = () => {
            worker.terminate();
        };

        if (signal) {
            signal.addEventListener(
                "abort",
                () => {
                    cleanup();
                    reject(new Error("Aborted"));
                },
                { once: true }
            );
        }

        worker.onmessage = (e) => {
            if (e.data.type === "progress") {
                onProgress?.(e.data.message);
            } else if (e.data.type === "result") {
                cleanup();
                resolve(e.data.presses);
            } else if (e.data.type === "error") {
                cleanup();
                resolve(-1);
            }
        };

        worker.onerror = (e) => {
            cleanup();
            reject(e);
        };

        worker.postMessage({ type: "solve", line, rowIndex });
    });
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
