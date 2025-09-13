# Converting the D3 Hierarchy to the Custom `Tree` Structure

The UI uses a D3 hierarchy for layout, animation, and expand / collapse behavior, but persistence (saving to the database) relies on a simpler custom `Tree` class. Converting the live D3 structure into the custom form lets you:

- Store the entire mind map (or a subtree) as JSON in `MindMap.data`.
- Strip away visualization‑only state (positions, `_children` collapsed buffers, etc.).
- Perform server‑side logic without depending on D3 internals.
- Potentially diff versions or export branches cleanly.

---

## When to Convert

| Scenario | Use |
|----------|-----|
| Save full current mind map | `getFullTree()` |
| Export / duplicate a branch | `convertD3TreeToTreeStructure(d3Node)` |
| Send data to API on manual save | `getFullTree()` |
| Snapshot before risky edits | `getFullTree()` (serialize) |

---

## Functions

### `getFullTree()`

Returns the root-level custom `Tree` instance derived from the in‑memory D3 hierarchy. Collapsed nodes are still included in the data (collapse is UI-only).

### `convertD3TreeToTreeStructure(d3Root: ExtendedHierarchyNode)`

Creates a *new* `Tree` object from any D3 node (root or descendant). Useful for exporting or cloning subtrees without touching the whole structure.

---

## Example (Browser Console)

```js
// Full tree for persistence
const fullTree = getFullTree();
console.log(JSON.stringify(fullTree.toJSON(), null, 2));

// Subtree (assuming you have a reference to some D3 node `node`)
const branch = convertD3TreeToTreeStructure(node);
console.log(branch.toJSON());
```

---

## Example JSON Shape

```json
{
  "name": "Root",
  "children": [
    { "name": "Section A", "children": [] },
    { "name": "Section B", "children": [
      { "name": "Topic 1", "children": [] }
    ] }
  ]
}
```

If nodes contain extra fields (e.g. `HTML`), ensure `Tree.toJSON()` (or equivalent) keeps them.

---

## Quick Save Pattern

```js
async function saveMindMap(id = 1) {
  const treePayload = getFullTree().toJSON();
  await fetch(`/api/mindmaps/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: treePayload })
  });
}
```

---

## Performance Notes

- Avoid converting on every keystroke; batch on explicit save or debounce.
- Conversion is linear in number of nodes, but large trees (thousands of nodes) may warrant incremental or diff-based strategies.
- Collapsed vs expanded does not change the exported structure; you always get the logical tree.

---

## Potential Future Enhancements

- Store stable UUIDs per node to track renames reliably.
- Diff-based persistence (send only changed branches).
- Lazy-load deep subtrees from the backend when expanding.
- Maintain a change journal for undo/redo instead of full snapshots.

---

## Summary

Use `getFullTree()` for full persistence and `convertD3TreeToTreeStructure(node)` for branch-level operations. This separation keeps rendering concerns (D3) decoupled from storage and business logic (custom `Tree`).
