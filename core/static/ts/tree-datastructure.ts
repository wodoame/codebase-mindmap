import { ExtendedHierarchyNode } from "./tree-test";

/**
 * Node class for representing a single node in the tree
 */
export class TreeNode {
    public name: string;
    public children: TreeNode[];
    public parent: TreeNode | null;
    public HTML: string;
    public id?: string; // optional stable identifier
    constructor(name: string, children: TreeNode[] = [], HTML: string = '', id?: string) {
        this.name = name;
        this.children = children;
        this.parent = null;
        this.HTML = HTML;
        this.id = id;

        // Set parent reference for all children
        this.children.forEach(child => {
            child.parent = this;
        });
    }

    getHTML(): string {
        return this.HTML;
    }

    setHTML(html: string): void {
        this.HTML = html;
    }

    /**
     * Add a child node to this node
     */
    addChild(child: TreeNode): void {
        this.children.push(child);
        child.parent = this;
    }

    /**
     * Remove a child node from this node
     */
    removeChild(child: TreeNode): boolean {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            return true;
        }
        return false;
    }

    /**
     * Check if this node is a leaf (has no children)
     */
    isLeaf(): boolean {
        return this.children.length === 0;
    }

    /**
     * Get the depth of this node (root is depth 0)
     */
    getDepth(): number {
        let depth = 0;
        let current = this.parent;
        while (current !== null) {
            depth++;
            current = current.parent;
        }
        return depth;
    }

    /**
     * Convert this node and its subtree to JSON format
     */
    toJSON(): any {
        const result: any = {
            name: this.name,
            HTML: this.HTML
        };
        if (this.id) result.id = this.id;

        if (this.children.length > 0) {
            result.children = this.children.map(child => child.toJSON());
        }

        return result;
    }
}

/**
 * Tree class for manipulating and traversing nodes
 */
export class Tree {
    public root: TreeNode;

    constructor(root: TreeNode) {
        this.root = root;
    }

    /**
     * Static method to parse JSON data and create a Tree object
     */
    static parse(jsonData: any): Tree {
        const createNode = (nodeData: any): TreeNode => {
            const children: TreeNode[] = [];
            if (nodeData.children && Array.isArray(nodeData.children)) {
                nodeData.children.forEach((childData: any) => {
                    children.push(createNode(childData));
                });
            }
            return new TreeNode(nodeData.name, children, nodeData.HTML || '', nodeData.id);
        };

        const rootNode = createNode(jsonData);
        return new Tree(rootNode);
    }

    // Add this static method to the Tree class
    static fromD3Node(d3Node: ExtendedHierarchyNode): Tree {
        const createNode = (nodeData: ExtendedHierarchyNode): TreeNode => {
            const children: TreeNode[] = [];
            const nodeChildren = nodeData.children || nodeData._children;
            if (nodeChildren && Array.isArray(nodeChildren)) {
                nodeChildren.forEach((childData: ExtendedHierarchyNode) => {
                    children.push(createNode(childData));
                });
            }
            const html = nodeData.data.HTML || '';
            const id = (nodeData.data as any).id; // pass through if present
            return new TreeNode(nodeData.data.name, children, html, id);
        };
        const rootNode = createNode(d3Node);
        return new Tree(rootNode);
    }

    /**
     * Convert the entire tree to JSON format
     */
    toJSON(): any {
        return this.root.toJSON();
    }

    /**
     * Traverse all nodes in the tree using depth-first search
     * Returns an array of all nodes
     */
    getAllNodes(): TreeNode[] {
        const nodes: TreeNode[] = [];
        
        const traverse = (node: TreeNode): void => {
            nodes.push(node);
            node.children.forEach(child => traverse(child));
        };
        
        traverse(this.root);
        return nodes;
    }

    /**
     * Traverse all nodes in breadth-first order
     */
    getAllNodesBFS(): TreeNode[] {
        const nodes: TreeNode[] = [];
        const queue: TreeNode[] = [this.root];

        while (queue.length > 0) {
            const current = queue.shift()!;
            nodes.push(current);
            queue.push(...current.children);
        }

        return nodes;
    }

