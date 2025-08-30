import { select, tree, hierarchy, HierarchyNode } from "d3";

// Define interfaces
interface Node {
    name: string;
    children?: Node[];
}

// Extend HierarchyNode to include the properties D3 tree needs
interface ExtendedHierarchyNode extends HierarchyNode<Node> {
    id?: string;  // Change to string to match D3's interface
    x0?: number;
    y0?: number;
    _children?: ExtendedHierarchyNode[] | null;
}

// Tree data
const treeData: Node = {
    "name": "Root",
    "children": [
        {
            "name": "Introduction",
            "children": [
                {
                    "name": "CNN Architecture",
                    "children": [
                        { "name": "Multiple Layers" },
                        { "name": "Input Layer" },
                        { "name": "Convolutional Layer" },
                        { "name": "Pooling Layer" },
                        { "name": "Fully Connected Layers" }
                    ]
                }
            ]
        },
        {
            "name": "How Convolutional Layers Work",
            "children": [
                {
                    "name": "Convolution Layers",
                    "children": [
                        { "name": "Forward Pass: Slide filter step-by-step (stride)" }
                    ]
                }
            ]
        }
    ]
};

// Set dimensions and margins
const margin = { top: 20, right: 120, bottom: 20, left: 120 };
const width = 960 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

let i = 0;
const duration = 750;
let root: ExtendedHierarchyNode;

// Create tree layout
const myTree = tree<Node>().size([height, width]);

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Append SVG to container
    const svg = select("#tree-container")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Convert data to hierarchy
    root = hierarchy(treeData, d => d.children) as ExtendedHierarchyNode;
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse after the second level (optional, for interactivity)
    if (root.children) {
        root.children.forEach(collapse);
    }
    update(root);

    // Collapse function
    function collapse(d: ExtendedHierarchyNode): void {
        if (d.children) {
            d._children = d.children as ExtendedHierarchyNode[];
            d._children.forEach(collapse);
            d.children = undefined;  // Use undefined instead of null
        }
    }

    // Update function for drawing the tree
    function update(source: ExtendedHierarchyNode): void {
        // Compute new tree layout
        const treeData = myTree(root);
        const nodes = treeData.descendants() as ExtendedHierarchyNode[];
        const links = treeData.descendants().slice(1) as ExtendedHierarchyNode[];

        // Normalize depth
        nodes.forEach(d => { d.y = d.depth * 180; });

        // Nodes
        const node = svg.selectAll<SVGGElement, ExtendedHierarchyNode>('g.node')
            .data(nodes, (d: ExtendedHierarchyNode) => {
                if (!d.id) {
                    d.id = `node-${++i}`;  // Use string ID
                }
                return d.id;
            });

        // Enter new nodes
        const nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on('click', click);

        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff");

        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", d => d.children || d._children ? -13 : 13)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name)
            .style("fill-opacity", 1e-6);

        // Update nodes
        const nodeUpdate = nodeEnter.merge(node).transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select('circle')
            .attr('r', 10)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff");

        nodeUpdate.select('text')
            .style("fill-opacity", 1);

        // Exit nodes
        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('circle').attr('r', 1e-6);
        nodeExit.select('text').style('fill-opacity', 1e-6);

        // Links
        const link = svg.selectAll<SVGPathElement, ExtendedHierarchyNode>('path.link')
            .data(links, (d: ExtendedHierarchyNode) => {
                if (!d.id) {
                    d.id = `node-${++i}`;
                }
                return d.id;
            });

        const linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', d => {
                const o = { x: source.x0!, y: source.y0! };
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link).transition()
            .duration(duration)
            .attr('d', d => diagonal(
                { x: d.x || 0, y: d.y || 0 }, 
                { x: d.parent?.x || 0, y: d.parent?.y || 0 }
            ));

        link.exit().transition()
            .duration(duration)
            .attr('d', d => {
                const o = { x: source.x!, y: source.y! };
                return diagonal(o, o);
            })
            .remove();

        // Store old positions for transition
        nodes.forEach(d => {
            d.x0 = d.x!;
            d.y0 = d.y!;
        });
    }

    // Diagonal path generator
    function diagonal(s: { x: number; y: number }, d: { x: number; y: number }): string {
        return `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    }

    // Toggle children on click
    function click(event: MouseEvent, d: ExtendedHierarchyNode): void {
        if (d.children) {
            d._children = d.children as ExtendedHierarchyNode[];
            d.children = undefined;  // Use undefined instead of null
        } else {
            d.children = d._children || undefined;  // Handle null case
            d._children = null;
        }
        update(d);
    }
});