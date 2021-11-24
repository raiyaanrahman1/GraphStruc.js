const LENGTH_REGEX = /^[0-9]+((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(ex)|(vw)|(vh))(?!.)/;
const UNIT_REGEX = /((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(vw)|(vh))/;

// helper method: not to be called by client
function convertToPixel(xMag, xUnit, direction) {
    
    switch(xUnit){
        // absolute units
        case "px":
            return xMag;
        case "in":
            return (xMag*96);
        case "cm":
            return (xMag*96/2.54);
        case "mm":
            return (xMag*96/2.54/10);
        case "pt":
            return (xMag*96/72);
        case "pc":
            return (xMag*16);
        // relative units
        case "%":
            return (xMag / 100) * direction;
        case "rem":
            return (xMag*parseFloat(getComputedStyle(document.documentElement).fontSize));
        case "em":
            return (xMag*parseFloat(getComputedStyle(this.parentElem).fontSize));
        case "vw":
            return (xMag / 100 * window.innerWidth);
        case "vh":
            return (xMag / 100 * window.innerHeight);
    }
    return null;

}


// following two functions from https://www.w3schools.com/tags/att_global_draggable.asp
function allowDrop(ev) {
    ev.preventDefault();
}
  
function drag(ev) {
    ev.dataTransfer.setData("Text", ev.target.id);
}

class GraphStruc {
    constructor(parentElem, directed=false, maxNodesPerRow = Infinity){
        this.parentElem = parentElem;
        this.graphElem = document.createElement("div");
        this.vertices = [];
        this.edges = [];
        this.directed = directed;
        this.numDefaultVert = 0;
        this.graphElem.style = `width: 100%; height: 100%; border: 1px solid;`
        this.width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]); // in pixels
        this.height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]); // in pixels
        this.graphElem.style.position = "relative";
        this.maxNodesPerRow = maxNodesPerRow;

        this.vertContainer = document.createElement("div");
        this.edgesContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.edgesContainer.setAttributeNS(null, "width", this.width);
        this.edgesContainer.setAttributeNS(null, "height", this.height);

        this.graphElem.ondrop = (ev) => {
            var data = ev.dataTransfer.getData("Text");
            let vert;
            for(let vertex of this.vertices){
                if(String(vertex.key) === data){
                    vert = vertex;
                    break;
                }
            }
            let diamMag = convertToPixel(parseFloat(vert.diameter.split(UNIT_REGEX)[0]), vert.diameter.split(UNIT_REGEX)[1], this.width);
            // ev.target.appendChild(document.getElementById(data));
            let newPos = [ev.clientX - this.graphElem.getBoundingClientRect().left - diamMag / 2 + "px", ev.clientY - this.graphElem.getBoundingClientRect().top - diamMag / 2 + "px"];
            vert.updatePosition(newPos);
            console.log(newPos);
            
            for(let edge of this.edges){
                if(edge.v1.key === vert.key || edge.v2.key === vert.key){
                    edge.elem.remove();
                    let intersection = this.detectIntersectionLine(edge);
                    if(!intersection[0]){
                        let line = this.getEdgeElem(edge);
                        this.edgesContainer.append(line);
                        edge.elem = line;
                        edge.straightEdge = true;
                    }
                    else {
                        let curve = this.getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
                        this.edgesContainer.append(curve);
                        edge.elem = curve;
                        edge.straightEdge = false;
                    }
                }
            }

            
        };
        this.graphElem.ondragover = allowDrop;
        
        this.graphElem.append(this.edgesContainer);
        this.graphElem.append(this.vertContainer);


        this.parentElem.append(this.graphElem);
        window.addEventListener("resize", () => {
            this.width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]);
            this.height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]);
            this.edgesContainer.setAttributeNS(null, "width", this.width);
            this.edgesContainer.setAttributeNS(null, "height", this.height);
            let numRows = this.maxNodesPerRow === Infinity ? 1 : Math.ceil(this.numDefaultVert / this.maxNodesPerRow);

            let j = 0;
            for(let i = 0; i < this.vertices.length; i++){
                let diamMag = parseFloat(this.vertices[i].diameter.split(UNIT_REGEX)[0]);

                if(this.vertices[i].isDefault){
                    let rowNum = Math.floor(j / this.maxNodesPerRow);

                    let value = this.maxNodesPerRow === Infinity ? this.numDefaultVert : this.maxNodesPerRow;
        
                    let xPos = (j % this.maxNodesPerRow + 1) / (value + 1) * this.width - diamMag/2;
                    let yPos = (rowNum + 1) / (numRows + 1) * this.height - diamMag / 2;
                    this.vertices[i].updatePosition([xPos + "px", yPos + "px"]);
                    j++;
                }
                else {
                    let [xPos, yPos] = this.vertices[i].positionOriginal;
                    let [xMag, xUnit] = xPos.split(UNIT_REGEX);
                    let [yMag, yUnit] = yPos.split(UNIT_REGEX);
                    xMag = parseFloat(xMag);
                    yMag = parseFloat(yMag);
                    xMag = this.convertToPixel(xMag, xUnit, this.width);
                    yMag = this.convertToPixel(yMag, yUnit, this.height);
                    let position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"];
                    this.vertices[i].updatePosition(position);
                }
            }
            let curvedEdges = [];
            for(let edge of this.edges){
                if(edge.straightEdge){
                    this.updateEdge(edge);
                }
                else {
                    curvedEdges.push(edge);
                }
            }

            for(let edge of curvedEdges){
                this.updateCurvedEdge(edge);
            }
            
        })
    
    }

    createVertex(key, diameter, innerHTML = "", backgroundColor = "white", draggable=false, position = undefined) {
        if(key === undefined){
            throw new TypeError("Undefined Key");
        }
        for(let vertex of this.vertices){
            if(vertex.key === key){
                throw new RangeError("Not a unique key");
            }
        }
        if(typeof diameter !== "string" || !diameter.match(LENGTH_REGEX)){
            throw new TypeError("Invalid diameter. See supported units.");
        }

        let positionOriginal = position === undefined ? undefined : JSON.parse(JSON.stringify(position));
        let [diamMag, diamUnit] = diameter.split(UNIT_REGEX);
        diamMag = parseFloat(diamMag);
        if(diamUnit !== "px"){
            diamMag = this.convertToPixel(diamMag, diamUnit, this.width);
            
        }
        let isDefault = position === undefined;

        if(position === undefined){
            this.numDefaultVert++;
            position = ["0px", "0px"];
        }
        else {
            let [xPos, yPos] = position;
            let [xMag, xUnit] = xPos.split(UNIT_REGEX);
            let [yMag, yUnit] = yPos.split(UNIT_REGEX);
            xMag = parseFloat(xMag);
            yMag = parseFloat(yMag);
            xMag = this.convertToPixel(xMag, xUnit, this.width);
            yMag = this.convertToPixel(yMag, yUnit, this.height);
            position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"]
        }
        
        let vert = new Vertex(key, this.vertContainer, diamMag + "px", position, positionOriginal, isDefault, innerHTML, backgroundColor, draggable);
        this.vertices.push(vert);
        
        let numRows = this.maxNodesPerRow === Infinity ? 1 : Math.ceil(this.numDefaultVert / this.maxNodesPerRow);

        let j = 0;
        for(let i = 0; i < this.vertices.length; i++){
            if(this.vertices[i].isDefault){
                let rowNum = Math.floor(j / this.maxNodesPerRow);

                let value = this.maxNodesPerRow === Infinity ? this.numDefaultVert : this.maxNodesPerRow;
    
                let xPos = (j % this.maxNodesPerRow + 1) / (value + 1) * this.width - diamMag/2;
                let yPos = (rowNum + 1) / (numRows + 1) * this.height - diamMag / 2;
                this.vertices[i].updatePosition([xPos + "px", yPos + "px"]);
                j++;
            }
        }
        
    }

    addEdge(key1, key2) {
        if(key1 === undefined || key2 === undefined){
            throw new TypeError("Undefined Key");
        }
        let [v1found, v2found] = [false, false];
        let v1, v2;
        for(let vertex of this.vertices){
            if(vertex.key === key1){
                v1found = true;
                v1 = vertex;
            }
            else if(vertex.key === key2){
                v2found = true;
                v2 = vertex;
            }
        }
        if(!(v1found && v2found)){
            throw new TypeError(`Could not find one of the keys for the edge (${key1}, ${key2})`);
        }
        let edge = {v1: v1, v2: v2}
        this.edges.push(edge);
        let intersection = this.detectIntersectionLine(edge);
        if(!intersection[0]){
            let line = this.getEdgeElem(edge);
            this.edgesContainer.append(line);
            edge.elem = line;
            edge.straightEdge = true;
        }
        else {
            let curve = this.getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
            this.edgesContainer.append(curve);
            edge.elem = curve;
            edge.straightEdge = false;
        }
        
    }

    // private helper
    getEdgeElem(edge) {
        let v1 = edge.v1;
        let v2 = edge.v2;
        if(!this.directed){
            let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            let x1 = parseFloat(v1.position[0].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let y1 = parseFloat(v1.position[1].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            line.setAttributeNS(null, "x1", x1);
            line.setAttributeNS(null, "y1", y1);
            line.setAttributeNS(null, "x2", x2);
            line.setAttributeNS(null, "y2", y2);
            line.setAttributeNS(null, "style", "stroke:black; stroke-width:1");
            return line;
        }
    }

    // private helper
    updateEdge(edge) {
        let v1 = edge.v1;
        let v2 = edge.v2;
        if(!this.directed){
            let line = edge.elem;
            let x1 = parseFloat(v1.position[0].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let y1 = parseFloat(v1.position[1].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            line.setAttributeNS(null, "x1", x1);
            line.setAttributeNS(null, "y1", y1);
            line.setAttributeNS(null, "x2", x2);
            line.setAttributeNS(null, "y2", y2);
            line.setAttributeNS(null, "style", "stroke:black; stroke-width:1");
            
        }
    }

    // private helper
    getCurvedEdge(edge, xi, yi, xc, yc, r){
        let v0 = edge.v1;
        let v2 = edge.v2;
        let x0 = parseFloat(v0.position[0].split(UNIT_REGEX)[0]) + parseFloat(v0.diameter.split(UNIT_REGEX)[0]) / 2;
        let y0 = parseFloat(v0.position[1].split(UNIT_REGEX)[0]) + parseFloat(v0.diameter.split(UNIT_REGEX)[0]) / 2;
        let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
        let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
        let m = (y2 - y0) / (x2 - x0);
        if(m === 0){
            let x1 = xi;
            let y1 = yi + (4*r);
            let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
            curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
            curve.setAttributeNS(null, "stroke", "black");
            curve.setAttributeNS(null, "fill", "transparent");
            return curve;

        }
        if(x2 - x0 === 0){
            let y1 = yi;
            let x1 = xi - 4*r;
            let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
            curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
            curve.setAttributeNS(null, "stroke", "black");
            curve.setAttributeNS(null, "fill", "transparent");
            return curve;
        }
        let n = -1/m;
        let a = (n**2 + 1);
        let b = -2*xi*(n**2 + 1);
        let c = (n ** 2 + 1)*(xi ** 2) - (4*r)**2;
        if(xi - xc < 0 && yi - yc >= 0 || xi - xc >= 0 && yi - yc < 0){
            let x1 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2*a);
            let y1 = n*x1 + yi - n*xi;
            let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
            curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
            curve.setAttributeNS(null, "stroke", "black");
            curve.setAttributeNS(null, "fill", "transparent");
            return curve;

        }
        else {
            let x1 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
            let y1 = n*x1 + yi - n*xi;
            let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
            curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
            curve.setAttributeNS(null, "stroke", "black");
            curve.setAttributeNS(null, "fill", "transparent");
            return curve;
        }
        
    }

    updateCurvedEdge(edge){
        
        let intersection = this.detectIntersectionLine(edge);
        let newCurve = this.getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
        let str = newCurve.getAttribute("d");
        edge.elem.setAttribute("d", str);

    }

    // private helper
    detectIntersectionLine(edge){
        let v1 = edge.v1;
        let v2 = edge.v2;
        let x1 = parseFloat(v1.position[0].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
        let y1 = parseFloat(v1.position[1].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
        let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
        let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
        let m = (y2-y1) / (x2-x1);
        let a = (m**2 + 1);
        
        for(let v of this.vertices){
            if(v.key !== edge.v1.key && v.key !== edge.v2.key){
                let x3 = parseFloat(v.position[0].split(UNIT_REGEX)[0]) + parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;
                let y3 = parseFloat(v.position[1].split(UNIT_REGEX)[0]) + parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;
                if(x3 >= Math.min(x1, x2) && x3 <= Math.max(x1, x2) && y3 >= Math.min(y1, y2) && y3 <= Math.max(y1, y2)){
                    let r = parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;

                    if(x2-x1 === 0){
                        let a = 1;
                        let b = -2*y3;
                        let c = -(r**2) + (x2 - x3)**2;
                        if(b**2 - 4*a*c > 0){
                            let yVal1 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2*a);
                            let yVal2 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
                            let y = (yVal1 + yVal2) / 2;
                            let x = x2;
                            return [true, x, y, x3, y3, r];
                        }
                        if(b**2 - 4*a*c === 0){
                            let x = x2;
                            let y = -b / (2*a);
                            return [true, x, y, x3, y3, r];
                        }
                
                    }
                    else {
                        let b = (2*m*y1 - 2*(m**2)*x1 - 2*m*y3 - 2*x3);
                        let c = y1**2 - 2*m*x1*y1 - 2*y1*y3 + (m ** 2) * (x1 ** 2) + 2*m*x1*y3 + y3**2 + x3**2 - r**2;
                        if(b**2 - 4*a*c > 0){
                            let xVal1 = (-b + Math.sqrt(b**2 - 4*a*c)) / (2*a);
                            let xVal2 = (-b - Math.sqrt(b**2 - 4*a*c)) / (2*a);
                            let x = (xVal1 + xVal2) / 2;
                            let y = m*x + y1 - m*x1;
                            return [true, x, y, x3, y3, r];
                        }
                        else if(b**2 - 4*a*c === 0){
                            let x = -b / (2*a);
                            let y = m*x + y1 - m*x1;
                            return [true, x, y, x3, y3, r];
                        }
                    }
                    
                }
                
            }
        }

        return [false];
    }


}

// Private classes: user should not access these

class Vertex {
    
    constructor(key, graphElem, diameter, position, positionOriginal, isDefault, innerHTML, backgroundColor, draggable){
        this.vertexElem = document.createElement("div");
        this.key = key;
        this.position = position;
        this.diameter = diameter;
        this.isDefault = isDefault;
        this.positionOriginal = positionOriginal;
        this.vertexElem.draggable = draggable;
        this.vertexElem.id = key;
        if(draggable){
            this.vertexElem.ondragstart = drag;
        }
        this.vertexElem.setAttribute("style", `width: ${diameter}; height: ${diameter}; border-radius: 50%; position: absolute; left: ${this.position[0]}; top: ${this.position[1]}; border: 1px solid; background-color: ${backgroundColor}`);
        this.content = document.createElement("div");
        let [diamMag, diamUnits] = diameter.split(UNIT_REGEX);
        diamMag = parseFloat(diamMag);
        this.content.style = `position: absolute; top: ${diamMag / 2 + diamUnits}; left: ${diamMag / 2 + diamUnits}`;
        this.content.innerHTML = innerHTML;
        this.vertexElem.append(this.content);
        graphElem.append(this.vertexElem);
        let [contWidth, contHeight] = [parseFloat(window.getComputedStyle(this.content).width.split(UNIT_REGEX)), parseFloat(window.getComputedStyle(this.content).height.split(UNIT_REGEX))];
        let graphWidth = window.getComputedStyle(graphElem).width;
        this.content.style.top = convertToPixel(diamMag/2, diamUnits, graphWidth) - contHeight/2 + "px";
        this.content.style.left = convertToPixel(diamMag/2, diamUnits, graphWidth) - contWidth/2 + "px";
    }

    updatePosition(position) {
        this.position = position;
        this.vertexElem.style.left = this.position[0];
        this.vertexElem.style.top = this.position[1];
    }

}