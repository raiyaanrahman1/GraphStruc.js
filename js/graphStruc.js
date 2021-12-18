const LENGTH_REGEX = /^[0-9]+((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(ex)|(vw)|(vh))(?!.)/;
const UNIT_REGEX = /((px)|(%)|(cm)|(mm)|(in)|(pt)|(pc)|(em)|(rem)|(vw)|(vh))/;

(function (window, document) {

    // helper method: not to be called by client
    function convertToPixel(xMag, xUnit, direction) {

        switch (xUnit) {
            // absolute units
            case "px":
                return xMag;
            case "in":
                return (xMag * 96);
            case "cm":
                return (xMag * 96 / 2.54);
            case "mm":
                return (xMag * 96 / 2.54 / 10);
            case "pt":
                return (xMag * 96 / 72);
            case "pc":
                return (xMag * 16);
            // relative units
            case "%":
                return (xMag / 100) * direction;
            case "rem":
                return (xMag * parseFloat(getComputedStyle(document.documentElement).fontSize));
            case "em":
                return (xMag * parseFloat(getComputedStyle(this.parentElem).fontSize));
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
        #parentElem;
        #graphElem;
        #vertices;
        #edges;
        #directed;
        #numDefaultVert;
        #width;
        #height;
        #maxNodesPerRow;
        #vertContainer;
        #edgesContainer;

        constructor(parentElem, directed = false, maxNodesPerRow = Infinity) {
            this.#parentElem = parentElem;
            this.#graphElem = document.createElement("div");
            this.#vertices = [];
            this.#edges = [];
            this.#directed = directed;
            this.#numDefaultVert = 0;
            this.#graphElem.style = `width: 100%; height: 100%;`
            this.#width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]); // in pixels
            this.#height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]); // in pixels
            this.#graphElem.style.position = "relative";
            this.#maxNodesPerRow = maxNodesPerRow;

            this.#vertContainer = document.createElement("div");
            this.#edgesContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.#edgesContainer.setAttributeNS(null, "width", this.#width);
            this.#edgesContainer.setAttributeNS(null, "height", this.#height);

            this.#graphElem.ondrop = (ev) => {
                var data = ev.dataTransfer.getData("Text");
                let vert;
                for (let vertex of this.#vertices) {
                    if (String(vertex.key) === data) {
                        vert = vertex;
                        break;
                    }
                }
                let diamMag = convertToPixel(parseFloat(vert.diameter.split(UNIT_REGEX)[0]), vert.diameter.split(UNIT_REGEX)[1], this.#width);
                let newPos = [ev.clientX - this.#graphElem.getBoundingClientRect().left - diamMag / 2 + "px", ev.clientY - this.#graphElem.getBoundingClientRect().top - diamMag / 2 + "px"];
                vert.updatePosition(newPos);

                if (vert.isDefault) {
                    vert.isDefault = false;
                    this.#numDefaultVert--;
                }

                let newPosOriginal = JSON.parse(JSON.stringify(newPos));
                if (vert.positionOriginal === undefined || vert.positionOriginal[0].split(UNIT_REGEX)[1] === "%") {
                    newPosOriginal[0] = 100 * (parseFloat(newPos[0].split(UNIT_REGEX)[0]) + diamMag / 2) / this.#width + "%";
                }
                if (vert.positionOriginal === undefined || vert.positionOriginal[1].split(UNIT_REGEX)[1] === "%") {
                    newPosOriginal[1] = 100 * (parseFloat(newPos[1].split(UNIT_REGEX)[0]) + diamMag / 2) / this.#height + "%";
                }
                vert.positionOriginal = newPosOriginal;
                // console.log(newPos);

                for (let edge of this.#edges) {
                    if (edge.v1.key === vert.key || edge.v2.key === vert.key) {
                        edge.elem.remove();
                        if (this.#directed) {
                            edge.arrowElems[0].remove();
                            edge.arrowElems[1].remove();
                            edge.arrowElems = [];
                        }
                        let intersection = this.#detectIntersectionLine(edge);
                        if (!intersection[0]) {
                            let lines = this.#getEdgeElem(edge);
                            let line = lines[0];
                            this.#edgesContainer.append(line);
                            edge.elem = line;
                            edge.straightEdge = true;

                            if (this.#directed) {
                                edge.arrowElems.push(lines[1], lines[2]);
                                this.#edgesContainer.append(lines[1]);
                                this.#edgesContainer.append(lines[2]);
                            }
                        }
                        else {
                            let curves = this.#getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
                            let curve = curves[0];
                            this.#edgesContainer.append(curve);
                            edge.elem = curve;
                            edge.straightEdge = false;

                            if (this.#directed) {
                                edge.arrowElems.push(curves[1], curves[2]);
                                this.#edgesContainer.append(curves[1]);
                                this.#edgesContainer.append(curves[2]);

                            }
                        }
                    }
                }


            };
            this.#graphElem.ondragover = allowDrop;

            this.#graphElem.append(this.#edgesContainer);
            this.#graphElem.append(this.#vertContainer);


            this.#parentElem.append(this.#graphElem);
            window.addEventListener("resize", () => {
                this.#width = parseFloat(window.getComputedStyle(parentElem).width.split(UNIT_REGEX)[0]);
                this.#height = parseFloat(window.getComputedStyle(parentElem).height.split(UNIT_REGEX)[0]);
                this.#edgesContainer.setAttributeNS(null, "width", this.#width);
                this.#edgesContainer.setAttributeNS(null, "height", this.#height);
                let numRows = this.#maxNodesPerRow === Infinity ? 1 : Math.ceil(this.#numDefaultVert / this.#maxNodesPerRow);

                let j = 0;
                for (let i = 0; i < this.#vertices.length; i++) {
                    let diamMag = parseFloat(this.#vertices[i].diameter.split(UNIT_REGEX)[0]);

                    if (this.#vertices[i].isDefault) {
                        let rowNum = Math.floor(j / this.#maxNodesPerRow);

                        let value = this.#maxNodesPerRow === Infinity ? this.#numDefaultVert : this.#maxNodesPerRow;

                        let xPos = (j % this.#maxNodesPerRow + 1) / (value + 1) * this.#width - diamMag / 2;
                        let yPos = (rowNum + 1) / (numRows + 1) * this.#height - diamMag / 2;
                        this.#vertices[i].updatePosition([xPos + "px", yPos + "px"]);
                        j++;
                    }
                    else {
                        let [xPos, yPos] = this.#vertices[i].positionOriginal;
                        let [xMag, xUnit] = xPos.split(UNIT_REGEX);
                        let [yMag, yUnit] = yPos.split(UNIT_REGEX);
                        xMag = parseFloat(xMag);
                        yMag = parseFloat(yMag);
                        xMag = convertToPixel(xMag, xUnit, this.#width);
                        yMag = convertToPixel(yMag, yUnit, this.#height);
                        let position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"];
                        this.#vertices[i].updatePosition(position);
                    }
                }
                let curvedEdges = [];
                for (let edge of this.#edges) {
                    if (edge.straightEdge) {
                        this.#updateEdge(edge);
                    }
                    else {
                        curvedEdges.push(edge);
                    }
                }

                for (let edge of curvedEdges) {
                    this.#updateCurvedEdge(edge);
                }

            })

        }

        createVertex(key, diameter, innerHTML = "", backgroundColor = "white", draggable = false, position = undefined) {
            if (key === undefined) {
                throw new TypeError("Undefined Key");
            }
            key = String(key);
            for (let vertex of this.#vertices) {
                if (vertex.key === key) {
                    throw new RangeError("Not a unique key");
                }
            }
            if (typeof diameter !== "string" || !diameter.match(LENGTH_REGEX)) {
                throw new TypeError("Invalid diameter. See supported units.");
            }

            let positionOriginal = position === undefined ? undefined : JSON.parse(JSON.stringify(position));
            let [diamMag, diamUnit] = diameter.split(UNIT_REGEX);
            diamMag = parseFloat(diamMag);
            if (diamUnit !== "px") {
                diamMag = convertToPixel(diamMag, diamUnit, this.#width);

            }
            let isDefault = position === undefined;

            if (position === undefined) {
                this.#numDefaultVert++;
                position = ["0px", "0px"];
            }
            else {
                let [xPos, yPos] = position;
                let [xMag, xUnit] = xPos.split(UNIT_REGEX);
                let [yMag, yUnit] = yPos.split(UNIT_REGEX);
                xMag = parseFloat(xMag);
                yMag = parseFloat(yMag);
                xMag = convertToPixel(xMag, xUnit, this.#width);
                yMag = convertToPixel(yMag, yUnit, this.#height);
                position = [(xMag - diamMag / 2) + "px", (yMag - diamMag / 2) + "px"];
            }

            let vert = new Vertex(key, this.#vertContainer, diamMag + "px", position, positionOriginal, isDefault, innerHTML, backgroundColor, draggable);
            this.#vertices.push(vert);

            let numRows = this.#maxNodesPerRow === Infinity ? 1 : Math.ceil(this.#numDefaultVert / this.#maxNodesPerRow);

            let j = 0;
            for (let i = 0; i < this.#vertices.length; i++) {
                if (this.#vertices[i].isDefault) {
                    let rowNum = Math.floor(j / this.#maxNodesPerRow);

                    let value = this.#maxNodesPerRow === Infinity ? this.#numDefaultVert : this.#maxNodesPerRow;

                    let xPos = (j % this.#maxNodesPerRow + 1) / (value + 1) * this.#width - diamMag / 2;
                    let yPos = (rowNum + 1) / (numRows + 1) * this.#height - diamMag / 2;
                    this.#vertices[i].updatePosition([xPos + "px", yPos + "px"]);
                    j++;
                }
            }

            let curvedEdges = [];
            for (let edge of this.#edges) {
                if (edge.straightEdge) {
                    this.#updateEdge(edge);
                }
                else {
                    curvedEdges.push(edge);
                }
            }

            for (let edge of curvedEdges) {
                this.#updateCurvedEdge(edge);
            }

        }

        addEdge(key1, key2) {
            if (key1 === undefined || key2 === undefined) {
                throw new TypeError("Undefined Key");
            }
            key1 = String(key1);
            key2 = String(key2);
            let [v1found, v2found] = [false, false];
            let v1, v2;
            for (let vertex of this.#vertices) {
                if (vertex.key === key1) {
                    v1found = true;
                    v1 = vertex;
                }
                else if (vertex.key === key2) {
                    v2found = true;
                    v2 = vertex;
                }
            }
            if (!(v1found && v2found)) {
                throw new TypeError(`Could not find one of the keys for the edge (${key1}, ${key2})`);
            }

            for(let edge of this.#edges){
                if(edge.v1.key === key1 && edge.v2.key === key2){
                    throw new TypeError(`The edge from ${key1} to ${key2} already exists`);
                }
                else if(!this.#directed && edge.v1.key === key2 && edge.v2.key === key1){
                    throw new TypeError(`The edge from ${key1} to ${key2} already exists`);
                }
            }
            // let edge = {v1: v1, v2: v2}
            let edge = new Edge(v1, v2, this.#directed);
            this.#edges.push(edge);
            let intersection = this.#detectIntersectionLine(edge);
            if (!intersection[0]) {
                let lines = this.#getEdgeElem(edge);
                let line = lines[0];

                for (let line of lines) {
                    this.#edgesContainer.append(line);
                }

                edge.elem = line;

                if (this.#directed) {
                    edge.arrowElems.push(lines[1], lines[2]);
                }

                edge.straightEdge = true;
            }
            else {
                let curves = this.#getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
                let curve = curves[0];
                for (let elem of curves) {
                    this.#edgesContainer.append(elem);
                }

                edge.elem = curve;

                if (this.#directed) {
                    edge.arrowElems.push(curves[1], curves[2]);
                }
                edge.straightEdge = false;
            }

        }

        // private helper
        #getEdgeElem(edge) {
            let lines = []
            let v1 = edge.v1;
            let v2 = edge.v2;

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
            lines.push(line);

            if (this.#directed) {
                let [diamMag, diamUnit] = v2.diameter.split(UNIT_REGEX);
                diamMag = parseFloat(diamMag);
                diamMag = convertToPixel(diamMag, diamUnit, this.#width);
                if (x1 !== x2) {
                    lines.push(...this.#getArrows(x1, x2, y1, y2, diamMag / 2));
                }
                else {
                    let dir = 1;
                    if (y1 < y2) {
                        dir = -1;
                    }
                    let leftLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    let rightLine = document.createElementNS("http://www.w3.org/2000/svg", "line");

                    leftLine.setAttributeNS(null, "x1", x2);
                    leftLine.setAttributeNS(null, "y1", y2 + dir * diamMag / 2);
                    leftLine.setAttributeNS(null, "x2", x2 - 20 / Math.sqrt(2));
                    leftLine.setAttributeNS(null, "y2", y2 + dir * diamMag / 2 + dir * 20 / Math.sqrt(2));
                    leftLine.setAttributeNS(null, "style", "stroke:black; stroke-width:1");

                    rightLine.setAttributeNS(null, "x1", x2);
                    rightLine.setAttributeNS(null, "y1", y2 + dir * diamMag / 2);
                    rightLine.setAttributeNS(null, "x2", x2 + 20 / Math.sqrt(2));
                    rightLine.setAttributeNS(null, "y2", y2 + dir * diamMag / 2 + dir * 20 / Math.sqrt(2));
                    rightLine.setAttributeNS(null, "style", "stroke:black; stroke-width:1");

                    lines.push(leftLine, rightLine);
                }

            }
            return lines;

        }

        // private helper
        #updateEdge(edge) {

            let lines = this.#getEdgeElem(edge);
            let [x1, x2, y1, y2] = [lines[0].getAttribute("x1"), lines[0].getAttribute("x2"), lines[0].getAttribute("y1"), lines[0].getAttribute("y2")];
            edge.elem.setAttribute("x1", x1);
            edge.elem.setAttribute("y1", y1);
            edge.elem.setAttribute("x2", x2);
            edge.elem.setAttribute("y2", y2);
            // edge.elem.setAttribute("style", "stroke:black; stroke-width:1");

            if (this.#directed) {
                let line1 = [lines[1].getAttribute("x1"), lines[1].getAttribute("x2"), lines[1].getAttribute("y1"), lines[1].getAttribute("y2")];
                edge.arrowElems[0].setAttribute("x1", line1[0]);
                edge.arrowElems[0].setAttribute("x2", line1[1]);
                edge.arrowElems[0].setAttribute("y1", line1[2]);
                edge.arrowElems[0].setAttribute("y2", line1[3]);

                let line2 = [lines[2].getAttribute("x1"), lines[2].getAttribute("x2"), lines[2].getAttribute("y1"), lines[2].getAttribute("y2")];
                edge.arrowElems[1].setAttribute("x1", line2[0]);
                edge.arrowElems[1].setAttribute("x2", line2[1]);
                edge.arrowElems[1].setAttribute("y1", line2[2]);
                edge.arrowElems[1].setAttribute("y2", line2[3]);
            }


        }

        // private helper
        #getArrows(x1, x2, y1, y2, rad) {
            let dir = 1;
            if (x1 < x2) {
                dir = -1;
            }
            let upLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            let len = 10;
            let downSlope = (y2 - y1) / (x2 - x1);

            let upSlope = -downSlope;

            let downB = y2 - downSlope * x2;

            let upB = y2 - upSlope * x2;

            let a = (downSlope ** 2 + 1);
            let b = (2 * downSlope * downB - 2 * downSlope * y2 - 2 * x2);
            let c = downB ** 2 + y2 ** 2 - 2 * downB * y2 + x2 ** 2 - (rad) ** 2;
            let xIntersect = (-b + dir * Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
            let yIntersect = downSlope * xIntersect + downB;

            let angle = Math.atan(downSlope);
            let newDownSlope = Math.tan(angle + Math.PI / 4);
            let newUpSlope = Math.tan(angle - Math.PI / 4);
            let newDownB = yIntersect - newDownSlope * xIntersect;
            let newUpB = yIntersect - newUpSlope * xIntersect;

            let dist = 20;
            let newA = newUpSlope ** 2 + 1;
            let newB = 2 * newUpSlope * newUpB - 2 * newUpSlope * yIntersect - 2 * xIntersect;
            let newC = newUpB ** 2 + yIntersect ** 2 - 2 * newUpB * yIntersect + xIntersect ** 2 - dist ** 2;

            let dir3 = 1;
            if ((downSlope < -1)) {
                dir3 = -1;
            }

            let upX = (-newB + dir3 * dir * Math.sqrt(newB ** 2 - 4 * newA * newC)) / (2 * newA);

            upLine.setAttributeNS(null, "x1", xIntersect);
            upLine.setAttributeNS(null, "y1", yIntersect);
            upLine.setAttributeNS(null, "x2", upX);
            upLine.setAttributeNS(null, "y2", newUpSlope * (upX) + newUpB);
            upLine.setAttributeNS(null, "style", "stroke:black; stroke-width:1");

            // let dist = Math.sqrt(len**2 + (newUpSlope*(xIntersect + dir*len) + newUpB - yIntersect)**2);
            newA = newDownSlope ** 2 + 1;
            newB = 2 * newDownSlope * newDownB - 2 * newDownSlope * yIntersect - 2 * xIntersect;
            newC = newDownB ** 2 + yIntersect ** 2 - 2 * newDownB * yIntersect + xIntersect ** 2 - dist ** 2;

            let dir2 = 1;
            if ((downSlope > 1)) {
                dir2 = -1;
            }

            let downX = (-newB + dir2 * dir * Math.sqrt(newB ** 2 - 4 * newA * newC)) / (2 * newA);
            let downLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            downLine.setAttributeNS(null, "x1", xIntersect);
            downLine.setAttributeNS(null, "y1", yIntersect);
            downLine.setAttributeNS(null, "x2", downX);
            downLine.setAttributeNS(null, "y2", newDownSlope * (downX) + newDownB);
            downLine.setAttributeNS(null, "style", "stroke:black; stroke-width:1");

            return [upLine, downLine];
        }

        // private helper
        #getCurvedEdge(edge, xi, yi, xc, yc, r) {
            let v0 = edge.v1;
            let v2 = edge.v2;
            let x0 = parseFloat(v0.position[0].split(UNIT_REGEX)[0]) + parseFloat(v0.diameter.split(UNIT_REGEX)[0]) / 2;
            let y0 = parseFloat(v0.position[1].split(UNIT_REGEX)[0]) + parseFloat(v0.diameter.split(UNIT_REGEX)[0]) / 2;
            let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let m = (y2 - y0) / (x2 - x0);
            let curves = [];

            if (m === 0) {
                let x1 = xi;
                let y1 = yi + (4 * r);
                let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
                curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
                curve.setAttributeNS(null, "stroke", "black");
                curve.setAttributeNS(null, "fill", "transparent");
                curves.push(curve);

                if (this.#directed) {
                    let [diamMag, diamUnit] = v2.diameter.split(UNIT_REGEX);
                    diamMag = parseFloat(diamMag);
                    diamMag = convertToPixel(diamMag, diamUnit, this.#width);
                    curves.push(...this.#getArrows(x1, x2, y1, y2, diamMag / 2));
                }
                return curves;

            }
            if (x2 - x0 === 0) {
                let y1 = yi;
                let x1 = xi - 4 * r;
                let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
                curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
                curve.setAttributeNS(null, "stroke", "black");
                curve.setAttributeNS(null, "fill", "transparent");
                curves.push(curve);

                if (this.#directed) {
                    let [diamMag, diamUnit] = v2.diameter.split(UNIT_REGEX);
                    diamMag = parseFloat(diamMag);
                    diamMag = convertToPixel(diamMag, diamUnit, this.#width);
                    curves.push(...this.#getArrows(x1, x2, y1, y2, diamMag / 2));
                }

                return curves;
            }
            let n = -1 / m;
            let a = (n ** 2 + 1);
            let b = -2 * xi * (n ** 2 + 1);
            let c = (n ** 2 + 1) * (xi ** 2) - (4 * r) ** 2;
            if (xi - xc < 0 && yi - yc >= 0 || xi - xc >= 0 && yi - yc < 0) {
                let x1 = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                let y1 = n * x1 + yi - n * xi;
                let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
                curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
                curve.setAttributeNS(null, "stroke", "black");
                curve.setAttributeNS(null, "fill", "transparent");
                curves.push(curve);

                if (this.#directed) {
                    let [diamMag, diamUnit] = v2.diameter.split(UNIT_REGEX);
                    diamMag = parseFloat(diamMag);
                    diamMag = convertToPixel(diamMag, diamUnit, this.#width);
                    curves.push(...this.#getArrows(x1, x2, y1, y2, diamMag / 2));
                }

                return curves;

            }
            else {
                let x1 = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                let y1 = n * x1 + yi - n * xi;
                let curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
                curve.setAttributeNS(null, "d", `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`);
                curve.setAttributeNS(null, "stroke", "black");
                curve.setAttributeNS(null, "fill", "transparent");
                curves.push(curve);

                if (this.#directed) {
                    let [diamMag, diamUnit] = v2.diameter.split(UNIT_REGEX);
                    diamMag = parseFloat(diamMag);
                    diamMag = convertToPixel(diamMag, diamUnit, this.#width);
                    curves.push(...this.#getArrows(x1, x2, y1, y2, diamMag / 2));
                }

                return curves;
            }

        }

        #updateCurvedEdge(edge) {

            let intersection = this.#detectIntersectionLine(edge);
            let curves = this.#getCurvedEdge(edge, intersection[1], intersection[2], intersection[3], intersection[4], intersection[5]);
            let newCurve = curves[0]
            let str = newCurve.getAttribute("d");
            edge.elem.setAttribute("d", str);

            if (this.#directed) {
                let line1 = [curves[1].getAttribute("x1"), curves[1].getAttribute("x2"), curves[1].getAttribute("y1"), curves[1].getAttribute("y2")];
                edge.arrowElems[0].setAttribute("x1", line1[0]);
                edge.arrowElems[0].setAttribute("x2", line1[1]);
                edge.arrowElems[0].setAttribute("y1", line1[2]);
                edge.arrowElems[0].setAttribute("y2", line1[3]);

                let line2 = [curves[2].getAttribute("x1"), curves[2].getAttribute("x2"), curves[2].getAttribute("y1"), curves[2].getAttribute("y2")];
                edge.arrowElems[1].setAttribute("x1", line2[0]);
                edge.arrowElems[1].setAttribute("x2", line2[1]);
                edge.arrowElems[1].setAttribute("y1", line2[2]);
                edge.arrowElems[1].setAttribute("y2", line2[3]);
            }

        }

        // private helper
        #detectIntersectionLine(edge) {
            let v1 = edge.v1;
            let v2 = edge.v2;
            let x1 = parseFloat(v1.position[0].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let y1 = parseFloat(v1.position[1].split(UNIT_REGEX)[0]) + parseFloat(v1.diameter.split(UNIT_REGEX)[0]) / 2;
            let x2 = parseFloat(v2.position[0].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let y2 = parseFloat(v2.position[1].split(UNIT_REGEX)[0]) + parseFloat(v2.diameter.split(UNIT_REGEX)[0]) / 2;
            let m = (y2 - y1) / (x2 - x1);
            let a = (m ** 2 + 1);

            for (let v of this.#vertices) {
                if (v.key !== edge.v1.key && v.key !== edge.v2.key) {
                    let x3 = parseFloat(v.position[0].split(UNIT_REGEX)[0]) + parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;
                    let y3 = parseFloat(v.position[1].split(UNIT_REGEX)[0]) + parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;
                    if (x3 >= Math.min(x1, x2) && x3 <= Math.max(x1, x2) && y3 >= Math.min(y1, y2) && y3 <= Math.max(y1, y2)) {
                        let r = parseFloat(v.diameter.split(UNIT_REGEX)[0]) / 2;

                        if (x2 - x1 === 0) {
                            let a = 1;
                            let b = -2 * y3;
                            let c = -(r ** 2) + (x2 - x3) ** 2;
                            if (b ** 2 - 4 * a * c > 0) {
                                let yVal1 = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                                let yVal2 = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                                let y = (yVal1 + yVal2) / 2;
                                let x = x2;
                                return [true, x, y, x3, y3, r];
                            }
                            if (b ** 2 - 4 * a * c === 0) {
                                let x = x2;
                                let y = -b / (2 * a);
                                return [true, x, y, x3, y3, r];
                            }

                        }
                        else {
                            let b = (2 * m * y1 - 2 * (m ** 2) * x1 - 2 * m * y3 - 2 * x3);
                            let c = y1 ** 2 - 2 * m * x1 * y1 - 2 * y1 * y3 + (m ** 2) * (x1 ** 2) + 2 * m * x1 * y3 + y3 ** 2 + x3 ** 2 - r ** 2;
                            if (b ** 2 - 4 * a * c > 0) {
                                let xVal1 = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                                let xVal2 = (-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
                                let x = (xVal1 + xVal2) / 2;
                                let y = m * x + y1 - m * x1;
                                return [true, x, y, x3, y3, r];
                            }
                            else if (b ** 2 - 4 * a * c === 0) {
                                let x = -b / (2 * a);
                                let y = m * x + y1 - m * x1;
                                return [true, x, y, x3, y3, r];
                            }
                        }

                    }

                }
            }

            return [false];
        }

        animatePath(key1, key2, loop = true) {
            let v1, v2;
            let foundv1 = false, foundv2 = false;
            key1 = String(key1);
            key2 = String(key2);
            for (let v of this.#vertices) {
                if (v.key === key1) {
                    v1 = v;
                    foundv1 = true;
                    if (foundv2) break;
                }
                if (v.key === key2) {
                    v2 = v;
                    foundv2 = true;
                    if (foundv1) break;
                }

            }

            if (!foundv1 && !foundv2) {
                throw TypeError("Couldn't find vertices with specified keys", key1, key2);
            }

            let path = this.#bfs(v1, v2);
            path.unshift(v1);
            return this.#startBlinking(path, loop);

        }

        // helper. Note path sequence does not include s, but includes t
        #bfs(s, t) {
            for (let vertex of this.#vertices) {
                vertex.bfsVisited = false;
                vertex.bfsParent = null;
            }
            let pathSequence = [];
            let queue = [];
            s.bfsVisited = true;
            let found = false;
            queue.push(s);

            MainLoop:
            while (queue.length > 0) {
                let u = queue.pop(0);
                for (let vertex of u.adjList) {
                    if (!vertex.bfsVisited) {
                        vertex.bfsVisited = true;
                        vertex.bfsParent = u;
                        if (vertex.key === t.key) {
                            found = true;
                            break MainLoop;
                        }
                        else {
                            queue.push(vertex);
                        }
                    }
                }
            }

            if (!found) {
                throw TypeError("No path from specified vertices");
            }

            let v = t;
            while (found && v.bfsParent !== null) {
                pathSequence.unshift(v);
                v = v.bfsParent;
            }
            return pathSequence;
        }

        // helper
        #startBlinking(pathSequence, loop) {
            let i = 0;
            let stop = false;
            let stopBlinking = () => {
                stop = true;
                if (i > 0) {
                    pathSequence[i - 1].vertexElem.style.backgroundColor = pathSequence[i - 1].backgroundColor;
                }
                else {
                    pathSequence[pathSequence.length - 1].vertexElem.style.backgroundColor = pathSequence[pathSequence.length - 1].backgroundColor;
                    if (stop) {
                        clearInterval(intervalId);
                        return;
                    }
                }
            };
            let intervalId = setInterval(function () {
                if (i > 0) {
                    pathSequence[i - 1].vertexElem.style.backgroundColor = pathSequence[i - 1].backgroundColor;
                }
                else {
                    pathSequence[pathSequence.length - 1].vertexElem.style.backgroundColor = pathSequence[pathSequence.length - 1].backgroundColor;
                    if (stop) {
                        clearInterval(intervalId);
                        return stopBlinking;
                    }
                }
                if (stop) {
                    return stopBlinking;
                }

                pathSequence[i].vertexElem.style.backgroundColor = "yellow";
                i++;
                if (i >= pathSequence.length) {
                    i = 0;
                    if (!loop) stop = true;
                }
            }, 1000);
            return stopBlinking;
        }


    }

    // Private classes: user should not access these

    class Vertex {

        constructor(key, graphElem, diameter, position, positionOriginal, isDefault, innerHTML, backgroundColor, draggable) {
            this.vertexElem = document.createElement("div");
            this.key = key;
            this.position = position;
            this.diameter = diameter;
            this.isDefault = isDefault;
            this.positionOriginal = positionOriginal;
            this.vertexElem.draggable = draggable;
            this.vertexElem.id = key;
            this.highlighted = false;
            this.adjList = [];
            this.backgroundColor = backgroundColor;
            if (draggable) {
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
            this.content.style.top = convertToPixel(diamMag / 2, diamUnits, graphWidth) - contHeight / 2 + "px";
            this.content.style.left = convertToPixel(diamMag / 2, diamUnits, graphWidth) - contWidth / 2 + "px";

            if (draggable) {
                this.vertexElem.style.cursor = "pointer";
            }
        }

        updatePosition(position) {
            this.position = position;
            this.vertexElem.style.left = this.position[0];
            this.vertexElem.style.top = this.position[1];
        }

    }

    class Edge {
        constructor(v1, v2, directed, straightEdge = false, elem = undefined) {
            this.v1 = v1;
            this.v2 = v2;
            this.straightEdge = straightEdge;
            this.elem = elem;
            this.directed = directed;
            this.arrowElems = [];

            this.v1.adjList.push(v2);
            if (!this.directed) {
                this.v2.adjList.push(v1);
            }

        }
    }

    window.GraphStruc = window.GraphStruc || GraphStruc;

})(window, window.document);