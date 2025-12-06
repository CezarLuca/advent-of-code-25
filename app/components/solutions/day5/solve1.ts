import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const sections = input.trim().split(/\n\s*\n/);
    if (sections.length < 2) {
        steps.push(
            "❌ Invalid input: expected ranges and numbers separated by an empty line"
        );
        return { steps, solution: null };
    }

    const rangeLines = sections[0].trim().split("\n");
    const numberLines = sections[1].trim().split("\n");

    steps.push(
        `📋 Found ${rangeLines.length} range(s) and ${numberLines.length} number(s)`
    );

    const ranges: Array<[number, number]> = [];
    for (const line of rangeLines) {
        const match = line.trim().match(/^(\d+)-(\d+)$/);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            ranges.push([start, end]);
            steps.push(`🎯 Range parsed: ${start}-${end} (inclusive)`);
        } else {
            steps.push(`⚠️ Skipping invalid range line: "${line}"`);
        }
    }

    steps.push(`📊 Total ranges processed: ${ranges.length}`);

    const isInAnyRange = (num: number): boolean => {
        for (const [start, end] of ranges) {
            if (num >= start && num <= end) {
                return true;
            }
        }
        return false;
    };

    const included: number[] = [];
    const excluded: number[] = [];

    for (const line of numberLines) {
        const num = parseInt(line.trim(), 10);
        if (isNaN(num)) {
            steps.push(`⚠️ Skipping invalid number: "${line}"`);
            continue;
        }

        if (isInAnyRange(num)) {
            included.push(num);
            const matchingRanges = ranges
                .filter(([start, end]) => num >= start && num <= end)
                .map(([start, end]) => `${start}-${end}`);
            steps.push(
                `✅ ${num} is INCLUDED (in range${
                    matchingRanges.length > 1 ? "s" : ""
                }: ${matchingRanges.join(", ")})`
            );
        } else {
            excluded.push(num);
            steps.push(`❌ ${num} is EXCLUDED (not in any range)`);
        }
    }

    steps.push(`📥 Included array: [${included.join(", ")}]`);
    steps.push(`📤 Excluded array: [${excluded.join(", ")}]`);

    const result = included.length;
    steps.push(`🎄 Final count of included numbers: ${result}`);

    return { steps, solution: result.toString() };
}
