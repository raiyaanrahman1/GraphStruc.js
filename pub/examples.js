let graphDiv = document.getElementById("graph");

// the graphDiv Element must be on the document before calling new GraphStruc
// If you create the element in JS, make sure to append the element to the document body before calling new GraphStruc()
// calling new GraphStruc() will automatically append it to the element passed in
// This helps the library convert units, and makes it more responsive
// The graphDiv element should be a container for only the GraphStruc, nothing else, since the GraphStruct will take up 100%
// of the element's space 
let graph = new GraphStruc(graphDiv, false, 3);
for(let i = 0; i < 9; i++){
    graph.createVertex(i, "50px", i, "rgb(37, 193, 204)", true);
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

// graph.animatePath(7, 5);
// graph.addEdge(10000, 10001);

let graph2Div = document.getElementById("graph2");
let graph2 = new GraphStruc(graph2Div, false, 3);
for(let i = 0; i < 9; i++){
    graph2.createVertex(i, "50px", i);
}

// graph2.addEdge(0, 8);
graph2.addEdge(0, 1);
graph2.addEdge(1, 2);
graph2.addEdge(2, 8);
graph2.animatePath(0, 8);

let graph3Div = document.getElementById("graph3");
let graph3 = new GraphStruc(graph3Div, false);
for(let i = 0; i < 9; i++){
    graph3.createVertex(i, "50px", i, "", true);
}

let graph4Div = document.getElementById("graph4");
let graph4 = new GraphStruc(graph4Div, false, 1);
for(let i = 0; i < 9; i++){
    graph4.createVertex(i, "50px", i, "", true);
}

let graph5Div = document.getElementById("graph5");
let graph5 = new GraphStruc(graph5Div, false, 3);
for(let i = 0; i < 9; i++){
    graph5.createVertex(i, "50px");
}
graph5.createVertex(10000, "50px", "", "green", false, ["10%", "20%"]);
graph5.createVertex(10001, "10%", "", "green", false, ["40%", "46%"]);
graph5.createVertex(10002, "3%", "", "green", false, ["85%", "70%"]);

let graph6Div = document.getElementById("graph6");
let graph6 = new GraphStruc(graph6Div, false, 3);
for(let i = 0; i < 9; i++){
    graph6.createVertex(i, "50px");
}
graph6.addEdge(0, 8);

let graph7Div = document.getElementById("graph7");
let graph7 = new GraphStruc(graph7Div, false, 9);
for(let i = 0; i < 9; i++){
    graph7.createVertex(i, "50px", "stop " + i, "yellow");
}

graph7.createVertex(10, "50px", "stop 9", "pink", false, ["45%", "30%"]);
graph7.createVertex(11, "50px", "stop 10", "lightblue", false, ["55%", "30%"]);
graph7.createVertex(12, "50px", "stop 11", "pink", false, ["35%", "20%"]);
graph7.createVertex(13, "50px", "stop 12", "lightblue", false, ["65%", "20%"]);
graph7.createVertex(14, "50px", "stop 13", "lightgreen", false, ["50%", "65%"]);
graph7.createVertex(15, "50px", "stop 14", "lightgreen", false, ["50%", "75%"]);
graph7.createVertex(16, "50px", "stop 15", "lightgreen", false, ["50%", "95%"]);

graph7.addEdge(0, 1);
graph7.addEdge(1, 2);
graph7.addEdge(2, 3);
graph7.addEdge(3, 4);
graph7.addEdge(4, 5);
graph7.addEdge(5, 6);
graph7.addEdge(6, 7);
graph7.addEdge(7, 8);

graph7.addEdge(12, 10);
graph7.addEdge(10, 4);

graph7.addEdge(11, 4);
graph7.addEdge(11, 13);

graph7.addEdge(4, 14);
graph7.addEdge(14, 15);
graph7.addEdge(15, 16);