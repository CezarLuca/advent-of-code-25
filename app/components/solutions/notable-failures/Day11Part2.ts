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

    // Validate required devices exist
    let svrExists = false;
    let outExists = false;

    for (const [device, targets] of graph) {
        if (device === "svr") {
            svrExists = true;
            steps.push(`Found "svr" as a source device`);
        }
        if (targets.includes("out")) {
            outExists = true;
            steps.push(`Found "out" as a target of device "${device}"`);
        }
    }

    if (!svrExists) {
        steps.push(`Warning: "svr" device not found as a source`);
    }
    if (!outExists) {
        steps.push(`Warning: "out" device not found as a target`);
    }

    // Count all paths from "svr" to "out" using DFS
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

    // Start DFS from "svr"
    steps.push(`Starting path search from "svr" to "out"...`);
    const visited = new Set<string>(["svr"]);
    dfs("svr", ["svr"], visited);

    steps.push(`Found ${allPaths.length} total paths from "svr" to "out"`);

    // Filter paths that contain both "dac" and "fft"
    const validPaths = allPaths.filter((path) => {
        const hasDac = path.includes("dac");
        const hasFft = path.includes("fft");
        return hasDac && hasFft;
    });

    steps.push(`\nAll paths from "svr" to "out":`);
    for (let i = 0; i < allPaths.length; i++) {
        const path = allPaths[i];
        const hasDac = path.includes("dac");
        const hasFft = path.includes("fft");
        const isValid = hasDac && hasFft;
        const marker = isValid ? "✓" : "✗";
        steps.push(
            `  ${marker} Path ${i + 1}: ${path.join(" -> ")} [dac: ${
                hasDac ? "yes" : "no"
            }, fft: ${hasFft ? "yes" : "no"}]`
        );
    }

    steps.push(
        `\nValid paths (containing both "dac" and "fft"): ${validPaths.length}`
    );
    for (let i = 0; i < validPaths.length; i++) {
        steps.push(`  Valid Path ${i + 1}: ${validPaths[i].join(" -> ")}`);
    }

    const result = validPaths.length;

    return { steps, solution: result.toString() };
}
