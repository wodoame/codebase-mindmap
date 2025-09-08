import { select, tree, hierarchy, HierarchyNode } from "d3";
import { TreeNode, Tree} from "./tree-datastructure";
import { getEditorModal} from "./modals";

// Define interfaces
interface TNode {
    name: string;
    HTML?: string;
    children?: TNode[];
}

// Extend HierarchyNode to include the properties D3 tree needs
export interface ExtendedHierarchyNode extends HierarchyNode<TNode> {
    id?: string;  // Change to string to match D3's interface
    x0?: number;
    y0?: number;
    _children?: ExtendedHierarchyNode[] | null;
    rectWidth?: number;  // Store rectangle width
    rectHeight?: number; // Store rectangle height
}

const cnnArchNode = new TreeNode("CNN Architecture",
     [
        new TreeNode("Multiple Layers"),
        new TreeNode("Input Layer"), 
        new TreeNode("Convolutional Layer"),
        new TreeNode("Pooling Layer"), 
        new TreeNode("Fully Connected Layers")
     ]);
const activationFxnNode = new TreeNode("Activation Function", [
    new TreeNode("ReLU"),
    new TreeNode("Sigmoid"),
    new TreeNode("Tanh")
]);
const introductionNode = new TreeNode("Introduction", [cnnArchNode]);
const rootNode = new TreeNode("Root", [introductionNode, activationFxnNode]);

// Tree data
const treeData: TNode = rootNode.toJSON();

// Set dimensions and margins
const margin = { top: 20, right: 120, bottom: 20, left: 120 };
const width = 960 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

let i = 0;
const duration = 750;
let root: ExtendedHierarchyNode;

