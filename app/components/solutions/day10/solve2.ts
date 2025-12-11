import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];
    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());

    let totalPresses = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        steps.push(`Processing row ${lineIdx + 1}: ${line}`);

        // Parse the target values from curly brackets {3,5,4,7}
        const targetMatch = line.match(/\{([^}]+)\}/);
        if (!targetMatch) {
            steps.push(`  Skipping - no target values found in curly brackets`);
            continue;
        }
        const targets = targetMatch[1]
            .split(",")
            .map((n) => parseInt(n.trim()));
        steps.push(`  Target values: [${targets.join(", ")}]`);

        // Parse buttons (index groups in parentheses) - between ] and {
        const afterBracket = line.substring(line.indexOf("]") + 1);
        const beforeCurly = afterBracket.split("{")[0];
        const buttonMatches = beforeCurly.match(/\(([^)]+)\)/g) || [];

        const buttons: number[][] = buttonMatches.map((match) => {
            const inside = match.slice(1, -1);
            return inside.split(",").map((n) => parseInt(n.trim()));
        });
        steps.push(
            `  Found ${buttons.length} buttons: ${buttons
                .map((b) => `(${b.join(",")})`)
                .join(" ")}`
        );

        // Find minimum button presses to reach target values
        const result = findMinimumPresses(targets, buttons, steps);

        if (result.totalPresses === -1) {
            steps.push(`  No solution exists for this row!`);
        } else {
            // Format the solution description
            const solutionParts: string[] = [];
            for (let i = 0; i < result.pressCounts.length; i++) {
                if (result.pressCounts[i] > 0) {
                    solutionParts.push(
                        `(${buttons[i].join(",")}) x${result.pressCounts[i]}`
                    );
                }
            }
            steps.push(`  Solution: ${solutionParts.join(", ")}`);
            steps.push(`  Total presses for this row: ${result.totalPresses}`);
            totalPresses += result.totalPresses;
        }
    }

    steps.push(`Total minimum button presses across all rows: ${totalPresses}`);
    return { steps, solution: totalPresses.toString() };
}

function findMinimumPresses(
    targets: number[],
    buttons: number[][],
    steps: string[]
): { totalPresses: number; pressCounts: number[] } {
    const numPositions = targets.length;
    const numButtons = buttons.length;

    // Build a matrix: each row is a position, each column is a button
    // matrix[pos][btn] = 1 if button btn affects position pos, 0 otherwise
    const matrix: number[][] = [];
    for (let pos = 0; pos < numPositions; pos++) {
        matrix[pos] = new Array(numButtons).fill(0);
    }

    for (let btn = 0; btn < numButtons; btn++) {
        for (const pos of buttons[btn]) {
            if (pos >= 0 && pos < numPositions) {
                matrix[pos][btn] = 1;
            }
        }
    }

    steps.push(`  Built ${numPositions}x${numButtons} coefficient matrix`);

    // Sort buttons by how many positions they affect (more positions = more "efficient")
    // This helps us prioritize buttons that contribute to multiple targets
    const buttonEfficiency = buttons.map((b, i) => ({
        idx: i,
        count: b.filter((p) => p >= 0 && p < numPositions).length,
    }));
    buttonEfficiency.sort((a, b) => b.count - a.count);
    const sortedButtonIndices = buttonEfficiency.map((b) => b.idx);

    // Use branch and bound to find the minimum total presses
    const result = branchAndBound(
        matrix,
        [...targets],
        numButtons,
        numPositions,
        sortedButtonIndices,
        steps
    );

    if (result === null) {
        return { totalPresses: -1, pressCounts: [] };
    }

    const total = result.reduce((sum, c) => sum + c, 0);
    return { totalPresses: total, pressCounts: result };
}

