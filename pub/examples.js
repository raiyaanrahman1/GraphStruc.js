let graphDiv = document.getElementById("graph");

// the graphDiv Element must be on the document before calling new GraphStruc
// If you create the element in JS, make sure to append the element to the document body before calling new GraphStruc()
// calling new GraphStruc() will automatically append it to the element passed in
// This helps the library convert units, and makes it more responsive
// The graphDiv element should be a container for only the GraphStruc, nothing else, since the GraphStruct will take up 100%
// of the element's space 
let graph = new GraphStruc(graphDiv, false, 3);
for(let i = 0; i < 9; i++){
    graph.createVertex(i, "50px", i, "rgb(37, 193, 204)");
}


// DON'T DO:
// graph.createVertex(10000, "50px", ["50px", "50px"]);
// graph.createVertex(10001, "50px", ["1200px", "300px"]);

// DO:
// graph.createVertex(10000, "50px", ["40%", "40%"]);
// graph.createVertex(10001, "5%", ["40%", "46%"]);

// When explicitly specifying the position, you shouldn't specify the position in pixels, since the position is 
// calculated from the top and left of the graph bounding box,
// if the user resizes the window from the bottom or right, the position won't be adjusted.
// So always specify the position in percent.

graph.addEdge(0, 2);
graph.addEdge(0, 6);
graph.addEdge(0, 8);
graph.addEdge(7, 4);
graph.addEdge(4, 5);
// graph.addEdge(10000, 10001);