    /**
     * Find a node by name (returns the first match)
     */
    findNodeByName(name: string): TreeNode | null {
        const search = (node: TreeNode): TreeNode | null => {
            if (node.name === name) {
                return node;
            }
            
            for (const child of node.children) {
                const result = search(child);
                if (result) {
                    return result;
                }
            }
            
            return null;
        };

        return search(this.root);
    }

    /**
     * Find all nodes by name
     */
    findAllNodesByName(name: string): TreeNode[] {
        const matches: TreeNode[] = [];
        
        const search = (node: TreeNode): void => {
            if (node.name === name) {
                matches.push(node);
            }
            
            node.children.forEach(child => search(child));
        };

        search(this.root);
        return matches;
    }

    /**
     * Get all leaf nodes (nodes with no children)
     */
    getLeafNodes(): TreeNode[] {
        return this.getAllNodes().filter(node => node.isLeaf());
    }

    /**
     * Get nodes at a specific depth level
     */
    getNodesAtDepth(depth: number): TreeNode[] {
        return this.getAllNodes().filter(node => node.getDepth() === depth);
    }

    /**
     * Get the maximum depth of the tree
     */
    getMaxDepth(): number {
        let maxDepth = 0;
        
        const traverse = (node: TreeNode, currentDepth: number): void => {
            maxDepth = Math.max(maxDepth, currentDepth);
            node.children.forEach(child => traverse(child, currentDepth + 1));
        };
        
        traverse(this.root, 0);
        return maxDepth;
    }

    /**
     * Count total number of nodes in the tree
     */
    getNodeCount(): number {
        return this.getAllNodes().length;
    }

    /**
     * Print the tree structure to console (for debugging)
     */
    printTree(node: TreeNode = this.root, depth: number = 0): void {
        const indent = '  '.repeat(depth);
        console.log(`${indent}${node.name}`);
        
        node.children.forEach(child => {
            this.printTree(child, depth + 1);
        });
    }

    /**
     * Clone the entire tree
     */
    clone(): Tree {
        return Tree.parse(this.toJSON());
    }
}

// Example usage and demonstration
export function demonstrateUsage(): void {
    // 1. Build tree using constructors (as requested)
    const multipleLayersNode = new TreeNode("Multiple Layers");
    const inputLayerNode = new TreeNode("Input Layer");
    const convLayerNode = new TreeNode("Convolutional Layer");
    const poolingLayerNode = new TreeNode("Pooling Layer");
    const fcLayersNode = new TreeNode("Fully Connected Layers");

    const cnnArchNode = new TreeNode("CNN Architecture", [
        multipleLayersNode, 
        inputLayerNode, 
        convLayerNode, 
        poolingLayerNode, 
        fcLayersNode
    ]);

    const introNode = new TreeNode("Introduction", [cnnArchNode]);

    const forwardPassNode = new TreeNode("Forward Pass");
    const convolutionLayersNode = new TreeNode("Convolution Layers", [forwardPassNode]);
    const activationNode = new TreeNode("Activation Function", [convolutionLayersNode]);

    const rootNode = new TreeNode("Root", [introNode, activationNode]);

    // 2. Form tree by pointing to root node (as requested)
    const tree = new Tree(rootNode);

    // 3. Convert to JSON structure (as requested)
    const jsonOutput = tree.toJSON();
    console.log("Tree as JSON:", JSON.stringify(jsonOutput, null, 2));

    // 4. Parse JSON and create tree (as requested)
    const parsedTree = Tree.parse(jsonOutput);
    console.log("Parsed tree root name:", parsedTree.root.name);

    // Additional demonstrations
    console.log("Total nodes:", tree.getNodeCount());
    console.log("Max depth:", tree.getMaxDepth());
    console.log("Leaf nodes:", tree.getLeafNodes().map(n => n.name));
    
    tree.printTree();
}

// demonstrateUsage();