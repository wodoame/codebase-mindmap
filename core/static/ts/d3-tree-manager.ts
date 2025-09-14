import { hierarchy } from "d3";
import { ExtendedHierarchyNode, TNode } from "./tree-test";
import { nextNodeId } from "./utils";

/**
 * D3TreeManager - Manages operations on D3 tree structures
 * Provides methods to add and delete nodes while maintaining tree integrity
 */
export class D3TreeManager {
    private updateCallback?: (source: ExtendedHierarchyNode) => void;

    constructor(updateCallback?: (source: ExtendedHierarchyNode) => void) {
        this.updateCallback = updateCallback;
    }

    /**
     * Add a new node as a child of the specified parent
     * @param parent - The parent node to add the child to
     * @param nodeName - Name of the new node
     * @param nodeHTML - Optional HTML content for the node
     * @returns The newly created node
     */
    addNode(parent: ExtendedHierarchyNode, nodeName: string, nodeHTML: string = ''): ExtendedHierarchyNode {
        // Create new node data
        const newNodeData: TNode = {
            name: nodeName,
            HTML: nodeHTML,
            children: []
        };

        // Add to parent's data structure
        if (!parent.data.children) {
            parent.data.children = [];
        }
        parent.data.children.push(newNodeData);

        // Let the update function regenerate the entire hierarchy and layout
        if (this.updateCallback) {
            this.updateCallback(parent);
        }

        // Find the newly added node after the update
        return this.findNodeByName(parent, nodeName) || parent;
    }

    /**
     * Delete a node from the tree
     * @param nodeToDelete - The node to delete
     * @returns True if deletion was successful, false otherwise
     */
    deleteNode(nodeToDelete: ExtendedHierarchyNode): boolean {
        // Cannot delete root node
        if (!nodeToDelete.parent) {
            console.warn('Cannot delete root node');
            return false;
        }

        const parent = nodeToDelete.parent as ExtendedHierarchyNode;
        
        // Remove from parent's data
        if (parent.data.children) {
            const index = parent.data.children.findIndex(child => child.name === nodeToDelete.data.name);
            if (index !== -1) {
                parent.data.children.splice(index, 1);
            }
        }

        // Remove from parent's children array
        if (parent.children) {
            const childIndex = parent.children.findIndex(child => child === nodeToDelete);
            if (childIndex !== -1) {
                parent.children.splice(childIndex, 1);
            }
        }

        // Remove from parent's _children array if collapsed
        if (parent._children) {
            const childIndex = parent._children.findIndex(child => child.data.name === nodeToDelete.data.name);
            if (childIndex !== -1) {
                parent._children.splice(childIndex, 1);
            }
        }

        // Trigger update if callback is provided
        if (this.updateCallback) {
            this.updateCallback(parent);
        }

        return true;
    }

    /**
     * Find a node by name in the tree
     * @param root - Root node to search from
     * @param name - Name of the node to find
     * @returns The found node or null
     */
    findNodeByName(root: ExtendedHierarchyNode, name: string): ExtendedHierarchyNode | null {
        if (root.data.name === name) {
            return root;
        }

        // Search in visible children
        if (root.children) {
            for (const child of root.children) {
                const found = this.findNodeByName(child, name);
                if (found) return found;
            }
        }

        // Search in collapsed children
        if (root._children) {
            for (const child of root._children) {
                const found = this.findNodeByName(child, name);
                if (found) return found;
            }
        }

        return null;
    }

    /**
     * Find a node by its id (searches visible and collapsed children)
     * @param root - Root node to search from
     * @param id - Id to locate
     */
    findNodeById(root: ExtendedHierarchyNode, id: string): ExtendedHierarchyNode | null {
        if ((root.data as any).id === id) return root;
        const children = root.children || root._children;
        if (children) {
            for (const child of children) {
                const found = this.findNodeById(child, id);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Get all nodes in the tree (including collapsed ones)
     * @param root - Root node to traverse from
     * @returns Array of all nodes
     */
    getAllNodes(root: ExtendedHierarchyNode): ExtendedHierarchyNode[] {
        const nodes: ExtendedHierarchyNode[] = [root];

        const traverse = (node: ExtendedHierarchyNode) => {
            // Check both children and _children
            const children = node.children || node._children;
            if (children) {
                children.forEach(child => {
                    nodes.push(child);
                    traverse(child);
                });
            }
        };

        traverse(root);
        return nodes;
    }

    /**
     * Move a node to a new parent
     * @param nodeToMove - The node to move
     * @param newParent - The new parent node
     * @returns True if move was successful
     */
    moveNode(nodeToMove: ExtendedHierarchyNode, newParent: ExtendedHierarchyNode): boolean {
        // Cannot move root node or move to itself/descendants
        if (!nodeToMove.parent || this.isDescendant(newParent, nodeToMove)) {
            return false;
        }

        // Store node data
        const nodeData: TNode = {
            name: nodeToMove.data.name,
            HTML: nodeToMove.data.HTML || '',
            children: nodeToMove.data.children || []
        };

        // Delete from current parent
        if (this.deleteNode(nodeToMove)) {
            // Add to new parent
            this.addNode(newParent, nodeData.name, nodeData.HTML || '');
            return true;
        }

        return false;
    }

    /**
     * Check if a node is a descendant of another node
     * @param ancestor - Potential ancestor node
     * @param descendant - Potential descendant node
     * @returns True if descendant is a child of ancestor
     */
    private isDescendant(ancestor: ExtendedHierarchyNode, descendant: ExtendedHierarchyNode): boolean {
        if (ancestor === descendant) return true;

        const children = ancestor.children || ancestor._children;
        if (children) {
            for (const child of children) {
                if (this.isDescendant(child, descendant)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Set the update callback function
     * @param callback - Function to call when tree structure changes
     */
    setUpdateCallback(callback: (source: ExtendedHierarchyNode) => void): void {
        this.updateCallback = callback;
    }
}
