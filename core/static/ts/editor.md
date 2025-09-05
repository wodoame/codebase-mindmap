```javascript
// Save to database
const contentToSave = {
  html: getHTML(),        // For display
  json: getJSON(),        // For editing (preserves all formatting)
  text: getText(),        // For search indexing
  updatedAt: new Date()
}

// Later, to restore:
setHTML(savedContent.html)  // or setJSON(savedContent.json)
````