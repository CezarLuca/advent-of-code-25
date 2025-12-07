import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const sections = input.trim().split(/\n\s*\n/);
    const rangeLines = sections[0].trim().split("\n");

    steps.push(`📋 Found ${rangeLines.length} range(s) to process`);

    const ranges: Array<[number, number]> = [];
    for (const line of rangeLines) {
        const match = line.trim().match(/^(\d+)-(\d+)$/);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            ranges.push([start, end]);
            steps.push(`🎯 Range parsed: ${start}-${end}`);
        } else {
            steps.push(`⚠️ Skipping invalid range line: "${line}"`);
        }
    }

    if (ranges.length === 0) {
        steps.push("❌ No valid ranges found");
        return { steps, solution: null };
    }

    ranges.sort((a, b) => a[0] - b[0]);
    steps.push(
        `📊 Sorted ranges: ${ranges.map(([s, e]) => `${s}-${e}`).join(", ")}`
    );

    const merged: Array<[number, number]> = [];
    let current: [number, number] = [...ranges[0]];

    for (let i = 1; i < ranges.length; i++) {
        const [nextStart, nextEnd] = ranges[i];

        if (current[1] >= nextStart - 1) {
            const oldEnd = current[1];
            current[1] = Math.max(current[1], nextEnd);
            if (current[1] > oldEnd) {
                steps.push(
                    `🔗 Merging ${current[0]}-${oldEnd} with ${nextStart}-${nextEnd} → ${current[0]}-${current[1]}`
                );
            } else {
                steps.push(
                    `🔗 Range ${nextStart}-${nextEnd} is contained within ${current[0]}-${current[1]}`
                );
            }
        } else {
            merged.push(current);
            steps.push(`✅ Finalized range: ${current[0]}-${current[1]}`);
            current = [nextStart, nextEnd];
        }
    }
    merged.push(current);
    steps.push(`✅ Finalized range: ${current[0]}-${current[1]}`);

    steps.push(
        `📦 Merged ranges (${merged.length} total): ${merged
            .map(([s, e]) => `${s}-${e}`)
            .join(", ")}`
    );

    let result = 0;
    for (const [start, end] of merged) {
        const count = end - start + 1;
        result += count;
        steps.push(`🔢 Range ${start}-${end} has ${count} elements`);
    }

    steps.push(`🎄 Total element count: ${result}`);

    return { steps, solution: result.toString() };
}
