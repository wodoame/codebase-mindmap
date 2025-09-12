import { select, tree, hierarchy, HierarchyNode } from "d3";
import { TreeNode, Tree} from "./tree-datastructure";
import { getEditorModal} from "./modals";
import { D3TreeManager } from "./d3-tree-manager";
import { fetchJSONData } from "./utils";

// Define interfaces
export interface TNode {
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

// const cnnArchNode = new TreeNode("CNN Architecture",
//      [
//         new TreeNode("Multiple Layers"),
//         new TreeNode("Input Layer"), 
//         new TreeNode("Convolutional Layer"),
//         new TreeNode("Pooling Layer"), 
//         new TreeNode("Fully Connected Layers")
//      ]);
// const activationFxnNode = new TreeNode("Activation Function", [
//     new TreeNode("ReLU"),
//     new TreeNode("Sigmoid"),
//     new TreeNode("Tanh")
// ]);
// const introductionNode = new TreeNode("Introduction", [cnnArchNode]);
// const rootNode = new TreeNode("Root", [introductionNode, activationFxnNode]);

// Tree data
async function getTreeData() {
    const treeData = await fetchJSONData('/api/mindmaps/1/');
    console.log("Fetched tree data:", treeData);
    return treeData.data;
}

// Set dimensions and margins
const margin = { top: 20, right: 120, bottom: 20, left: 120 };
const width = 960 - margin.right - margin.left;
const height = 500 - margin.top - margin.bottom;

let i = 0;
const duration = 750;
let root: ExtendedHierarchyNode;
let shouldRegenerateHierarchy = false;

// Layout configuration constants
const LEVEL_WIDTH = 200;              // Horizontal distance per depth level
const NODE_VERTICAL_GAP = 55;         // Minimum vertical gap between adjacent nodes

// Create tree layout with fixed node sizing (d3 will position by depth * LEVEL_WIDTH horizontally)
// and custom separation influencing how siblings vs cousins are spaced vertically.
const myTree = tree<TNode>()
    .nodeSize([NODE_VERTICAL_GAP, LEVEL_WIDTH])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

// Create tree manager instance
let treeManager: D3TreeManager;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    // Append SVG to container
    const svg = select("#tree-container")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Convert data to hierarchy
    root = hierarchy(await getTreeData(), d => d.children) as ExtendedHierarchyNode;
    root.x0 = height / 2;
    root.y0 = 0;

    // Initialize tree manager with update callback that regenerates hierarchy
    const updateWithRegeneration = (source: ExtendedHierarchyNode) => {
        shouldRegenerateHierarchy = true;
        update(source);
    };
    
    treeManager = new D3TreeManager(updateWithRegeneration);

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
        // Only regenerate hierarchy if data structure changed (not for expand/collapse)
        if (shouldRegenerateHierarchy) {
            // Store node positions and states before regeneration
            const nodeStates = new Map<string, {
                x0?: number;
                y0?: number;
                isCollapsed: boolean;
                rectWidth?: number;
                rectHeight?: number;
            }>();
            
            // Store all node states
            const storeNodeStates = (node: ExtendedHierarchyNode) => {
                nodeStates.set(node.data.name, {
                    x0: node.x0,
                    y0: node.y0,
                    isCollapsed: !!node._children,
                    rectWidth: node.rectWidth,
                    rectHeight: node.rectHeight
                });
                const children = node.children || node._children;
                if (children) {
                    children.forEach(storeNodeStates);
                }
            };
            storeNodeStates(root);
            
            // Regenerate hierarchy from root data
            const newRoot = hierarchy(root.data, d => d.children) as ExtendedHierarchyNode;
            
            // Restore node states
            const restoreNodeStates = (node: ExtendedHierarchyNode) => {
                const savedState = nodeStates.get(node.data.name);
                if (savedState) {
                    // Restore position and properties
                    node.x0 = savedState.x0;
                    node.y0 = savedState.y0;
                    node.rectWidth = savedState.rectWidth;
                    node.rectHeight = savedState.rectHeight;
                    
                    // Restore collapsed state
                    if (savedState.isCollapsed && node.children) {
                        node._children = node.children as ExtendedHierarchyNode[];
                        node.children = undefined;
                    }
                } else {
                    // New node - set default position from parent or source
                    node.x0 = source.x0 || height / 2;
                    node.y0 = source.y0 || 0;
                }
                
                const children = node.children || node._children;
                if (children) {
                    children.forEach(restoreNodeStates);
                }
            };
            
            // Set root position
            newRoot.x0 = height / 2;
            newRoot.y0 = 0;
            restoreNodeStates(newRoot);
            
            // Update the global root reference
            root = newRoot;
            
            // Reset the flag
            shouldRegenerateHierarchy = false;
        }

