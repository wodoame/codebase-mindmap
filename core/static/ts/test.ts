import { select, Selection} from "d3";

console.log("D3.js is working!");
// Step 1: Set up SVG dimensions
const width = 800;
const height = 400;

 // Step 2: Create SVG container
const svg: Selection<SVGSVGElement, unknown, HTMLElement, any> = select("#tree-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const nodeData = {
    name: "Root Node",
    x: width / 2,  // Center horizontally
    y: height / 2  // Center vertically
};
const nodeGroup = svg.append("g")
    .attr("class", "node")
    .attr("transform", `translate(${nodeData.x}, ${nodeData.y})`);

// Step 5: Add circle to the node
        nodeGroup.append("circle")
            .attr("r", 50)  // Radius of 20 pixels
            .style("fill", "#lightblue")
            .style("stroke", "#333")
            .style("stroke-width", 2);
        
        // Step 6: Add text label to the node
        nodeGroup.append("text")
            .attr("dy", "0.35em")  // Vertically center the text
            .attr("text-anchor", "middle")  // Horizontally center the text
            .text(nodeData.name);
        
        // Step 7: Add click interaction (optional)
        nodeGroup.on("click", function() {
            console.log("Node clicked!");
            // Change color on click
            select(this).select("circle")
                .style("fill", "#ff6b6b");
        });