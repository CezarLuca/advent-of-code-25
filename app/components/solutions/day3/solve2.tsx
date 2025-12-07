import { SolveResult } from "../../SolutionTemplate";

const NUM_DIGITS = 12;

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const rows = input.trim().split("\n");
    steps.push(`Parsed ${rows.length} rows from input`);

    const digitArrays = rows.map((row, idx) => {
        const digits = row.split("").map((char) => parseInt(char, 10));
        steps.push(`Row ${idx + 1}: ${digits.length} digits`);
        return digits;
    });

    const twelveDigitNumbers: bigint[] = [];

    for (let rowIdx = 0; rowIdx < digitArrays.length; rowIdx++) {
        const digits = digitArrays[rowIdx];
        const selectedDigits: number[] = [];
        let searchStartIndex = 0;

        for (
            let digitPosition = 0;
            digitPosition < NUM_DIGITS;
            digitPosition++
        ) {
            const digitsNeeded = NUM_DIGITS - digitPosition;
            const maxSearchIndex = digits.length - digitsNeeded;

            let maxValue = digits[searchStartIndex];
            let maxIndex = searchStartIndex;

            for (let i = searchStartIndex + 1; i <= maxSearchIndex; i++) {
                if (digits[i] > maxValue) {
                    maxValue = digits[i];
                    maxIndex = i;
                }
                if (maxValue === 9) break;
            }

            selectedDigits.push(maxValue);
            steps.push(
                `Row ${rowIdx + 1}, Digit ${
                    digitPosition + 1
                }: Found ${maxValue} at index ${maxIndex}`
            );

            searchStartIndex = maxIndex + 1;
        }

        const twelveDigitNum = BigInt(selectedDigits.join(""));
        twelveDigitNumbers.push(twelveDigitNum);
        steps.push(`Row ${rowIdx + 1}: Formed number = ${twelveDigitNum}`);
    }

    const result = twelveDigitNumbers.reduce((sum, num) => sum + num, 0n);
    steps.push(`---`);
    steps.push(`12-digit numbers: [${twelveDigitNumbers.join(", ")}]`);
    steps.push(`Final sum: ${result}`);

    return { steps, solution: result.toString() };
}
