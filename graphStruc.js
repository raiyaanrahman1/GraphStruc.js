const LENGTH_REGEX = /^[0-9]+((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(ex)|(vw)|(vh))(?!.)/;
const UNIT_REGEX = /((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(vw)|(vh))/;
class GraphStruc {
    constructor(parentElem){
        this.parentElem = parentElem;
        this.graphElem = document.createElement("div");
        this.vertices = [];
        this.edges = [];
        this.graphElem.style = `width: 100%; height: 100%; border: 1px solid;`
        this.width = window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]; // in pixels
        this.height = window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]; // in pixels
        this.graphElem.style.position = "relative"

        this.parentElem.append(this.graphElem);
        window.addEventListener("resize", () => {
            this.width = window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0];
            this.height = window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0];
            let diamMag, xPos, yPos;
            for(let i = 0; i < this.vertices.length; i++){
                diamMag = this.vertices[i].diameter.split(UNIT_REGEX)[0];
                xPos = (i+1) / (this.vertices.length + 1) * this.width - diamMag/2;
                yPos = this.height / 2 - diamMag / 2;
                this.vertices[i].updatePosition([xPos + "px", yPos + "px"]);
            }
            // console.log("resized");
            // console.log(this.width);
            // console.log(this.height);
            
        })
    
    }

    convertToPixel(xMag, xUnit) {
        
        switch(xUnit){
            // absolute units
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
                return (xMag / 100) * this.width;
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

        let [diamMag, diamUnit] = diameter.split(UNIT_REGEX);
        if(diamUnit !== "px"){
            diamMag = this.convertToPixel(diamMag, diamUnit);
            
        }

        if(position === undefined){
            // figure out where the vertex should go
            
            let xPos = (this.vertices.length + 1) / (this.vertices.length + 2) * this.width - diamMag/2; // from the left
            let yPos = this.height / 2 - diamMag / 2; // from the top
            position = [xPos + "px", yPos + "px"];
            //console.log(position);
        }
        
        let vert = new Vertex(key, this.graphElem, diamMag + "px", position);
        this.vertices.push(vert);

        for(let i = 0; i < this.vertices.length - 1; i++){
            let xPos = (i+1) / (this.vertices.length + 1) * this.width - diamMag/2;
            let yPos = this.height / 2 - diamMag / 2;
            this.vertices[i].updatePosition([xPos + "px", yPos + "px"]);
        }
        
    }


}

// Private classes: user should not access these

class Vertex {
    
    constructor(key, graphElem, diameter, position){
        this.vertexElem = document.createElement("div");
        this.key = key;
        this.position = position;
        this.diameter = diameter;
        this.vertexElem.setAttribute("style", `width: ${diameter}; height: ${diameter}; border-radius: 50%; position: absolute; left: ${this.position[0]}; top: ${this.position[1]}; border: 1px solid`)
        //this.vertexElem.style = `width: ${diameter}; height: ${diameter}; border-radius: 50%; position: absolute; left: ${this.position[0]}; top: ${this.position[1]}; border: 1px solid`;
        graphElem.append(this.vertexElem);
    }

    updatePosition(position) {
        this.position = position;
        this.vertexElem.style.left = this.position[0];
        this.vertexElem.style.top = this.position[1];
    }

}