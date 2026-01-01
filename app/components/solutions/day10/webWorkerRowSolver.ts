// Web Worker for solving rows - standalone file version
// Note: The actual worker code is embedded in solve2.ts as a string for Next.js compatibility
// This file serves as documentation and for potential direct worker usage

interface WorkerMessage {
    type: "solve";
    line: string;
    rowIndex: number;
}

interface WorkerResponse {
    type: "result" | "error" | "progress";
    rowIndex: number;
    presses: number;
    message?: string;
    iterations?: number;
    best?: number;
    currentSum?: number;
    btnIdx?: number;
    numButtons?: number;
}

let iterationCount = 0;
let lastProgressTime = 0;
let startTime = 0;
let bestFound = Infinity;
let currentBtnIdx = 0;
let currentSum = 0;
let totalButtons = 0;

function reportProgress(msg: string, forceReport = false): void {
    const now = Date.now();
    if (forceReport || now - lastProgressTime > 5000) {
        const elapsed = ((now - startTime) / 1000).toFixed(1);
        self.postMessage({
            type: "progress",
            message: msg + " [" + elapsed + "s]",
            iterations: iterationCount,
            best: bestFound,
            currentSum: currentSum,
            btnIdx: currentBtnIdx,
            numButtons: totalButtons,
        } as WorkerResponse);
        lastProgressTime = now;
    }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { line, rowIndex } = e.data;
    iterationCount = 0;
    bestFound = Infinity;
    currentBtnIdx = 0;
    currentSum = 0;
    totalButtons = 0;
    startTime = Date.now();
    lastProgressTime = startTime;

    try {
        const presses = processRow(line);
        self.postMessage({
            type: "result",
            rowIndex,
            presses,
        } as WorkerResponse);
    } catch {
        self.postMessage({
            type: "error",
            rowIndex,
            presses: -1,
        } as WorkerResponse);
    }
};

function processRow(line: string): number {
    const targetMatch = line.match(/\{([^}]+)\}/);
    if (!targetMatch) return 0;

    const targets = targetMatch[1].split(",").map((n) => parseInt(n.trim()));
    const afterBracket = line.substring(line.indexOf("]") + 1);
    const beforeCurly = afterBracket.split("{")[0];
    const buttonMatches = beforeCurly.match(/\(([^)]+)\)/g) || [];

    const buttons: number[][] = buttonMatches.map((match) => {
        const inside = match.slice(1, -1);
        return inside.split(",").map((n) => parseInt(n.trim()));
    });

    reportProgress(
        "Parsed: " +
            buttons.length +
            " buttons, " +
            targets.length +
            " positions"
    );
    return solveRow(targets, buttons);
}

function solveRow(targets: number[], buttons: number[][]): number {
    const numPositions = targets.length;
    const numButtons = buttons.length;

    if (numButtons === 0) {
        return targets.every((t) => t === 0) ? 0 : -1;
    }

    // Build the matrix
    const matrix: Uint8Array[] = [];
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

    // Sort buttons by coverage (most positions first)
    const buttonOrder: number[] = [];
    for (let i = 0; i < numButtons; i++) buttonOrder.push(i);
    buttonOrder.sort((a, b) => {
        let countA = 0,
            countB = 0;
        for (let pos = 0; pos < numPositions; pos++) {
            countA += matrix[pos][a];
            countB += matrix[pos][b];
        }
        return countB - countA;
    });

    const maxTarget = Math.max(...targets);
    bestFound = maxTarget * numButtons;
    totalButtons = numButtons;

    reportProgress("Starting search, upper bound: " + bestFound, true);

    const remaining = Int32Array.from(targets);
    const result = backtrackSolve(
        matrix,
        remaining,
        buttonOrder,
        0,
        0,
        numPositions,
        numButtons
    );

    return result === null ? -1 : result;
}

function backtrackSolve(
    matrix: Uint8Array[],
    remaining: Int32Array,
    buttonOrder: number[],
    btnIdx: number,
    currSum: number,
    numPositions: number,
    numButtons: number
): number | null {
    iterationCount++;
    currentBtnIdx = btnIdx;
    currentSum = currSum;

    if (iterationCount % 100000 === 0) {
        reportProgress(
            "Iter: " +
                (iterationCount / 1000000).toFixed(2) +
                "M, best: " +
                bestFound +
                ", sum: " +
                currSum +
                ", btn: " +
                (btnIdx + 1) +
                "/" +
                numButtons
        );
    }

    if (currSum >= bestFound) {
        return null;
    }

    let allZero = true;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] < 0) return null;
        if (remaining[pos] > 0) allZero = false;
    }

    if (allZero) {
        if (currSum < bestFound) {
            bestFound = currSum;
            reportProgress("Found solution: " + currSum, true);
        }
        return currSum;
    }

    if (btnIdx >= numButtons) {
        return null;
    }

    let lowerBound = 0;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] > 0) {
            let contributors = 0;
            for (let i = btnIdx; i < numButtons; i++) {
                contributors += matrix[pos][buttonOrder[i]];
            }
            if (contributors === 0) {
                return null;
            }
            const bound = Math.ceil(remaining[pos] / contributors);
            if (bound > lowerBound) lowerBound = bound;
        }
    }

    if (currSum + lowerBound >= bestFound) {
        return null;
    }

    const btn = buttonOrder[btnIdx];

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

    if (!affectsAny) {
        return backtrackSolve(
            matrix,
            remaining,
            buttonOrder,
            btnIdx + 1,
            currSum,
            numPositions,
            numButtons
        );
    }

    if (maxPresses === Infinity) maxPresses = 0;
    maxPresses = Math.min(maxPresses, bestFound - currSum - 1);

    let bestResult: number | null = null;

    for (let presses = maxPresses; presses >= 0; presses--) {
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][btn] === 1) {
                remaining[pos] -= presses;
            }
        }

        const result = backtrackSolve(
            matrix,
            remaining,
            buttonOrder,
            btnIdx + 1,
            currSum + presses,
            numPositions,
            numButtons
        );

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
