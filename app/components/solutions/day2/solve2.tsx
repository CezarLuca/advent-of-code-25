import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const pairs = input
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    steps.push(`📝 Found ${pairs.length} number pairs: ${pairs.join(", ")}`);

    const rangeArrays: string[][] = pairs.map((pair) => {
        const [startStr, endStr] = pair.split("-").map((n) => n.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        const range: string[] = [];
        for (let i = start; i <= end; i++) {
            range.push(String(i));
        }
        steps.push(`🔢 Range "${pair}" → [${range.join(", ")}]`);
        return range;
    });

    const isRepeatingPattern = (str: string): boolean => {
        if (str.length < 2) return false;

        for (let patternLen = 1; patternLen <= str.length / 2; patternLen++) {
            if (str.length % patternLen !== 0) continue;

            // Redundant with the loop condition
            // const repeatCount = str.length / patternLen;
            // if (repeatCount < 2) continue;

            const pattern = str.substring(0, patternLen);
            let isValid = true;

            for (let i = patternLen; i < str.length; i += patternLen) {
                if (str.substring(i, i + patternLen) !== pattern) {
                    isValid = false;
                    break;
                }
            }

            if (isValid) return true;
        }

        return false;
    };

    const matchingNumInArrays: string[][] = rangeArrays.map((arr, idx) => {
        const filtered = arr.filter((s) => isRepeatingPattern(s));
        steps.push(
            `🔄 Array ${idx + 1}: Matching numbers → [${filtered.join(", ")}]`
        );
        return filtered;
    });

    const result = matchingNumInArrays.reduce((sum, arr) => {
        return sum + arr.reduce((s, str) => s + parseInt(str, 10), 0);
    }, 0);

    steps.push(`🎯 Final arrays: ${JSON.stringify(matchingNumInArrays)}`);
    steps.push(`⭐ Sum of all matching numbers: ${result}`);

    return { steps, solution: result.toString() };
}
