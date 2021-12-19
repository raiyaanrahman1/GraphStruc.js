let graphDiv = document.getElementById("graph");

// the graphDiv Element must be on the document before calling new GraphStruc
// If you create the element in JS, make sure to append the element to the document body before calling new GraphStruc()
// calling new GraphStruc() will automatically append it to the element passed in
// This helps the library convert units, and makes it more responsive
// The graphDiv element should be a container for only the GraphStruc, nothing else, since the GraphStruct will take up 100%
// of the element's space 
let graph = new GraphStruc(graphDiv, true, 3);
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
graph.addEdge(8, 6);
graph.addEdge(3, 7);

let stopFunction = graph.animatePath(7, 5);
setTimeout(()=> {
    stopFunction();
}, 13000)

document.getElementById("addVertexForm").addEventListener("submit", (e) => {
    e.preventDefault();

    let key = document.getElementById("key").value;
    let diameter = document.getElementById("diameter").value;
    let red = document.getElementById("red").value;
    let green = document.getElementById("green").value;
    let blue = document.getElementById("blue").value;
    let draggable = document.getElementById("draggable").checked;
    let xPos = document.getElementById("xPos").value;
    let yPos = document.getElementById("yPos").value;
    let position = [xPos, yPos];
    let bgcolour = "";
    let innerHTML = key;

    if(isNaN(diameter) || parseFloat(diameter) <= 0 || parseFloat(diameter) > 100){
        diameter = 5;
    }

    if(isNaN(red) || parseFloat(red) < 0 || parseFloat(red) > 255 || isNaN(green) || parseFloat(green) < 0 || parseFloat(green) > 255 || isNaN(blue) || parseFloat(blue) < 0 || parseFloat(blue) > 255){
        bgcolour = undefined;
    }
    else {
        bgcolour = `rgb(${red}, ${green}, ${blue})`
    }

    if(isNaN(xPos) || isNaN(yPos)){
        position = undefined;
    }
    else {
        xPos += "%";
        yPos += "%";
    }

    diameter += "%";

    try {
        graph.createVertex(key, diameter, innerHTML, bgcolour, draggable);
        document.getElementById("addVertexError").innerHTML = "";
    }
    catch(err) {
        document.getElementById("addVertexError").innerHTML = err;
    }

} );

document.getElementById("addEdgeForm").addEventListener("submit", (e)=>{
    e.preventDefault();

    let key1 = document.getElementById("addEdgeKey1").value;
    let key2 = document.getElementById("addEdgeKey2").value;

    try {
        graph.addEdge(key1, key2);
        document.getElementById("addEdgeError").innerHTML = "";
    }
    catch(err) {
        document.getElementById("addEdgeError").innerHTML = err;
    }
});

document.getElementById("animatePathForm").addEventListener("submit", (e)=>{
    e.preventDefault();

    let key1 = document.getElementById("animatePathKey1").value;
    let key2 = document.getElementById("animatePathKey2").value;

    try {
        graph.animatePath(key1, key2);
        document.getElementById("animatePathError").innerHTML = "";
    }
    catch(err) {
        document.getElementById("animatePathError").innerHTML = err;
    }

});

document.getElementById("changeDirectedness").addEventListener("click", (e)=> {
    e.preventDefault();
    graph.changeDirectedness();
})