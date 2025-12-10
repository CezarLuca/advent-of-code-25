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

        const targetMatch = line.match(/\[([.#]+)\]/);
        if (!targetMatch) {
            steps.push(`  Skipping - no valid pattern found`);
            continue;
        }
        const targetPattern = targetMatch[1];
        const numToggles = targetPattern.length;
        const target = targetPattern.split("").map((c) => (c === "#" ? 1 : 0));
        steps.push(
            `  Target pattern: ${targetPattern} -> [${target.join(",")}]`
        );

        const afterPattern = line.substring(line.indexOf("]") + 1);
        const beforeCurly = afterPattern.split("{")[0];
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

        const minPresses = findMinimumPresses(
            target,
            buttons,
            numToggles,
            steps
        );

        if (minPresses === -1) {
            steps.push(`  No solution exists for this row!`);
        } else {
            steps.push(`  Minimum presses needed: ${minPresses}`);
            totalPresses += minPresses;
        }
    }

    steps.push(`Total minimum button presses: ${totalPresses}`);
    return { steps, solution: totalPresses.toString() };
}

function findMinimumPresses(
    target: number[],
    buttons: number[][],
    numToggles: number,
    steps: string[]
): number {
    const numButtons = buttons.length;

    if (numButtons <= 20) {
        let minPresses = Infinity;
        let bestCombination: number[] | null = null;

        for (let mask = 0; mask < 1 << numButtons; mask++) {
            const state = new Array(numToggles).fill(0);
            let presses = 0;

            for (let b = 0; b < numButtons; b++) {
                if (mask & (1 << b)) {
                    presses++;
                    for (const idx of buttons[b]) {
                        if (idx >= 0 && idx < numToggles) {
                            state[idx] ^= 1;
                        }
                    }
                }
            }

            let matches = true;
            for (let i = 0; i < numToggles; i++) {
                if (state[i] !== target[i]) {
                    matches = false;
                    break;
                }
            }

            if (matches && presses < minPresses) {
                minPresses = presses;
                bestCombination = [];
                for (let b = 0; b < numButtons; b++) {
                    if (mask & (1 << b)) bestCombination.push(b);
                }
            }
        }

        if (bestCombination !== null) {
            steps.push(
                `  Solution: press buttons at indices [${bestCombination.join(
                    ", "
                )}]`
            );
            return minPresses;
        }
        return -1;
    }

    return -1;
}
