import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
        return {
            steps: [
                "Error: Need at least one row of numbers and one row of symbols",
            ],
            solution: null,
        };
    }

    const symbolLine = lines[lines.length - 1];
    const numberLines = lines.slice(0, -1);

    steps.push(`Found ${numberLines.length} number rows and 1 symbol row`);

    const symbols = symbolLine
        .trim()
        .split(/\s+/)
        .filter((s) => ["+", "*"].includes(s));
    steps.push(`Symbols: ${symbols.join(", ")}`);

    const grid: number[][] = [];
    for (let i = 0; i < numberLines.length; i++) {
        const numbers = numberLines[i]
            .trim()
            .split(/\s+/)
            .map((n) => parseInt(n, 10));

        if (numbers.some(isNaN)) {
            return {
                steps: [...steps, `Error: Invalid number in row ${i + 1}`],
                solution: null,
            };
        }

        grid.push(numbers);
        steps.push(`Row ${i + 1}: [${numbers.join(", ")}]`);
    }

    const columnCount = grid[0].length;
    for (let i = 1; i < grid.length; i++) {
        if (grid[i].length !== columnCount) {
            return {
                steps: [
                    ...steps,
                    `Error: Row ${i + 1} has ${
                        grid[i].length
                    } numbers, expected ${columnCount}`,
                ],
                solution: null,
            };
        }
    }

    if (symbols.length !== columnCount) {
        return {
            steps: [
                ...steps,
                `Error: Found ${symbols.length} symbols but ${columnCount} columns`,
            ],
            solution: null,
        };
    }

    steps.push(`Grid validated: ${grid.length} rows × ${columnCount} columns`);

    const columnResults: number[] = [];

    for (let col = 0; col < columnCount; col++) {
        const symbol = symbols[col];
        let result = grid[0][col];

        const operands = [grid[0][col]];

        for (let row = 1; row < grid.length; row++) {
            const value = grid[row][col];
            operands.push(value);

            switch (symbol) {
                case "+":
                    result += value;
                    break;
                case "*":
                    result *= value;
                    break;
            }
        }

        columnResults.push(result);
        steps.push(
            `Column ${col + 1}: ${operands.join(` ${symbol} `)} = ${result}`
        );
    }

    const totalSum = columnResults.reduce((sum, val) => sum + val, 0);
    steps.push(`Final sum: ${columnResults.join(" + ")} = ${totalSum}`);

    return { steps, solution: totalSum.toString() };
}
