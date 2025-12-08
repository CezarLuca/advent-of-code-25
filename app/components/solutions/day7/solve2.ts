import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const rows = input.split("\n").filter((row) => row.length > 0);
    steps.push(`Parsed ${rows.length} rows from input`);

    const symbolRow = rows[rows.length - 1] + " "; // Ensure there's a trailing space for parsing
    const numberRows = rows.slice(0, -1);

    const symbols: string[] = [];
    const columnWidths: number[] = [];

    let i = 0;
    while (i < symbolRow.length) {
        if (symbolRow[i] !== " ") {
            const symbol = symbolRow[i];
            symbols.push(symbol);

            let spaceCount = 0;
            let j = i + 1;
            while (j < symbolRow.length && symbolRow[j] === " ") {
                spaceCount++;
                j++;
            }

            columnWidths.push(spaceCount);
            i = j;
        } else {
            i++;
        }
    }

    steps.push(
        `Found ${symbols.length} symbols: [${symbols
            .map((s) => `"${s}"`)
            .join(", ")}]`
    );
    steps.push(`Column widths: [${columnWidths.join(", ")}]`);

    const numRows = numberRows.length;
    const numColumns = symbols.length;

    const grid: string[][] = [];
    for (let row = 0; row < numRows; row++) {
        const gridRow: string[] = [];
        for (let col = 0; col < numColumns; col++) {
            gridRow.push(" ".repeat(columnWidths[col]));
        }
        grid.push(gridRow);
    }

    for (let rowIdx = 0; rowIdx < numberRows.length; rowIdx++) {
        const row = numberRows[rowIdx];
        let pos = 0;

        for (let col = 0; col < numColumns; col++) {
            const width = columnWidths[col];
            const cell = row.substring(pos, pos + width);
            grid[rowIdx][col] =
                cell.length === width ? cell : cell.padStart(width, " ");
            pos += width + 1; // +1 for the space separator
        }

        steps.push(
            `Row ${rowIdx + 1}: [${grid[rowIdx]
                .map((c) => `"${c}"`)
                .join(", ")}]`
        );
    }

    const maxWidth = Math.max(...columnWidths);
    const newGrid: string[][] = [];
    for (let i = 0; i < maxWidth; i++) {
        newGrid.push([]);
    }

    for (let col = 0; col < numColumns; col++) {
        const width = columnWidths[col];
        for (let charPos = 0; charPos < maxWidth; charPos++) {
            let concatenated = "";
            for (let row = 0; row < numRows; row++) {
                const cell = grid[row][col] || " ".repeat(width);
                concatenated += charPos < width ? cell[charPos] || " " : " ";
            }
            newGrid[charPos].push(concatenated);
        }
    }

    steps.push(`Created transposed grid with ${newGrid.length} rows`);
    for (let i = 0; i < newGrid.length; i++) {
        steps.push(
            `New Row ${i + 1}: [${newGrid[i].map((c) => `"${c}"`).join(", ")}]`
        );
    }

    const numberGrid: number[][] = newGrid.map((row) =>
        row.map((cell, colIdx) => {
            const trimmed = cell.trim();
            if (trimmed === "") {
                // Empty cell - use identity element based on symbol
                const symbol = symbols[colIdx]?.trim() || "+";
                return symbol === "*" ? 1 : 0;
            }
            return parseInt(trimmed, 10);
        })
    );

    steps.push(`Converted to numbers (with appropriate placeholders):`);
    for (let i = 0; i < numberGrid.length; i++) {
        steps.push(`Number Row ${i + 1}: [${numberGrid[i].join(", ")}]`);
    }

    let totalSum = 0;

    for (let col = 0; col < numColumns; col++) {
        const symbol = symbols[col]?.trim() || "+";
        const columnNumbers: number[] = [];

        for (let row = 0; row < numberGrid.length; row++) {
            columnNumbers.push(numberGrid[row][col]);
        }

        let columnResult: number;
        if (symbol === "*") {
            columnResult = columnNumbers.reduce((acc, num) => acc * num, 1);
        } else if (symbol === "+") {
            columnResult = columnNumbers.reduce((acc, num) => acc + num, 0);
        } else {
            columnResult = columnNumbers.reduce((acc, num) => acc + num, 0);
        }

        steps.push(
            `Column ${col + 1}: ${columnNumbers.join(
                ` ${symbol} `
            )} = ${columnResult}`
        );
        totalSum += columnResult;
    }

    steps.push(`Total sum of all column results: ${totalSum}`);

    return { steps, solution: totalSum.toString() };
}