// Create tree layout
const myTree = tree<TNode>().size([height, width]);

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

        // Normalize depth - ensure consistent horizontal positioning for same-level nodes
        const levelSpacing = 200; // Fixed spacing between levels
        nodes.forEach(d => { 
            d.y = d.depth * levelSpacing; // Override D3's calculated y position with consistent depth-based positioning
        });

        // Align nodes of the same depth vertically with even spacing
        const nodesByDepth: { [depth: number]: ExtendedHierarchyNode[] } = {};
        nodes.forEach(d => {
            if (!nodesByDepth[d.depth]) {
                nodesByDepth[d.depth] = [];
            }
            nodesByDepth[d.depth].push(d);
        });

        // Distribute nodes at each depth level evenly in vertical space
        Object.keys(nodesByDepth).forEach(depthStr => {
            const depth = parseInt(depthStr);
            const nodesAtDepth = nodesByDepth[depth];
            
            if (nodesAtDepth.length === 1) {
                // Single node - center it
                nodesAtDepth[0].x = height / 2;
            } else {
                // Multiple nodes - distribute evenly
                const spacing = height / (nodesAtDepth.length + 1);
                nodesAtDepth.forEach((node, index) => {
                    node.x = spacing * (index + 1);
                });
            }
        });

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
            .attr("transform", d => `translate(${source.y0},${source.x0})`);

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
            .style("stroke-width", 2)
            .on('click', (event, d)=>getEditorModal().show(d)); // Modal click only on rectangle

        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")  // Center text horizontally
            .text(d => d.data.name)
            .style("fill-opacity", 1e-6)
            .style("font-size", "12px")
            .style("font-family", "sans-serif")
            .on('click', (event, d)=>getEditorModal().show(d)); // Modal click on text too

        // Add expand/collapse indicator circle
        nodeEnter.append('circle')
            .attr('class', 'expand-indicator')
            .attr('r', 8)
            .attr('cx', 0)  // Will be positioned after rectangle sizing
            .attr('cy', 0)
            .style('fill', '#fff')
            .style('stroke', '#666')
            .style('stroke-width', 1)
            .style('opacity', d => d._children || d.children ? 1 : 0) // Only show if has children
            .style('cursor', 'pointer')
            .on('click', function(event, d) {
                event.stopPropagation(); // Prevent modal from opening
                click(event, d); // Call the toggle function
            });

        // Add expand/collapse indicator text
        nodeEnter.append('text')
            .attr('class', 'expand-text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#666')
            .style('pointer-events', 'none') // Don't interfere with circle clicks
            .style('opacity', d => d._children || d.children ? 1 : 0)
            .text(d => d._children ? '>' : '<'); // > for collapsed, < for expanded

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
                
                // Store dimensions on the node data
                d.rectWidth = rectWidth;
                d.rectHeight = rectHeight;
                
                // Update the rectangle size and position - align left edges
                select(textElement.parentNode as Element).select('rect')
                    .attr('width', rectWidth)
                    .attr('height', rectHeight)
                    .attr('x', 0)  // Align left edge to node position
                    .attr('y', -rectHeight / 2)  // Center vertically
                    .style("fill", d._children ? "lightsteelblue" : "#fff");

                // Adjust text position to be centered within the left-aligned rectangle
                select(textElement.parentNode as Element).select('text:not(.expand-text)')
                    .attr('x', rectWidth / 2);  // Center text within rectangle

                // Position the expand/collapse indicator circle to the right of rectangle
                const spacing = 5;
                const indicatorX = rectWidth + spacing + 8; // Rectangle width + spacing + circle radius
                
                select(textElement.parentNode as Element).select('.expand-indicator')
                    .attr('cx', indicatorX)
                    .style('opacity', d._children || d.children ? 1 : 0);

                select(textElement.parentNode as Element).select('.expand-text')
                    .attr('x', indicatorX)
                    .style('opacity', d._children || d.children ? 1 : 0)
                    .text(d._children ? '>' : '<');
            });

        // Exit nodes
        const nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select('rect').attr('width', 1e-6).attr('height', 1e-6);
        nodeExit.select('text:not(.expand-text)').style('fill-opacity', 1e-6);
        nodeExit.select('.expand-indicator').style('opacity', 1e-6);
        nodeExit.select('.expand-text').style('opacity', 1e-6);

        // Links - update after a small delay to ensure rectangle dimensions are calculated
        setTimeout(() => {
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
                    // Start from right edge of left-aligned source rectangle
                    const o = { 
                        x: source.x0!, 
                        y: source.y0! + sourceRect.width
                    };
                    return diagonal(o, o);
                });

            const linkUpdate = linkEnter.merge(link).transition()
                .duration(duration)
                .attr('d', d => {
                    // Use stored rectangle dimensions for left-aligned rectangles
                    const parentWidth = d.parent?.rectWidth || 60;
                    
                    // Account for expand indicator circle (radius 8 + spacing 5)
                    const indicatorSpace = 8 + 5;
                    
                    // Connect from past the indicator circle to left edge of child
                    const sourcePoint = {
                        x: d.parent?.x || 0,  // Vertical position
                        y: (d.parent?.y || 0) + parentWidth + indicatorSpace + 8  // Past the indicator circle
                    };
                    const targetPoint = {
                        x: d.x || 0,  // Vertical position  
                        y: d.y || 0   // Left edge of child (at node position since rectangle starts at x=0)
                    };
                    
                    return diagonal(sourcePoint, targetPoint);
                });

            link.exit().transition()
                .duration(duration)
                .attr('d', d => {
                    const sourceRect = getNodeBounds(source);
                    // Collapse to right edge of left-aligned source rectangle
                    const o = { 
                        x: source.x!, 
                        y: source.y! + sourceRect.width
                    };
                    return diagonal(o, o);
                })
                .remove();
        }, 50); // Small delay to ensure rectangles are sized first

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


function convertD3TreeToTreeStructure(d3Root: ExtendedHierarchyNode): Tree {
    return Tree.fromD3Node(d3Root);
}

function getFullTree(): Tree {
    return convertD3TreeToTreeStructure(root);
}

window['getFullTree'] = getFullTree; // just for testing