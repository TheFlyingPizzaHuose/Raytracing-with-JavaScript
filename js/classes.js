import {vectorSubtract, crossProduct} from'./math.js';
import {rayTriITP} from './raytracing.js';

class face{
    constructor(roughness, color, v1, v2, v3){
        //each element is an array with 7 elements [[R, G, B], vertex1, vertex2, vertex3, normal, sphereOfInfluence, roughness, edgeVector1, edgeVector2]
        this.roughness = roughness;
        this.name = 'face'
        this.color = color;
        this.v1 = v1;
        this.v2 = v2;
        this.v3 = v3;
        this.e1 = vectorSubtract(v2, v1);
        this.e2 = vectorSubtract(v3, v1);
        this.normal = crossProduct(this.e1, this.e2);
    }
}

class BBVH{
    constructor(data, splCor){
        this.name = 'BBVH'
        this.children = this.generate(data, splCor);
        this.lwCor;
        this.upCor;
    }
    get generate(){
        return this.generate();
    }
    //Generates BVH
    generate(data, splCor){
        var xcords = [];
        this.lwCor=Object.values(data[0].v1);
        this.upCor=Object.values(data[0].v1);
        //Get the maximum and minimum verticies
        data.forEach(fac=>{
            [fac.v1, fac.v2, fac.v3].forEach(v=>{
                xcords.push(v[splCor]);
                v.forEach((x, w)=>{
                    if(x > this.upCor[w]){
                        this.upCor[w]=x;
                    }else if(x < this.lwCor[w]){
                        this.lwCor[w]=x;
                    }
                })
            })
        })
        //Chekcs if triangles are more than 5
        if(true && data.length > 5){
            //remove xcords duplicates and sort
            xcords = [... new Set(xcords)].sort((a,b) => {return a - b});
            //get BVH split coord
            var xsplit = (xcords[xcords.length-1] + xcords[0])/2
            //splits triangles
            var grp1 = [], grp2 = [];
            data.forEach(fac=>{
                var chk1 = false, chk2 = false; //Checks if face is already in both groups;
                [fac.v1, fac.v2, fac.v3].forEach((v)=>{
                    if(v[splCor] > xsplit && !chk1){
                        grp1.push(fac);
                        chk1=true;
                    }
                    if(v[splCor] < xsplit && !chk2){
                        grp2.push(fac);
                        chk2=true;
                    }
                })
            })
            //console.log(data.length, grp1.length, grp2.length);
            splCor+=splCor<2?1:-2;
            if(data.length > grp1.length && data.length > grp2.length){
                return [new BBVH(grp1, splCor), new BBVH(grp2, splCor)]
            }else if(data.length > grp2.length){
                var temp = [new BBVH(grp2, splCor)];
                Array.prototype.push.apply(temp, grp1)
                return temp;
            }else if(data.length > grp1.length){
                var temp = [new BBVH(grp1, splCor)];
                Array.prototype.push.apply(temp, grp2)
                return temp;
            }else{
                return data;
            }
        }else{
            return data;
        }
    }
    get intersect(){
        return this.intersect();
    }
    //Checks if BVH intersects
    intersect(V1, P1){
        var bx = this.lwCor[0], by = this.lwCor[1], bz = this.lwCor[2];
        var ax = this.upCor[0], ay = this.upCor[1], az = this.upCor[2];
        var checks = 0;

        var m = V1[1]/V1[0];
        var Rybx = P1[1] + m*(bx - P1[0]);
        checks+=(by <= Rybx && Rybx <= ay);
        if(!checks){
            var Ryax = P1[1] + m*(ax - P1[0])
            checks+=(by <= Ryax && Ryax <= ay);
        }
        if(!checks){
            m = V1[0]/V1[1];
            var Rxby = P1[0] + m*(by - P1[1]);
            checks+=(bx <= Rxby && Rxby <= ax);
        }
        if(!checks){
            var Rxay = P1[0] + m*(ay - P1[1]);
            checks+=(bx <= Rxay && Rxay <= ax);
        }
        
        if(checks==1){
            m = V1[2]/V1[0];
            var Rzbx = P1[2] + m*(bx - P1[0]);
            checks+=(bz <= Rzbx && Rzbx <= az);
        }
        if(checks==1){
            var Rzax = P1[2] + m*(ax - P1[0]);
            checks+=(bz <= Rzax && Rzax <= az);
        }  
        if(checks==1){
            m = V1[0]/V1[2];
            var Rxbz = P1[0] + m*(bz - P1[2]);
            checks+=(bx <= Rxbz && Rxbz <= ax);
        }
        if(checks==1){
            var Rxaz = P1[0] + m*(az - P1[2]);
            checks+=(bx <= Rxaz && Rxaz <= ax);
        }
               
        if(checks==2){
            m = V1[2]/V1[1];
            var Rzby = P1[2] + m*(by - P1[1]);
            checks+=(bz <= Rzby && Rzby <= az);
        }
        if(checks==2){
            var Rzay = P1[2] + m*(ay - P1[1]);
            checks+=(bz <= Rzay && Rzay <= az);
        }  
        if(checks==2){
            m = V1[1]/V1[2];
            var Rybz = P1[1] + m*(bz - P1[2]);
            checks+=(by <= Rybz && Rybz <= ay);
        }
        if(checks==2){
            var Ryaz = P1[1] + m*(az - P1[2]);
            checks+=(by <= Ryaz && Ryaz <= ay);
        } 

        return checks==3?this.explore(V1, P1):[];
    }
    get explore(){
        return this.explore();
    }
    //Finds ray intersection
    explore(rayVector, rayLocation){
        var result = [];
        this.children.forEach(v =>{
            //If the hirearchy goes into a BVH, explore it
            if(v.name == 'BBVH'){
                Array.prototype.push.apply(result, v.intersect(rayVector, rayLocation));
            }
            //If the hirarchy is at the bottom, find the triangle intersection
            else{
                var temp = rayTriITP(rayVector, rayLocation, v);
                temp?temp.push(this.depth):temp;
                temp?temp.push(this.depth2):temp;
                temp?result.push(temp):temp;
            }
        })
        return result;
    }
}

export {face, BBVH};