// import { ProgressUpdate } from "../../SolutionTemplateAsync";

// export function solve(
//     input: string,
//     onProgress: (update: ProgressUpdate) => void,
//     signal: AbortSignal
// ): void {
//     const steps: string[] = [];

//     steps.push("Starting Web Worker for path computation...");
//     onProgress({ steps: [...steps], solution: null, isComplete: false });

//     // Create worker using blob URL for Next.js compatibility
//     const workerCode = `
//         self.onmessage = function(event) {
//             if (event.data.type === "start") {
//                 runPathFinding(event.data.input);
//             }
//         };

//         function runPathFinding(input) {
//             const startTime = performance.now();

//             try {
//                 const graph = new Map();
//                 const lines = input.trim().split("\\n");

//                 for (const line of lines) {
//                     const trimmedLine = line.trim();
//                     if (!trimmedLine) continue;

//                     const [source, targetsStr] = trimmedLine.split(":");
//                     const sourceDevice = source.trim();
//                     const targetDevices = targetsStr
//                         .trim()
//                         .split(/\\s+/)
//                         .filter((d) => d.length > 0);

//                     graph.set(sourceDevice, targetDevices);
//                 }

//                 self.postMessage({
//                     type: "log",
//                     message: "Graph built with " + graph.size + " devices"
//                 });

//                 let svrExists = false;
//                 let outExists = false;

//                 for (const [device, targets] of graph) {
//                     if (device === "svr") svrExists = true;
//                     if (targets.includes("out")) outExists = true;
//                 }

//                 if (!svrExists || !outExists) {
//                     self.postMessage({
//                         type: "error",
//                         message: "Missing required devices: svr=" + svrExists + ", out=" + outExists,
//                     });
//                     return;
//                 }

//                 self.postMessage({
//                     type: "log",
//                     message: "Found 'svr' as source and 'out' as target"
//                 });

//                 self.postMessage({
//                     type: "log",
//                     message: "Starting path count from 'svr' to 'out'..."
//                 });

//                 self.postMessage({
//                     type: "log",
//                     message: "Looking for paths that pass through both 'dac' and 'fft'"
//                 });

//                 let validPathCount = 0;
//                 let totalPathsExplored = 0;
//                 let lastUpdateTime = startTime;
//                 const UPDATE_INTERVAL = 50;

//                 function countPaths(current, visited, hasDac, hasFft) {
//                     const newHasDac = hasDac || current === "dac";
//                     const newHasFft = hasFft || current === "fft";

//                     if (current === "out") {
//                         totalPathsExplored++;
//                         if (newHasDac && newHasFft) {
//                             validPathCount++;
//                         }

//                         const now = performance.now();
//                         if (now - lastUpdateTime > UPDATE_INTERVAL) {
//                             lastUpdateTime = now;
//                             self.postMessage({
//                                 type: "progress",
//                                 totalPaths: totalPathsExplored,
//                                 validPaths: validPathCount,
//                                 elapsedMs: now - startTime,
//                             });
//                         }
//                         return;
//                     }

//                     const neighbors = graph.get(current) || [];

//                     for (const neighbor of neighbors) {
//                         if (!visited.has(neighbor)) {
//                             visited.add(neighbor);
//                             countPaths(neighbor, visited, newHasDac, newHasFft);
//                             visited.delete(neighbor);
//                         }
//                     }
//                 }

//                 const visited = new Set(["svr"]);
//                 countPaths("svr", visited, false, false);

//                 const endTime = performance.now();
//                 self.postMessage({
//                     type: "complete",
//                     totalPaths: totalPathsExplored,
//                     validPaths: validPathCount,
//                     elapsedMs: endTime - startTime,
//                 });
//             } catch (error) {
//                 self.postMessage({
//                     type: "error",
//                     message: error.message || "Unknown error",
//                 });
//             }
//         }
//     `;

//     const blob = new Blob([workerCode], { type: "application/javascript" });
//     const workerUrl = URL.createObjectURL(blob);
//     const worker = new Worker(workerUrl);

//     // Handle abort signal
//     signal.addEventListener("abort", () => {
//         worker.terminate();
//         URL.revokeObjectURL(workerUrl);
//     });

//     worker.onmessage = (event) => {
//         const data = event.data;

//         if (data.type === "log") {
//             steps.push(data.message);
//             onProgress({
//                 steps: [...steps],
//                 solution: null,
//                 isComplete: false,
//             });
//         } else if (data.type === "progress") {
//             onProgress({
//                 steps: [...steps],
//                 solution: null,
//                 isComplete: false,
//                 progress: {
//                     totalPaths: data.totalPaths,
//                     validPaths: data.validPaths,
//                     elapsedMs: data.elapsedMs,
//                 },
//             });
//         } else if (data.type === "complete") {
//             steps.push(
//                 `Computation completed in ${(data.elapsedMs / 1000).toFixed(
//                     2
//                 )}s`
//             );
//             steps.push(
//                 `Total paths explored: ${data.totalPaths.toLocaleString()}`
//             );
//             steps.push(
//                 `Valid paths (with dac AND fft): ${data.validPaths.toLocaleString()}`
//             );

//             onProgress({
//                 steps: [...steps],
//                 solution: data.validPaths.toString(),
//                 isComplete: true,
//                 progress: {
//                     totalPaths: data.totalPaths,
//                     validPaths: data.validPaths,
//                     elapsedMs: data.elapsedMs,
//                 },
//             });

//             worker.terminate();
//             URL.revokeObjectURL(workerUrl);
//         } else if (data.type === "error") {
//             steps.push(`Error: ${data.message}`);
//             onProgress({
//                 steps: [...steps],
//                 solution: null,
//                 isComplete: true,
//             });

//             worker.terminate();
//             URL.revokeObjectURL(workerUrl);
//         }
//     };

//     worker.onerror = (error) => {
//         steps.push(`Worker error: ${error.message}`);
//         onProgress({
//             steps: [...steps],
//             solution: null,
//             isComplete: true,
//         });

//         worker.terminate();
//         URL.revokeObjectURL(workerUrl);
//     };

//     // Start the worker
//     worker.postMessage({ type: "start", input });
// }
