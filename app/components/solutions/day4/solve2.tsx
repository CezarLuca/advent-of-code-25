import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const lines = input.trim().split("\n");
    const grid = lines.map((line) => line.split(""));
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    steps.push(`Parsed grid: ${rows} rows × ${cols} columns`);

    const directions = [
        [-1, -1], // top-left
        [-1, 0], // top
        [-1, 1], // top-right
        [0, -1], // left
        [0, 1], // right
        [1, -1], // bottom-left
        [1, 0], // bottom
        [1, 1], // bottom-right
    ];

    const countAtNeighbors = (row: number, col: number): number => {
        let count = 0;
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                if (grid[newRow][newCol] === "@") {
                    count++;
                }
            }
        }
        return count;
    };

    const countTotalAt = (): number => {
        return grid.flat().filter((c) => c === "@").length;
    };

    const initialCount = countTotalAt();
    steps.push(`Starting with ${initialCount} '@' symbols`);

    let result = 0;
    let iteration = 0;

    while (true) {
        iteration++;

        const cellsToReplace: {
            row: number;
            col: number;
            neighbors: number;
        }[] = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (grid[row][col] === "@") {
                    const neighborCount = countAtNeighbors(row, col);
                    if (neighborCount < 4) {
                        cellsToReplace.push({
                            row,
                            col,
                            neighbors: neighborCount,
                        });
                    }
                }
            }
        }

        if (cellsToReplace.length === 0) {
            steps.push(`--- Iteration ${iteration} ---`);
            steps.push(`No '@' symbols with < 4 neighbors. Stopping.`);
            break;
        }

        steps.push(`--- Iteration ${iteration} ---`);
        steps.push(
            `Found ${cellsToReplace.length} '@' symbols with < 4 neighbors`
        );

        if (cellsToReplace.length <= 50) {
            for (const cell of cellsToReplace) {
                steps.push(
                    `Replacing @ at (${cell.row}, ${cell.col}) with ${cell.neighbors} neighbor(s)`
                );
            }
        } else {
            steps.push(
                `(Skipping individual logs for ${cellsToReplace.length} cells)`
            );
        }

        for (const cell of cellsToReplace) {
            grid[cell.row][cell.col] = ".";
        }

        result += cellsToReplace.length;

        const remaining = countTotalAt();
        steps.push(
            `Replaced ${cellsToReplace.length} symbols. Remaining '@': ${remaining}`
        );

        if (remaining === 0) {
            steps.push(`All '@' symbols removed.`);
            break;
        }
    }

    steps.push(`---`);
    steps.push(`Completed after ${iteration} iteration(s)`);
    steps.push(`Total '@' symbols replaced: ${result}`);

    return { steps, solution: result.toString() };
}
