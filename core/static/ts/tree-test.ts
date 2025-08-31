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
                        { "name": "Forward Pass" }
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

        nodeEnter.append('rect')
            .attr('class', 'node')
            .attr('width', 1e-6)
            .attr('height', 1e-6)
            .attr('x', 0)
            .attr('y', 0)
            .attr('rx', 5)  // Rounded corners
            .attr('ry', 5)  // Rounded corners
            .style("fill", d => d._children ? "lightsteelblue" : "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", 2);

        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")  // Center text horizontally
            .text(d => d.data.name)
            .style("fill-opacity", 1e-6)
            .style("font-size", "12px")
            .style("font-family", "sans-serif");

        // Update nodes
        const nodeUpdate = nodeEnter.merge(node).transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        // Calculate text dimensions and update rectangles
        nodeUpdate.select('text')
            .style("fill-opacity", 1)
            .each(function(d) {
                const textElement = this as SVGTextElement;
                const bbox = textElement.getBBox();
                const padding = 10;
                const rectWidth = bbox.width + padding * 2;
                const rectHeight = bbox.height + padding;
                
                // Update the rectangle size and position
                select(textElement.parentNode as Element).select('rect')
                    .attr('width', rectWidth)
                    .attr('height', rectHeight)
                    .attr('x', -rectWidth / 2)  // Center horizontally
                    .attr('y', -rectHeight / 2)  // Center vertically
                    .style("fill", d._children ? "lightsteelblue" : "#fff");
            });

        // Exit nodes
        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('rect').attr('width', 1e-6).attr('height', 1e-6);
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
                const sourceRect = getNodeBounds(source);
                const o = { 
                    x: source.x0!, 
                    y: source.y0! + sourceRect.width / 2  // Right edge of source
                };
                return diagonal(o, o);
            });

        const linkUpdate = linkEnter.merge(link).transition()
            .duration(duration)
            .attr('d', d => {
                // Calculate connection points for rectangles
                const childRect = getNodeBounds(d);
                const parentRect = getNodeBounds(d.parent!);
                
                // Connect from right edge of parent to left edge of child
                const sourcePoint = {
                    x: d.parent?.x || 0,
                    y: (d.parent?.y || 0) + parentRect.width / 2  // Right edge of parent
                };
                const targetPoint = {
                    x: d.x || 0,
                    y: (d.y || 0) - childRect.width / 2  // Left edge of child
                };
                
                return diagonal(sourcePoint, targetPoint);
            });

        link.exit().transition()
            .duration(duration)
            .attr('d', d => {
                const sourceRect = getNodeBounds(source);
                const o = { 
                    x: source.x!, 
                    y: source.y! + sourceRect.width / 2  // Right edge of source
                };
                return diagonal(o, o);
            })
            .remove();

        // Store old positions for transition
        nodes.forEach(d => {
            d.x0 = d.x!;
            d.y0 = d.y!;
        });
    }

    // Helper function to get node bounds
    function getNodeBounds(node: ExtendedHierarchyNode): { width: number; height: number } {
        if (!node || !node.data) {
            return { width: 60, height: 30 }; // Default size
        }
        
        // Estimate text width (more accurate would require measuring actual text)
        const textLength = node.data.name.length;
        const charWidth = 7; // Approximate character width in pixels
        const padding = 20; // Total horizontal padding
        const width = Math.max(60, textLength * charWidth + padding);
        const height = 30; // Fixed height for consistency
        
        return { width, height };
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