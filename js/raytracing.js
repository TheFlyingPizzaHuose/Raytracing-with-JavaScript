import {gaussianSolve, vectorSubtract, vectorMagnitude, vectorAdd, vectorScalar, vectorDistance, cramerSolve, vectorsToAngle, dotProduct} from './math.js';

//calculate reflection normal 100%
function reflectRay(R, face){
	var P1 = R;
	var V1 = face.normal;
	var percent = -2*dotProduct(R, V1)/Math.pow(vectorMagnitude(V1),2)
	var reverser = vectorScalar(V1, percent)
	var loc = vectorAdd(P1, reverser)
	//Calculate fresnel power
	var theta = vectorsToAngle(loc, V1)%(Math.PI/2)
	//console.log(theta)
	/*
	var preTheta2 = 1.01*Math.sin(theta)
	preTheta2=preTheta2>1?1:preTheta2
	preTheta2=preTheta2<-1?-1:preTheta2
	var theta2 = Math.asin(preTheta2)
	var power = Math.tan(theta-theta2)/Math.tan(theta+theta2)-Math.sin(theta-theta2)/Math.sin(theta+theta2); 
	*/
	var power = Math.pow(Math.abs(theta/Math.PI),0.5)
	return [loc,power];
}

//check if ray intersects with face and gets bounce location 50%
function rayTriITP(V1, P1, T){
	//if BVH intersection(s) is present, find triangle intersection
	var V2 = T.e1;
	var V3 = T.e2;
	var P2 = T.v1;
	var ABC;
	ABC = gaussianSolve(vectorSubtract(P2, P1), [V1[0],-V2[0], -V3[0], V1[1],-V2[1], -V3[1],V1[2],-V2[2], -V3[2]]);
	/*check if intersection is present*/
	var temp = ABC[1] + ABC[2];
	if(temp <= 1 && 0 <= ABC[1] && 0 <= ABC[2] && 0 <= ABC[0]){
		var loc = vectorAdd(vectorScalar(V1, ABC[0]*0.99999999),P1);
		return [loc[0], loc[1], loc[2], T, vectorDistance(P1, loc)];
	}else{
		return false;
	}
	//Get closest intersection
}

//itterate through object BVH's
function sceneXplor(rayVector, rayLocation, sceneData){
	var result = [];
	sceneData.forEach(v =>{
		Array.prototype.push.apply(result, v.intersect(rayVector, rayLocation, 0));
	})
	var lowestDist = 1000000;
	var finalIndex = 0;
	if(result.length > 0){
		result.forEach((w, index)=>{
			if(w[4] < lowestDist){
				lowestDist = w[4];
				finalIndex = index;
			}
		})
		return result[finalIndex];
	}else{
		return false;
	}
}

//Calculate fresnel color
function fresCol(bounces, sky){
	var final = sky
	for(var i=bounces.length-1; i>=0; i--){
		final = final*(1-bounces[i][1]) + bounces[i][0]*bounces[i][1]
	}
	return final
}


export {reflectRay, rayTriITP, fresCol, sceneXplor};