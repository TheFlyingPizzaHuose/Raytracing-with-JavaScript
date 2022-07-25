import {vectorSubtract, vectorMagnitude, vectorAdd, vectorScalar, vectorDistance, cramerSolve, vectorsToAngle, dotProduct} from './math.js';

//calculate reflection normal 100%
function reflectRay(R, face){
	var P1 = R;
	var V1 = face.normal;
	var percent = -2*dotProduct(R, V1)/Math.pow(vectorMagnitude(V1),2)
	var reverser = vectorScalar(V1, percent)
	var loc = vectorAdd(P1, reverser)
	//Calculate fresnel power
	var theta = vectorsToAngle(loc, V1)%(Math.PI/2)
	var preTheta2 = 1.7*Math.sin(theta)
	preTheta2=preTheta2>1?1:preTheta2
	preTheta2=preTheta2<-1?-1:preTheta2
	var theta2 = Math.asin(preTheta2)
	var power = -Math.sin(theta-theta2)/Math.sin(theta+theta2)

	return [loc,power];
}

//check if ray intersects with face and gets bounce location 50%
function rayTriITP(V1, P1, Data, BVH){
	var result = [];
	var indexes = [];
	var V2, V3, P2, ABC;

	//check for BVH intersection
	BVH.forEach((box, index)=>{
		for(var i=0; i<box.length; i++){
			V2 = box[i].e1;
			V3 = box[i].e2;
			P2 = box[i].v1;
			ABC = cramerSolve(vectorSubtract(P2, P1), [V1[0],-V2[0], -V3[0], V1[1],-V2[1], -V3[1],V1[2],-V2[2], -V3[2]]);
			/*check if intersection is present*/
			if(0 <= ABC[1] && 0 <= ABC[2] && ABC[1] <= 1 && ABC[2] <= 1){
				indexes.push(index);
				break;
			}
		}
	})

	//if BVH intersection(s) is present, find triangle intersection
	if(indexes.length != 0){
		indexes.forEach((index)=>{
			(Data[index]).forEach((v, i)=>{
				V2 = v.e1;
				V3 = v.e2;
				P2 = v.v1;
				ABC = cramerSolve(vectorSubtract(P2, P1), [V1[0],-V2[0], -V3[0], V1[1],-V2[1], -V3[1],V1[2],-V2[2], -V3[2]]);
				/*check if intersection is present*/
				var temp = ABC[1] + ABC[2];
				if(temp <= 1 && 0 <= ABC[1] && 0 <= ABC[2] && 0 <= ABC[0]){
					var loc = vectorAdd(vectorScalar(V1, ABC[0]*0.999999999),P1);
					result.push([loc[0], loc[1], loc[2], i, index, vectorDistance(P1, loc)]);
				}
			})
		})
	}else{
		return false;
	}
	//Get closest intersection
	var lowestDist = 1000000;
	var finalIndex = 0;
	if(result.length > 0){
		result.forEach((w, index)=>{
			if(w[5] < lowestDist){
				lowestDist = w[5];
				finalIndex = index;
			}
		})
		return result[finalIndex];
	}else{
		return false;
	}
}

//Calculate fresnel color
function fresCol(bounces){
	var final = 255
	for(var i=bounces.length-1; i>=0; i--){
		final = final*(1-bounces[i][1]) + bounces[i][0]*bounces[i][1]
	}
	return final
}


export {reflectRay, rayTriITP, fresCol};