import { SolveResult } from "../../SolutionTemplate";

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const graph: Map<string, string[]> = new Map();
    const lines = input.trim().split("\n");

    steps.push(`Parsing ${lines.length} lines of input...`);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        const [source, targetsStr] = trimmedLine.split(":");
        const sourceDevice = source.trim();
        const targetDevices = targetsStr
            .trim()
            .split(/\s+/)
            .filter((d) => d.length > 0);

        graph.set(sourceDevice, targetDevices);
        steps.push(
            `Device "${sourceDevice}" connects to: ${targetDevices.join(", ")}`
        );
    }

    steps.push(`Graph built with ${graph.size} devices`);

    let youExists = false;
    let outExists = false;

    for (const [device, targets] of graph) {
        if (targets.includes("you")) {
            steps.push(`Found "you" as a target of device "${device}"`);
        }
        if (device === "you") {
            youExists = true;
            steps.push(`Found "you" as a source device`);
        }
        if (targets.includes("out")) {
            outExists = true;
            steps.push(`Found "out" as a target of device "${device}"`);
        }
    }

    if (!youExists) {
        steps.push(`Warning: "you" device not found as a source`);
    }
    if (!outExists) {
        steps.push(`Warning: "out" device not found as a target`);
    }

    // Count all paths from "you" to "out" using DFS
    const allPaths: string[][] = [];

    function dfs(current: string, path: string[], visited: Set<string>): void {
        if (current === "out") {
            allPaths.push([...path]);
            return;
        }

        // Get neighbors of current device
        const neighbors = graph.get(current) || [];

        for (const neighbor of neighbors) {
            // Avoid cycles by checking visited nodes
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                path.push(neighbor);
                dfs(neighbor, path, visited);
                path.pop();
                visited.delete(neighbor);
            }
        }
    }

    // Start DFS from "you"
    steps.push(`Starting path search from "you" to "out"...`);
    const visited = new Set<string>(["you"]);
    dfs("you", ["you"], visited);

    steps.push(`Found ${allPaths.length} paths from "you" to "out":`);
    for (let i = 0; i < allPaths.length; i++) {
        steps.push(`  Path ${i + 1}: ${allPaths[i].join(" -> ")}`);
    }

    const result = allPaths.length;

    return { steps, solution: result.toString() };
}
