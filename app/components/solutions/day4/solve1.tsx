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
        [-1, 1], // top - right
        [0, -1], // left
        [0, 1], // right
        [1, -1], // bottom-left
        [1, 0], // bottom
        [1, 1], //bottom-right
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

    let result = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col] === "@") {
                const neighborCount = countAtNeighbors(row, col);

                if (neighborCount < 4) {
                    result++;
                    steps.push(
                        `Found @ at (${row}, ${col}) with ${neighborCount} neighbor(s) - COUNTED`
                    );
                } else {
                    steps.push(
                        `Found @ at (${row}, ${col}) with ${neighborCount} neighbor(s) - skipped`
                    );
                }
            }
        }
    }

    steps.push(`---`);
    steps.push(`Total "@" symbols with fewer than 4 "@" neighbors: ${result}`);

    return { steps, solution: result.toString() };
}
