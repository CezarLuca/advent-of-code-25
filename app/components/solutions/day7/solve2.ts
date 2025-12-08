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
            } else if (charBelow === "^") {
                const leftIdx = colIdx - 1;
                const rightIdx = colIdx + 1;

                if (leftIdx >= 0 && grid[rowIdx][leftIdx] !== "|") {
                    grid[rowIdx][leftIdx] = "|";
                }
                if (leftIdx >= 0) newPipes.add(leftIdx);

                if (
                    rightIdx < grid[rowIdx].length &&
                    grid[rowIdx][rightIdx] !== "|"
                ) {
                    grid[rowIdx][rightIdx] = "|";
                }
                if (rightIdx < grid[rowIdx].length) newPipes.add(rightIdx);
            } else if (charBelow === "|") {
                newPipes.add(colIdx);
            }
        }

        activePipes = newPipes;

        if (activePipes.size === 0) {
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

    const rows = grid.length;
    const cols = grid[0].length;

    const dp: number[][] = Array.from({ length: rows }, () =>
        Array(cols).fill(0)
    );

    if (rows > 1 && grid[1][sIndex] === "|") {
        dp[1][sIndex] = 1;
        steps.push(`Starting path from row 1, column ${sIndex}`);
    }

    for (let row = 1; row < rows - 1; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col] !== "|" || dp[row][col] === 0) continue;

            const currentPaths = dp[row][col];
            const charBelow = grid[row + 1][col];

            if (charBelow === "|") {
                dp[row + 1][col] += currentPaths;
            } else if (charBelow === "^") {
                if (col > 0 && grid[row + 1][col - 1] === "|") {
                    dp[row + 1][col - 1] += currentPaths;
                }
                if (col < cols - 1 && grid[row + 1][col + 1] === "|") {
                    dp[row + 1][col + 1] += currentPaths;
                }
            }
        }
    }

    let result = 0;
    for (let col = 0; col < cols; col++) {
        if (dp[rows - 1][col] > 0) {
            steps.push(
                `Bottom row col ${col}: ${dp[rows - 1][col]} paths reach here`
            );
            result += dp[rows - 1][col];
        }
    }

    steps.push(`Total unique complete paths from S to bottom: ${result}`);

    return { steps, solution: result.toString() };
}