        // Compute new tree layout (d3 will assign x = vertical, y = horizontal based on nodeSize & depth)
        const treeData = myTree(root);
        const nodes = treeData.descendants() as ExtendedHierarchyNode[];
        const links = nodes.slice(1) as ExtendedHierarchyNode[];

        // Enforce consistent horizontal spacing based on depth using dynamic width + gap
        const depthWidths: Record<number, number> = {};
        nodes.forEach(n => {
            const w = n.rectWidth || 0;
            depthWidths[n.depth] = Math.max(depthWidths[n.depth] || 0, w);
        });
        const DEPTH_GAP = 180; // base gap between levels
        const cumulativeX: Record<number, number> = {};
        let running = 0;
        Object.keys(depthWidths).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(dStr => {
            const d = parseInt(dStr);
            running += (d === 0 ? 0 : (depthWidths[d-1] || 0) + DEPTH_GAP);
            cumulativeX[d] = running;
        });
        nodes.forEach(n => { n.y = cumulativeX[n.depth]; });

        // Vertically center tree (x axis) after D3 positioning
        const xExtent = [Math.min(...nodes.map(n => n.x!)), Math.max(...nodes.map(n => n.x!))];
        const currentSpan = xExtent[1] - xExtent[0];
        const offset = (height - currentSpan) / 2 - xExtent[0];
        if (isFinite(offset)) nodes.forEach(n => { n.x = (n.x || 0) + offset; });

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
            // Collapsing - hide children
            d._children = d.children as ExtendedHierarchyNode[];
            d.children = undefined;
        } else {
            // Expanding - show children  
            d.children = d._children || undefined;
            d._children = null;
        }
        
        // Don't regenerate hierarchy for expand/collapse - just update layout
        shouldRegenerateHierarchy = false;
        update(d);
    }
});


function convertD3TreeToTreeStructure(d3Root: ExtendedHierarchyNode): Tree {
    return Tree.fromD3Node(d3Root);
}

function getFullTree(): Tree {
    return convertD3TreeToTreeStructure(root);
}

// Tree manipulation functions
function addNodeToTree(parentName: string, nodeName: string, nodeHTML: string = ''): boolean {
    if (!treeManager) return false;
    
    const parentNode = treeManager.findNodeByName(root, parentName);
    if (parentNode) {
        treeManager.addNode(parentNode, nodeName, nodeHTML);
        return true;
    }
    return false;
}

function deleteNodeFromTree(nodeName: string): boolean {
    if (!treeManager) return false;
    
    const nodeToDelete = treeManager.findNodeByName(root, nodeName);
    if (nodeToDelete && nodeToDelete !== root) {
        return treeManager.deleteNode(nodeToDelete);
    }
    return false;
}

function moveNodeInTree(nodeToMoveName: string, newParentName: string): boolean {
    if (!treeManager) return false;
    
    const nodeToMove = treeManager.findNodeByName(root, nodeToMoveName);
    const newParent = treeManager.findNodeByName(root, newParentName);
    
    if (nodeToMove && newParent) {
        return treeManager.moveNode(nodeToMove, newParent);
    }
    return false;
}

function findNodeInTree(nodeName: string): ExtendedHierarchyNode | null {
    if (!treeManager) return null;
    return treeManager.findNodeByName(root, nodeName);
}

// Export functions for external use

export {treeManager, getFullTree}; 
window['getFullTree'] = getFullTree;
window['addNodeToTree'] = addNodeToTree;
window['deleteNodeFromTree'] = deleteNodeFromTree; 
window['moveNodeInTree'] = moveNodeInTree;
window['findNodeInTree'] = findNodeInTree;