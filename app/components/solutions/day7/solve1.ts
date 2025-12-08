import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const lines = input.trim().split("\n");
    const grid: string[][] = lines.map((line) => line.split(""));

    steps.push(`Parsed ${grid.length} rows`);

    const firstRow = grid[0];
    let sIndex = -1;
    for (let i = 0; i < firstRow.length; i++) {
        if (firstRow[i].toLowerCase() === "s") {
            sIndex = i;
            break;
        }
    }

    if (sIndex === -1) {
        return { steps, solution: "No 'S' found in first row" };
    }

    steps.push(`Found 'S' at index ${sIndex} in first row`);

    let activePipes: Set<number> = new Set([sIndex]);

    for (let rowIdx = 1; rowIdx < grid.length; rowIdx++) {
        const newPipes: Set<number> = new Set();

        for (const colIdx of activePipes) {
            if (colIdx < 0 || colIdx >= grid[rowIdx].length) continue;

            const charBelow = grid[rowIdx][colIdx];

            if (charBelow === ".") {
                grid[rowIdx][colIdx] = "|";
                newPipes.add(colIdx);
                steps.push(
                    `Row ${rowIdx}, Col ${colIdx}: Replaced '.' with '|'`
                );
            } else if (charBelow === "^") {
                const leftIdx = colIdx - 1;
                const rightIdx = colIdx + 1;

                if (leftIdx >= 0 && grid[rowIdx][leftIdx] !== "|") {
                    grid[rowIdx][leftIdx] = "|";
                    steps.push(
                        `Row ${rowIdx}, Col ${leftIdx}: Replaced with '|' (left of '^')`
                    );
                }
                if (leftIdx >= 0) newPipes.add(leftIdx);

                if (
                    rightIdx < grid[rowIdx].length &&
                    grid[rowIdx][rightIdx] !== "|"
                ) {
                    grid[rowIdx][rightIdx] = "|";
                    steps.push(
                        `Row ${rowIdx}, Col ${rightIdx}: Replaced with '|' (right of '^')`
                    );
                }
                if (rightIdx < grid[rowIdx].length) newPipes.add(rightIdx);
            } else if (charBelow === "|") {
                newPipes.add(colIdx);
                steps.push(
                    `Row ${rowIdx}, Col ${colIdx}: Already '|', skipped`
                );
            }
        }

        activePipes = newPipes;

        if (activePipes.size === 0) {
            steps.push(`No more active pipes after row ${rowIdx}`);
            break;
        }
    }

    const rowNumWidth = String(grid.length - 1).length;
    steps.push(`Final pattern (${grid.length} rows × ${grid[0].length} cols):`);
    steps.push("─".repeat(rowNumWidth + 3 + grid[0].length));
    grid.forEach((row, idx) => {
        const rowNum = String(idx).padStart(rowNumWidth, " ");
        steps.push(`${rowNum} │ ${row.join("")}`);
    });
    steps.push("─".repeat(rowNumWidth + 3 + grid[0].length));

    let count = 0;
    for (let rowIdx = 0; rowIdx < grid.length - 1; rowIdx++) {
        for (let colIdx = 0; colIdx < grid[rowIdx].length; colIdx++) {
            if (
                grid[rowIdx][colIdx] === "|" &&
                grid[rowIdx + 1][colIdx] === "^"
            ) {
                count++;
                steps.push(
                    `Found '|' at (${rowIdx}, ${colIdx}) with '^' below`
                );
            }
        }
    }

    steps.push(`Total count of '|' with '^' below: ${count}`);

    return { steps, solution: count.toString() };
}
