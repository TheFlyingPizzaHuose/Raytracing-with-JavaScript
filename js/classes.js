import {vectorSubtract, crossProduct} from'./math.js';

class face{
    constructor(roughness, color, v1, v2, v3){
        //each element is an array with 7 elements [[R, G, B], vertex1, vertex2, vertex3, normal, sphereOfInfluence, roughness, edgeVector1, edgeVector2]
        this.roughness = roughness;
        this.color = color;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.e1 = vectorSubtract(v2, v1);
        this.e2 = vectorSubtract(v3, v1);
        this.normal = crossProduct(this.e1, this.e2);
    }
}

export {face};