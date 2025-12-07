import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const pairs = input
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    steps.push(`📝 Found ${pairs.length} number pairs: ${pairs.join(", ")}`);

    const validPairs = pairs.filter((pair) => {
        const [start, end] = pair.split("-").map((n) => n.trim());
        const hasLeadingZero =
            (start.length > 1 && start.startsWith("0")) ||
            (end.length > 1 && end.startsWith("0"));
        if (hasLeadingZero) {
            steps.push(`❌ Discarding pair "${pair}" - contains leading zeros`);
        }
        return !hasLeadingZero;
    });
    steps.push(`✅ Valid pairs after filtering: ${validPairs.join(", ")}`);

    const rangeArrays: string[][] = validPairs.map((pair) => {
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

    const evenCharArrays: string[][] = rangeArrays.map((arr, idx) => {
        const filtered = arr.filter((s) => s.length % 2 === 0);
        steps.push(
            `📏 Array ${
                idx + 1
            }: Keeping even-length numbers → [${filtered.join(", ")}]`
        );
        return filtered;
    });

    const palindromicArrays: string[][] = evenCharArrays.map((arr, idx) => {
        const filtered = arr.filter((s) => {
            const half = s.length / 2;
            const firstHalf = s.substring(0, half);
            const secondHalf = s.substring(half);
            return firstHalf === secondHalf;
        });
        steps.push(
            `🔄 Array ${
                idx + 1
            }: Keeping matching-half numbers → [${filtered.join(", ")}]`
        );
        return filtered;
    });

    const result = palindromicArrays.reduce((sum, arr) => {
        return sum + arr.reduce((s, str) => s + parseInt(str, 10), 0);
    }, 0);

    steps.push(`🎯 Final arrays: ${JSON.stringify(palindromicArrays)}`);
    steps.push(`⭐ Sum of all remaining numbers: ${result}`);

    return { steps, solution: result.toString() };
}
