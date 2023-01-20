import {vectorSubtract, crossProduct, dotProduct, vectorScalar, vectorAdd, vectorMagnitude, vectorDistance} from'./math.js';
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
        this.com = vectorScalar(1/3, vectorAdd(v1,vectorAdd(v2,v3)));
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

class SBVH{
    constructor(data, center=false, radius=false){
        this.name = 'SBVH'
        var sph1 = center?false:minSphere(data);//checks if center has value
        this.center = sph1?sph1[0]:center;
        this.radius = sph1?sph1[1]:radius;
        this.children = this.generate(data);
    }
    get generate(){return this.generate();}
    generate(data){
        if (data.length<10){return data}
        var subGrp = [];
        var point = this.center;
        var searchData = data;
        while(subGrp.length<data.length * 0.9){//selects triangles
            var nextTriInd = minTriInd(point,searchData);
            subGrp.push(searchData[nextTriInd]);
            searchData.splice(nextTriInd,1);
            point = searchData[nextTriInd].com;
        }
        var actSelec = [data];
        var sph1;
        while(actSelec[0].length > (data.length * 0.9) && subGrp.length>0){
            sph1 = minSphere(subGrp);
            actSelec = insSph(sph1[0], sph1[1], data);
            if(actSelec[0].length>(data.length * 0.9)){//deselect 10%
                var cullIndex = parseInt((subGrp.length-1) * 0.9);
                subGrp = subGrp.splice(0, cullIndex);
            }
            if(subGrp.length == 0 && actSelec[0].length <data.length){
                break;
            }else if (subGrp.length == 0){
                return data;
            }
        }
        subGrp = [];
        var topGrp = [];
        for(var i = 0; i < data.length; i++){
            switch (actSelec[1][i]){
                case 0:
                    topGrp.push(data[i]);
                case 1,2:
                    topGrp.push(data[i]);
                    subGrp.push(data[i]);
                case 3:
                    subGrp.push(data[i]);
            }
        }
        var temp = [new SBVH(subGrp, sph1[0], sph1[1])]
        console.table(subGrp.length, topGrp.length,data.length, sph1)
        Array.prototype.push.apply(temp, topGrp);
        return temp
    }
    get intersect(){return this.intersect();}
    intersect(V1, P1){
        var R = vectorSubtract(this.center, P1);
        var B = vectorAdd(vectorScalar(V1, dotProduct(R,V1)/Math.pow(vectorMagnitude(V1),2)),P1)
        var rad = vectorDistance(B,this.center);
        return rad<this.radius?this.explore(V1, P1):[];
    }
    get explore(){return this.explore();}
    //Finds ray intersection
    explore(rayVector, rayLocation){
        var result = [];
        this.children.forEach(v =>{
            //If the hirearchy goes into a BVH, explore it
            if(v.name == 'SBVH'){
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

function minSphere(data, d=0.01){
    var C = [0,0,0];
    var pnts = [];
    for(var i = 0; i < data.length;i++){
        Array.prototype.push.apply(pnts, [data[i].v1, data[i].v2, data[i].v3]);
        C = vectorAdd(C, data[i].v1);
        C = vectorAdd(C, data[i].v2);
        C = vectorAdd(C, data[i].v3);
    }
    C = vectorScalar(C, 1/pnts.length);//Gets point bounding box center
    var moveDist = 10,selCord = 0,skipNum = 0,preSign = 0, gamma = 4;
    while(skipNum < 3){
        //calculate derivative
        var d0 = maxDist(C, pnts);
        var derivative = gamma*(maxDist(dInc(selCord, C, d), pnts) - d0)/d
        //calculate 0 intercept
        var move = -C[selCord]/derivative
        var moveDist = move - C[selCord]
        C[selCord] = move + Math.round(Math.random()*2-1)*gamma*d;//Gradient "jiggle"
        if(isNaN(moveDist)){
            console.log(C);
            console.table([C, d0, derivative, move, moveDist])
            break;
        }
        preSign = preSign == 0?Math.sign(moveDist):preSign
        if (Math.abs(moveDist) < d*gamma || preSign/Math.sign(moveDist) == -1){
            preSign = 0
            skipNum++;
            if(selCord == 2){
                selCord = 0
            }else{
                selCord++;
            }
        }else{
            skipNum = 0
        }
    }
    return [C, maxDist(C, pnts)];
}

function dInc(index, p, d){
    var temp = p
    temp[index] += d;
    return temp;
}

function maxDist(point, points){
    return Math.max(... new Set(points.map(v=>vectorDistance(v, point))));
}

function minTriInd(point, data){
    var ind = 0;
    var min = vectorDistance(point, data[0].com);
    for (var i = 1; i < data.length; i++){
        var dist = vectorDistance(point, data[i].com);
        min = dist<min?dist:min;
        ind = dist<min?i:ind;
    }
    return ind
}

function insSph(center, radius, data){
    var result = [];
    var fulIn = [];
    for (var i = 0; i < data.length; i++){
        var isIn = 0;
        isIn += vectorDistance(data[i].v1, center)<radius;
        isIn += vectorDistance(data[i].v2, center)<radius;
        isIn += vectorDistance(data[i].v3, center)<radius;
        fulIn.push(isIn);
        if(isIn){result.push(data[i])}
    }
    return [result, fulIn];
}

export {face, BBVH, SBVH};
