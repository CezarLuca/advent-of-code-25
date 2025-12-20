export interface RowResult {
    rowIndex: number;
    presses: number;
    status: "pending" | "processing" | "done" | "error";
}

export interface ProgressCallback {
    (rowIndex: number, presses: number, status: RowResult["status"]): void;
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

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        if (signal?.aborted) {
            throw new Error("Aborted");
        }

        onProgress(lineIdx, 0, "processing");
        await yieldToMain();

        const line = lines[lineIdx];

        const targetMatch = line.match(/\{([^}]+)\}/);
        if (!targetMatch) {
            onProgress(lineIdx, 0, "done");
            continue;
        }

        const targets = targetMatch[1]
            .split(",")
            .map((n) => parseInt(n.trim()));

        const afterBracket = line.substring(line.indexOf("]") + 1);
        const beforeCurly = afterBracket.split("{")[0];
        const buttonMatches = beforeCurly.match(/\(([^)]+)\)/g) || [];

        const buttons: number[][] = buttonMatches.map((match) => {
            const inside = match.slice(1, -1);
            return inside.split(",").map((n) => parseInt(n.trim()));
        });

        try {
            const rowPresses = await solveRowAsync(targets, buttons, signal);

            if (rowPresses === -1) {
                onProgress(lineIdx, 0, "error");
            } else {
                totalPresses += rowPresses;
                onProgress(lineIdx, rowPresses, "done");
            }
        } catch (e) {
            if (signal?.aborted) throw e;
            console.error(`Row ${lineIdx} error:`, e);
            onProgress(lineIdx, 0, "error");
        }
    }

    return totalPresses;
}

function yieldToMain(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function solveRowAsync(
    targets: number[],
    buttons: number[][],
    signal?: AbortSignal
): Promise<number> {
    const numPositions = targets.length;
    const numButtons = buttons.length;

    if (numButtons === 0) {
        return targets.every((t) => t === 0) ? 0 : -1;
    }

    const matrix: number[][] = Array.from({ length: numPositions }, () =>
        Array(numButtons).fill(0)
    );

    for (let btn = 0; btn < numButtons; btn++) {
        for (const pos of buttons[btn]) {
            if (pos >= 0 && pos < numPositions) {
                matrix[pos][btn] = 1;
            }
        }
    }

    const result = await findMinimumPresses(
        matrix,
        targets,
        numPositions,
        numButtons,
        signal
    );

    return result;
}

async function findMinimumPresses(
    matrix: number[][],
    targets: number[],
    numPositions: number,
    numButtons: number,
    signal?: AbortSignal
): Promise<number> {
    const remaining = [...targets];

    const buttonOrder = Array.from({ length: numButtons }, (_, i) => i);
    buttonOrder.sort((a, b) => {
        let countA = 0,
            countB = 0;
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][a] === 1) countA++;
            if (matrix[pos][b] === 1) countB++;
        }
        return countB - countA;
    });

    const maxTarget = Math.max(...targets);
    const upperBound = maxTarget * numButtons;

    let iterationCount = 0;

    const result = await backtrackSolve(
        matrix,
        remaining,
        buttonOrder,
        0,
        0,
        numPositions,
        numButtons,
        upperBound,
        () => {
            iterationCount++;
            return iterationCount % 10000 === 0 && !!signal?.aborted;
        }
    );

    return result === null ? -1 : result;
}

async function backtrackSolve(
    matrix: number[][],
    remaining: number[],
    buttonOrder: number[],
    btnIdx: number,
    currentSum: number,
    numPositions: number,
    numButtons: number,
    bestSoFar: number,
    checkAbort: () => boolean
): Promise<number | null> {
    if (checkAbort()) {
        throw new Error("Aborted");
    }

    if (currentSum >= bestSoFar) {
        return null;
    }

    // Check if solved or invalid
    let allZero = true;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] < 0) {
            return null; // Invalid - went negative
        }
        if (remaining[pos] > 0) {
            allZero = false;
        }
    }

    if (allZero) {
        return currentSum; // Found a solution!
    }

    if (btnIdx >= numButtons) {
        return null; // No more buttons to try
    }

    // Calculate lower bound: for each position, we need at least ceil(remaining/maxContributors)
    let lowerBound = 0;
    for (let pos = 0; pos < numPositions; pos++) {
        if (remaining[pos] > 0) {
            // Count how many remaining buttons can affect this position
            let contributors = 0;
            for (let i = btnIdx; i < numButtons; i++) {
                if (matrix[pos][buttonOrder[i]] === 1) {
                    contributors++;
                }
            }
            if (contributors === 0) {
                return null; // No way to satisfy this position
            }
            lowerBound = Math.max(
                lowerBound,
                Math.ceil(remaining[pos] / contributors)
            );
        }
    }

    if (currentSum + lowerBound >= bestSoFar) {
        return null; // Even best case won't beat current best
    }

    const btn = buttonOrder[btnIdx];

    // Find the maximum presses this button can contribute
    // (limited by the minimum remaining value of positions it affects)
    let maxPresses = Infinity;
    let affectsAny = false;
    for (let pos = 0; pos < numPositions; pos++) {
        if (matrix[pos][btn] === 1) {
            affectsAny = true;
            maxPresses = Math.min(maxPresses, remaining[pos]);
        }
    }

    if (!affectsAny) {
        // This button doesn't affect any position, skip it with 0 presses
        return backtrackSolve(
            matrix,
            remaining,
            buttonOrder,
            btnIdx + 1,
            currentSum,
            numPositions,
            numButtons,
            bestSoFar,
            checkAbort
        );
    }

    if (maxPresses === Infinity) {
        maxPresses = 0;
    }

    // Cap by what we can afford
    maxPresses = Math.min(maxPresses, bestSoFar - currentSum - 1);

    let bestResult: number | null = null;

    // Try from highest to lowest (often finds good solutions faster)
    for (let presses = maxPresses; presses >= 0; presses--) {
        // Apply presses
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][btn] === 1) {
                remaining[pos] -= presses;
            }
        }

        const result = await backtrackSolve(
            matrix,
            remaining,
            buttonOrder,
            btnIdx + 1,
            currentSum + presses,
            numPositions,
            numButtons,
            bestResult !== null ? bestResult : bestSoFar,
            checkAbort
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
