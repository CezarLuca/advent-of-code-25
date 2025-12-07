import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const rows = input.trim().split("\n");
    steps.push(`Parsed ${rows.length} rows from input`);

    const digitArrays = rows.map((row, idx) => {
        const digits = row.split("").map((char) => parseInt(char, 10));
        steps.push(`Row ${idx + 1}: [${digits.join(", ")}]`);
        return digits;
    });

    const twoDigitNumbers: number[] = [];

    for (let rowIdx = 0; rowIdx < digitArrays.length; rowIdx++) {
        const digits = digitArrays[rowIdx];

        let firstMaxValue = digits[0];
        let firstMaxIndex = 0;

        for (let i = 1; i < digits.length - 1; i++) {
            if (digits[i] > firstMaxValue) {
                firstMaxValue = digits[i];
                firstMaxIndex = i;
            }
            if (firstMaxValue === 9) break;
        }
        steps.push(
            `Row ${
                rowIdx + 1
            }: First largest digit = ${firstMaxValue} at index ${firstMaxIndex}`
        );

        let secondMaxValue = digits[firstMaxIndex + 1];
        let secondMaxIndex = firstMaxIndex + 1;

        for (let i = firstMaxIndex + 2; i < digits.length; i++) {
            if (digits[i] > secondMaxValue) {
                secondMaxValue = digits[i];
                secondMaxIndex = i;
            }
            if (secondMaxValue === 9) break;
        }
        steps.push(
            `Row ${
                rowIdx + 1
            }: Second largest digit = ${secondMaxValue} at index ${secondMaxIndex}`
        );

        const twoDigitNum = firstMaxValue * 10 + secondMaxValue;
        twoDigitNumbers.push(twoDigitNum);
        steps.push(`Row ${rowIdx + 1}: Formed number = ${twoDigitNum}`);
    }

    const result = twoDigitNumbers.reduce((sum, num) => sum + num, 0);
    steps.push(`---`);
    steps.push(`Two-digit numbers: [${twoDigitNumbers.join(", ")}]`);
    steps.push(`Final sum: ${twoDigitNumbers.join(" + ")} = ${result}`);

    return { steps, solution: result.toString() };
}
