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

const NUM_CONNECTIONS = 1000;

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

    if (nodes.length < 3) {
        return { steps, solution: "Need at least 3 nodes" };
    }

    steps.push(`Number of available connections: ${NUM_CONNECTIONS}`);

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

    const selectedConnections = allConnections.slice(0, NUM_CONNECTIONS);
    steps.push(`Selected ${selectedConnections.length} shortest connections:`);
    selectedConnections.forEach((c, idx) => {
        steps.push(
            `  ${idx + 1}. Node ${c.nodeA} <-> Node ${
                c.nodeB
            }: ${c.distance.toFixed(4)}`
        );
    });

    const adjacency: Map<number, Set<number>> = new Map();
    for (let i = 0; i < nodes.length; i++) {
        adjacency.set(i, new Set());
    }

    for (const conn of selectedConnections) {
        adjacency.get(conn.nodeA)!.add(conn.nodeB);
        adjacency.get(conn.nodeB)!.add(conn.nodeA);
    }

    const visited = new Set<number>();
    const components: number[][] = [];

    for (let i = 0; i < nodes.length; i++) {
        if (!visited.has(i)) {
            const component: number[] = [];
            const queue: number[] = [i];

            while (queue.length > 0) {
                const node = queue.shift()!;
                if (visited.has(node)) continue;
                visited.add(node);
                component.push(node);

                for (const neighbor of adjacency.get(node)!) {
                    if (!visited.has(neighbor)) {
                        queue.push(neighbor);
                    }
                }
            }

            components.push(component);
        }
    }

    steps.push(`Found ${components.length} connected components:`);
    components.forEach((comp, idx) => {
        steps.push(
            `  Component ${idx + 1}: [${comp.join(", ")}] (size: ${
                comp.length
            })`
        );
    });

    const networks = components.filter((comp) => comp.length >= 3);
    steps.push(`Networks (components with 3+ nodes): ${networks.length}`);

    if (networks.length < 3) {
        steps.push(
            `Warning: Less than 3 networks found. Using available networks.`
        );
    }

    const ranks = networks.map((n) => n.length).sort((a, b) => b - a);
    steps.push(`Network ranks (sorted by size): [${ranks.join(", ")}]`);

    let result = 1;
    const topRanks = ranks.slice(0, 3);

    if (topRanks.length === 0) {
        steps.push(`No valid networks found!`);
        return { steps, solution: "0" };
    }

    for (const rank of topRanks) {
        result *= rank;
    }

    steps.push(
        `Multiplying top ${topRanks.length} network ranks: ${topRanks.join(
            " × "
        )} = ${result}`
    );

    return { steps, solution: result.toString() };
}
