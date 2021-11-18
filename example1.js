let graphDiv = document.getElementById("graph");

// the graphDiv Element must be on the document before calling new GraphStruc
// If you create the element in JS, make sure to append the element to the document body before calling new GraphStruc()
// calling new GraphStruc() will automatically append it to the element passed in
// This helps the library convert units, and makes it more responsive
// The graphDiv element should be a container for only the GraphStruc, nothing else, since the GraphStruct will take up 100%
// of the element's space 
let graph = new GraphStruc(graphDiv, 3);
for(let i = 0; i < 9; i++){
    graph.createVertex(i, "50px");
}


// DON'T DO:
// graph.createVertex(10000, "50px", ["50px", "50px"]);
// graph.createVertex(10001, "50px", ["1200px", "300px"]);

// DO:
graph.createVertex(10000, "50px", ["5%", "15%"]);
graph.createVertex(10001, "5%", ["95%", "85%"]);

// Shouldn't specify position in pixels for absolute positioning, since the position is calculated from the top and
// left of the graph bounding box, if the user resizes the window from the bottom or right, the position won't be 
// adjusted. So always specify the position
