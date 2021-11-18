const LENGTH_REGEX = /^[0-9]+((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(ex)|(vw)|(vh))(?!.)/;
const UNIT_REGEX = /((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(vw)|(vh))/;
class GraphStruc {
    constructor(parentElem, maxNodesPerRow = Infinity){
        this.parentElem = parentElem;
        this.graphElem = document.createElement("div");
        this.vertices = [];
        this.numDefaultVert = 0;
        this.edges = [];
        this.graphElem.style = `width: 100%; height: 100%; border: 1px solid;`
        this.width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]); // in pixels
        this.height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]); // in pixels
        this.graphElem.style.position = "relative";
        this.maxNodesPerRow = maxNodesPerRow;

        this.parentElem.append(this.graphElem);
        window.addEventListener("resize", () => {
            this.width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]);
            this.height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]);
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
                    xMag = this.convertToPixel(xMag, xUnit);
                    yMag = this.convertToPixel(yMag, yUnit, this.height);
                    let position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"];
                    this.vertices[i].updatePosition(position);
                }
            }
            
        })
    
    }

    // helper method: not to be called by client
    convertToPixel(xMag, xUnit, direction = this.width) {
        
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

    createVertex(key, diameter, position = undefined) {
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
            diamMag = this.convertToPixel(diamMag, diamUnit);
            
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
            xMag = this.convertToPixel(xMag, xUnit);
            yMag = this.convertToPixel(yMag, yUnit, this.height);
            position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"]
        }
        
        let vert = new Vertex(key, this.graphElem, diamMag + "px", position, positionOriginal, isDefault);
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


}

// Private classes: user should not access these

class Vertex {
    
    constructor(key, graphElem, diameter, position, positionOriginal, isDefault){
        this.vertexElem = document.createElement("div");
        this.key = key;
        this.position = position;
        this.diameter = diameter;
        this.isDefault = isDefault;
        this.positionOriginal = positionOriginal;
        this.vertexElem.setAttribute("style", `width: ${diameter}; height: ${diameter}; border-radius: 50%; position: absolute; left: ${this.position[0]}; top: ${this.position[1]}; border: 1px solid`)
        graphElem.append(this.vertexElem);
    }

    updatePosition(position) {
        this.position = position;
        this.vertexElem.style.left = this.position[0];
        this.vertexElem.style.top = this.position[1];
    }

}