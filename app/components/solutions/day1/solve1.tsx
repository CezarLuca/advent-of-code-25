import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const numberArray = Array.from({ length: 100 }, (_, i) => i);
    steps.push("Created array with numbers 0-99");

    let currentIndex = 50;
    steps.push("Initialized currentIndex to 50");

    let result = 0;
    steps.push("Initialized result counter to 0");

    const instructions = input.trim().split("\n");
    steps.push(`Parsed ${instructions.length} instructions`);

    for (const instruction of instructions) {
        if (!instruction.trim()) continue;

        const direction = instruction.charAt(0).toUpperCase();

        const indexMovement = parseInt(instruction.slice(1), 10);

        if (isNaN(indexMovement)) {
            steps.push(`Skipping invalid instruction: ${instruction}`);
            continue;
        }

        if (direction === "R") {
            currentIndex = (currentIndex + indexMovement) % numberArray.length;
        } else if (direction === "L") {
            currentIndex =
                (currentIndex -
                    (indexMovement % numberArray.length) +
                    numberArray.length) %
                numberArray.length;
        }

        steps.push(
            `${direction}${indexMovement} -> currentIndex is now ${currentIndex}`
        );

        if (currentIndex === 0) {
            result++;
            steps.push(`Landed on index 0! Count: ${result}`);
        }
    }

    steps.push(`Final count of times on index 0: ${result}`);

    return { steps, solution: result.toString() };
}
