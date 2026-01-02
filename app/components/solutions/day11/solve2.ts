import { ProgressUpdate } from "../../SolutionTemplateAsync";

export function solve(
    input: string,
    onProgress: (update: ProgressUpdate) => void,
    signal: AbortSignal
): void {
    const steps: string[] = [];

    steps.push("Starting optimized path computation...");
    onProgress({ steps: [...steps], solution: null, isComplete: false });

    const workerCode = `
        self.onmessage = function(event) {
            if (event.data.type === "start") {
                runPathFinding(event.data.input);
            }
        };

        function runPathFinding(input) {
            const startTime = performance.now();

            try {
                const graph = new Map();
                const lines = input.trim().split("\\n");

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    const [source, targetsStr] = trimmedLine.split(":");
                    const sourceDevice = source.trim();
                    const targetDevices = targetsStr
                        .trim()
                        .split(/\\s+/)
                        .filter((d) => d.length > 0);

                    graph.set(sourceDevice, targetDevices);
                }

                self.postMessage({
                    type: "log",
                    message: "Graph built with " + graph.size + " devices"
                });

                let svrExists = false;
                let outExists = false;

                for (const [device, targets] of graph) {
                    if (device === "svr") svrExists = true;
                    if (targets.includes("out")) outExists = true;
                }

                if (!svrExists || !outExists) {
                    self.postMessage({
                        type: "error",
                        message: "Missing required devices: svr=" + svrExists + ", out=" + outExists,
                    });
                    return;
                }

                self.postMessage({
                    type: "log",
                    message: "Found 'svr' as source and 'out' as target"
                });

                self.postMessage({
                    type: "log",
                    message: "Checking graph structure for cycles..."
                });

                // Check if graph is a DAG by detecting cycles
                function hasCycle() {
                    const visited = new Set();
                    const recStack = new Set();
                    
                    function dfs(node) {
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
                self.postMessage({
                    type: "log",
                    message: graphHasCycle 
                        ? "⚠️ Graph has cycles - this may take longer"
                        : "✓ Graph is a DAG (Directed Acyclic Graph)"
                });

                if (!graphHasCycle) {
                    // DAG - use DP with memoization
                    self.postMessage({
                        type: "log",
                        message: "Using efficient Dynamic Programming approach"
                    });

                    self.postMessage({
                        type: "log",
                        message: "Counting paths from 'svr' → 'out' that visit both 'dac' AND 'fft'..."
                    });
                    
                    // memo[node][state] where state = 0 (neither), 1 (dac only), 2 (fft only), 3 (both)
                    const memo = new Map();
                    
                    function getKey(node, state) {
                        return node + "|" + state;
                    }
                    
                    function countPaths(node, hasDac, hasFft) {
                        // Update state based on current node
                        const newHasDac = hasDac || node === "dac";
                        const newHasFft = hasFft || node === "fft";
                        const state = (newHasDac ? 1 : 0) + (newHasFft ? 2 : 0);
                        
                        if (node === "out") {
                            // Only count if we have both dac and fft
                            return (newHasDac && newHasFft) ? 1n : 0n;
                        }
                        
                        const key = getKey(node, state);
                        if (memo.has(key)) {
                            return memo.get(key);
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
                    
                    self.postMessage({
                        type: "complete",
                        validPaths: result.toString(),
                        memoEntries: memo.size,
                        elapsedMs: endTime - startTime,
                        isDAG: true,
                    });
                } else {
                    // Graph has cycles - cannot efficiently solve
                    self.postMessage({
                        type: "error",
                        message: "Graph has cycles - DP approach not possible. Path enumeration would take too long.",
                    });
                }
            } catch (error) {
                self.postMessage({
                    type: "error",
                    message: error.message || "Unknown error",
                });
            }
        }
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    signal.addEventListener("abort", () => {
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
    });

    worker.onmessage = (event) => {
        const data = event.data;

        if (data.type === "log") {
            steps.push(data.message);
            onProgress({
                steps: [...steps],
                solution: null,
                isComplete: false,
            });
        } else if (data.type === "progress") {
            onProgress({
                steps: [...steps],
                solution: null,
                isComplete: false,
                progress: {
                    memoEntries: data.memoEntries,
                    elapsedMs: data.elapsedMs,
                },
            });
        } else if (data.type === "complete") {
            steps.push(
                `✓ Computation completed in ${data.elapsedMs.toFixed(2)}ms`
            );
            steps.push(`✓ DP cache entries used: ${data.memoEntries}`);
            steps.push(`✓ Valid paths found: ${data.validPaths}`);

            onProgress({
                steps: [...steps],
                solution: data.validPaths,
                isComplete: true,
                progress: {
                    memoEntries: data.memoEntries,
                    elapsedMs: data.elapsedMs,
                    isDAG: data.isDAG,
                },
            });

            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        } else if (data.type === "error") {
            steps.push(`❌ Error: ${data.message}`);
            onProgress({
                steps: [...steps],
                solution: null,
                isComplete: true,
            });

            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        }
    };

    worker.onerror = (error) => {
        steps.push(`❌ Worker error: ${error.message}`);
        onProgress({
            steps: [...steps],
            solution: null,
            isComplete: true,
        });

        worker.terminate();
        URL.revokeObjectURL(workerUrl);
    };

    worker.postMessage({ type: "start", input });
}
