import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const arrayLength = 100;
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

        const previousIndex = currentIndex;

        if (direction === "R") {
            currentIndex = (currentIndex + indexMovement) % arrayLength;

            let timesCrossed = Math.floor(
                (previousIndex + indexMovement) / arrayLength
            );

            if (currentIndex === 0 && timesCrossed > 0) {
                timesCrossed--;
            }

            if (timesCrossed > 0) {
                result += timesCrossed;
                steps.push(
                    `Passed over index 0 ${timesCrossed} time(s)! Count: ${result}`
                );
            }
        } else if (direction === "L") {
            currentIndex =
                (((currentIndex - indexMovement) % arrayLength) + arrayLength) %
                arrayLength;

            let timesCrossed = 0;

            if (previousIndex === 0) {
                timesCrossed = Math.floor((indexMovement - 1) / arrayLength);
            } else {
                const virtualPosition = previousIndex - indexMovement;

                if (virtualPosition < 0) {
                    const stepsAfterFirstZero = indexMovement - previousIndex;
                    timesCrossed =
                        1 + Math.floor((stepsAfterFirstZero - 1) / arrayLength);
                }
            }

            if (timesCrossed > 0) {
                result += timesCrossed;
                steps.push(
                    `Passed over index 0 ${timesCrossed} time(s)! Count: ${result}`
                );
            }
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
