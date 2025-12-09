import { SolveResult } from "../../SolutionTemplate";

interface Node {
    id: number;
    x: number;
    y: number;
    z: number;
}

interface Connection {
    nodeA: number;
    nodeB: number;
    distance: number;
}

class UnionFind {
    parent: number[];
    rank: number[];
    componentCount: number;

    constructor(size: number) {
        this.parent = Array.from({ length: size }, (_, i) => i);
        this.rank = new Array(size).fill(0);
        this.componentCount = size;
    }

    find(x: number): number {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: number, y: number): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) {
            return false;
        }

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }

        this.componentCount--;
        return true;
    }

    isFullyConnected(): boolean {
        return this.componentCount === 1;
    }
}

export function solve(input: string): SolveResult {
    const steps: string[] = [];

    const lines = input
        .trim()
        .split("\n")
        .filter((line) => line.trim());
    const nodes: Node[] = [];

    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(",").map((s) => parseFloat(s.trim()));
        if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
            nodes.push({ id: i, x: parts[0], y: parts[1], z: parts[2] });
        }
    }

    steps.push(`Parsed ${nodes.length} nodes from input`);
    nodes.forEach((n) =>
        steps.push(`  Node ${n.id}: (${n.x}, ${n.y}, ${n.z})`)
    );

    if (nodes.length < 2) {
        return { steps, solution: "Need at least 2 nodes" };
    }

    const allConnections: Connection[] = [];

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dz = nodes[j].z - nodes[i].z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            allConnections.push({ nodeA: i, nodeB: j, distance });
        }
    }

    steps.push(
        `Computed ${allConnections.length} possible connections (all pairs)`
    );

    allConnections.sort((a, b) => a.distance - b.distance);
    steps.push(`Sorted connections by distance (ascending)`);

    const uf = new UnionFind(nodes.length);
    let connectionCount = 0;
    let lastConnection: Connection | null = null;

    steps.push(`Starting to build the unified network...`);

    for (const conn of allConnections) {
        if (uf.isFullyConnected()) {
            break;
        }

        const merged = uf.union(conn.nodeA, conn.nodeB);

        if (merged) {
            connectionCount++;
            lastConnection = conn;
            steps.push(
                `  Connection ${connectionCount}: Node ${conn.nodeA} <-> Node ${
                    conn.nodeB
                } (distance: ${conn.distance.toFixed(4)})`
            );

            steps.push(`    Components remaining: ${uf.componentCount}`);
        }
    }

    steps.push(`Network unified after ${connectionCount} connections`);

    if (!lastConnection) {
        steps.push(`Error: No connections were made`);
        return { steps, solution: "No connections" };
    }

    const lastNodeA = lastConnection.nodeA;
    const lastNodeB = lastConnection.nodeB;
    const x1 = nodes[lastNodeA].x;
    const x2 = nodes[lastNodeB].x;

    steps.push(`Last connection that unified the network:`);
    steps.push(`  Node ${lastNodeA}: X = ${x1}`);
    steps.push(`  Node ${lastNodeB}: X = ${x2}`);

    const result = x1 * x2;
    steps.push(`Result: ${x1} × ${x2} = ${result}`);

    return { steps, solution: result.toString() };
}
