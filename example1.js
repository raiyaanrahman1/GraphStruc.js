let graphDiv = document.getElementById("graph");

// the graphDiv Element must be on the document before calling new GraphStruc
// If you create the element in JS, make sure to append the element to the document body before calling new GraphStruc()
// calling new GraphStruc() will automatically append it to the element passed in
let graph = new GraphStruc(graphDiv);
for(let i = 0; i < 7; i++){
    graph.createVertex(i, "50px");
}