function branchAndBound(
    matrix: number[][],
    targets: number[],
    numButtons: number,
    numPositions: number,
    sortedButtonIndices: number[],
    steps: string[]
): number[] | null {
    let bestSolution: number[] | null = null;
    let bestTotal = Infinity;

    const pressCounts = new Array(numButtons).fill(0);
    const currentNeeds = [...targets];

    function search(btnOrderIdx: number, currentTotal: number): void {
        // Pruning: if current total already >= best, stop
        if (currentTotal >= bestTotal) {
            return;
        }

        // Check if all needs are satisfied
        let allSatisfied = true;
        let hasNegative = false;
        for (let pos = 0; pos < numPositions; pos++) {
            if (currentNeeds[pos] < 0) {
                hasNegative = true;
                break;
            }
            if (currentNeeds[pos] > 0) {
                allSatisfied = false;
            }
        }

        if (hasNegative) {
            return; // Invalid state
        }

        if (allSatisfied) {
            // Found a valid solution
            if (currentTotal < bestTotal) {
                bestTotal = currentTotal;
                bestSolution = [...pressCounts];
            }
            return;
        }

        if (btnOrderIdx >= numButtons) {
            return; // No more buttons to try
        }

        const btn = sortedButtonIndices[btnOrderIdx];

        // Calculate max presses for this button (limited by remaining needs)
        let maxPresses = Infinity;
        for (let pos = 0; pos < numPositions; pos++) {
            if (matrix[pos][btn] === 1) {
                maxPresses = Math.min(maxPresses, currentNeeds[pos]);
            }
        }

        if (maxPresses === Infinity || maxPresses < 0) {
            maxPresses = 0;
        }

        // Calculate minimum bound: sum of remaining needs / max buttons that can contribute
        // This helps with pruning
        const minAdditionalNeeded = calculateLowerBound(
            matrix,
            currentNeeds,
            numPositions,
            sortedButtonIndices,
            btnOrderIdx
        );

        if (currentTotal + minAdditionalNeeded >= bestTotal) {
            return; // Prune: can't beat best solution
        }

        // Try different press counts for this button (from max to 0 for better pruning)
        // Starting from higher values tends to find good solutions faster
        for (let presses = maxPresses; presses >= 0; presses--) {
            pressCounts[btn] = presses;

            // Update needs
            for (let pos = 0; pos < numPositions; pos++) {
                if (matrix[pos][btn] === 1) {
                    currentNeeds[pos] -= presses;
                }
            }

            search(btnOrderIdx + 1, currentTotal + presses);

            // Restore needs
            for (let pos = 0; pos < numPositions; pos++) {
                if (matrix[pos][btn] === 1) {
                    currentNeeds[pos] += presses;
                }
            }
        }

        pressCounts[btn] = 0;
    }

    search(0, 0);

    if (bestSolution !== null) {
        steps.push(`  Found optimal solution with ${bestTotal} total presses`);
    }

    return bestSolution;
}

function calculateLowerBound(
    matrix: number[][],
    needs: number[],
    numPositions: number,
    sortedButtonIndices: number[],
    startIdx: number
): number {
    // Simple lower bound: for each position, at least ceil(need / maxContributors) presses
    // This is a relaxation that gives us a minimum bound
    let maxNeed = 0;
    for (let pos = 0; pos < numPositions; pos++) {
        if (needs[pos] > 0) {
            // Count how many remaining buttons can contribute to this position
            let contributors = 0;
            for (let i = startIdx; i < sortedButtonIndices.length; i++) {
                const btn = sortedButtonIndices[i];
                if (matrix[pos][btn] === 1) {
                    contributors++;
                }
            }
            if (contributors === 0 && needs[pos] > 0) {
                return Infinity; // Impossible to satisfy
            }
            // At minimum, we need needs[pos] presses total to satisfy this position
            // but buttons might overlap, so we use max need as a lower bound
            maxNeed = Math.max(maxNeed, needs[pos]);
        }
    }
    // A very loose lower bound - the maximum single position need
    // divided by max possible contribution rate
    return Math.ceil(
        maxNeed / Math.max(1, sortedButtonIndices.length - startIdx)
    );
}
