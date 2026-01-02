// Message types for type safety
export interface WorkerInputMessage {
    type: "start";
    input: string;
}

export interface WorkerLogMessage {
    type: "log";
    message: string;
}

export interface WorkerProgressMessage {
    type: "progress";
    memoEntries: number;
    elapsedMs: number;
}

export interface WorkerCompleteMessage {
    type: "complete";
    validPaths: string; // BigInt as string
    memoEntries: number;
    elapsedMs: number;
    isDAG: boolean;
}

export interface WorkerErrorMessage {
    type: "error";
    message: string;
}

export type WorkerOutputMessage =
    | WorkerLogMessage
    | WorkerProgressMessage
    | WorkerCompleteMessage
    | WorkerErrorMessage;

// Worker context
const ctx: Worker = self as unknown as Worker;

// Handle incoming messages
ctx.onmessage = (event: MessageEvent<WorkerInputMessage>) => {
    if (event.data.type === "start") {
        runPathFinding(event.data.input);
    }
};

function postLog(message: string): void {
    ctx.postMessage({ type: "log", message } as WorkerLogMessage);
}

// function postProgress(memoEntries: number, elapsedMs: number): void {
//     ctx.postMessage({
//         type: "progress",
//         memoEntries,
//         elapsedMs,
//     } as WorkerProgressMessage);
// }

function postComplete(
    validPaths: string,
    memoEntries: number,
    elapsedMs: number,
    isDAG: boolean
): void {
    ctx.postMessage({
        type: "complete",
        validPaths,
        memoEntries,
        elapsedMs,
        isDAG,
    } as WorkerCompleteMessage);
}

function postError(message: string): void {
    ctx.postMessage({ type: "error", message } as WorkerErrorMessage);
}

function runPathFinding(input: string): void {
    const startTime = performance.now();

    try {
        // Parse input and build graph
        const graph: Map<string, string[]> = new Map();
        const lines = input.trim().split("\n");

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
        }

        postLog(`Graph built with ${graph.size} devices`);

        // Validate required devices exist
        let svrExists = false;
        let outExists = false;

        for (const [device, targets] of graph) {
            if (device === "svr") svrExists = true;
            if (targets.includes("out")) outExists = true;
        }

        if (!svrExists || !outExists) {
            postError(
                `Missing required devices: svr=${svrExists}, out=${outExists}`
            );
            return;
        }

        postLog("Found 'svr' as source and 'out' as target");
        postLog("Checking graph structure...");

        // Check if graph is a DAG by detecting cycles
        function hasCycle(): boolean {
            const visited = new Set<string>();
            const recStack = new Set<string>();

            function dfs(node: string): boolean {
                if (recStack.has(node)) return true;
                if (visited.has(node)) return false;

                visited.add(node);
                recStack.add(node);

                const neighbors = graph.get(node) || [];
                for (const neighbor of neighbors) {
                    if (dfs(neighbor)) return true;
                }

                recStack.delete(node);
                return false;
            }

            for (const node of graph.keys()) {
                if (dfs(node)) return true;
            }
            return false;
        }

        const graphHasCycle = hasCycle();
        postLog(`Graph has cycles: ${graphHasCycle}`);

        if (!graphHasCycle) {
            // DAG - use DP with memoization
            postLog("Graph is a DAG - using efficient DP approach");
            postLog("Counting paths that pass through both 'dac' and 'fft'...");

            // memo[node][state] where state = 0 (neither), 1 (dac only), 2 (fft only), 3 (both)
            const memo = new Map<string, bigint>();

            function getKey(node: string, state: number): string {
                return `${node}|${state}`;
            }

            function countPaths(
                node: string,
                hasDac: boolean,
                hasFft: boolean
            ): bigint {
                // Update state based on current node
                const newHasDac = hasDac || node === "dac";
                const newHasFft = hasFft || node === "fft";
                const state = (newHasDac ? 1 : 0) + (newHasFft ? 2 : 0);

                if (node === "out") {
                    // Only count if we have both dac and fft
                    return newHasDac && newHasFft ? 1n : 0n;
                }

                const key = getKey(node, state);
                if (memo.has(key)) {
                    return memo.get(key)!;
                }

                const neighbors = graph.get(node) || [];
                let total = 0n;

                for (const neighbor of neighbors) {
                    total += countPaths(neighbor, newHasDac, newHasFft);
                }

                memo.set(key, total);
                return total;
            }

            const result = countPaths("svr", false, false);
            const endTime = performance.now();

            postComplete(
                result.toString(),
                memo.size,
                endTime - startTime,
                true
            );
        } else {
            // Graph has cycles - this would take too long
            postError(
                "Graph has cycles - cannot use efficient DP approach. " +
                    "Path enumeration would take too long for large graphs."
            );
        }
    } catch (error) {
        postError(error instanceof Error ? error.message : "Unknown error");
    }
}

// Export types for use in solve2.ts
export type {};
