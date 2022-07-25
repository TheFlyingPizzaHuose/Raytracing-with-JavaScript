//determinand 100%
function det(matrix){
	if(matrix.length == 4){
		return matrix[0]*matrix[3] - matrix[1]*matrix[2]
	}else if(matrix.length == 9){
	/*012
	  345
	  678*/
	var First = matrix[4]*matrix[8] - matrix[7]*matrix[5];
	var Second = matrix[3]*matrix[8] - matrix[6]*matrix[5];
	var Third = matrix[3]*matrix[7] - matrix[6]*matrix[4];

	return matrix[0]*First - matrix[1]*Second + matrix[2]*Third;
	}else{
		throw matrix + " is not a valid matrix, it has length: " + matrix.length;
	}
}

//calculate midpoint of two vertecies 100%
function midPoint(vector1, vector2){
	var result = [];
    vector1.forEach((value,i)=>{
		result[i] = (value+vector2[i])/2
	})
	return result;
}

//convert 3d to 2d vectors 100%
function vector3To2(vector1, vector2){

	//gets distances per axis of the vectors
  	var Xdistance = vector1[0] - vector2[0];
	var Ydistance = vector1[1] - vector2[1];
	var XYdistance = vectorDistance([vector1[0], vector1[1], 0], [vector2[0], vector2[1], 0]);
	var Zdistance= vector1[2] - vector2[2];

	//converts to 2d
	return [Math.atan(Ydistance/Xdistance, tanTable), Math.atan(Zdistance/XYdistance, tanTable), 0];
}

//subtract vector 100%
function vectorSubtract(vector1, vector2){return vector1.map((value, index)=> value-vector2[index]);}

//subtract vector 100%
function vectorAdd(vector1, vector2){return vector1.map((value, index)=> value+vector2[index]);}

//gets distance of two points PIECEWISE 100%
function vectorDistance(point1, point2){return point1.map((v,i)=>Math.pow(point2[i]-v,2)).reduce((prev,v)=>prev+v);}


//calculate crossProduct 100%
function crossProduct(vector1, vector2){
	var cX = vector1[1]*vector2[2] - vector1[2]*vector2[1];
	var cY = vector1[2]*vector2[0] - vector1[0]*vector2[2];
	var cZ = vector1[0]*vector2[1] - vector1[1]*vector2[0];
	return [cX,cY,cZ];
}

//calculate apparent size based on distance 100%
function distanceScale(vector1, vector2, scale){
	var distance = vectorDistance(vector1, vector2);
	return scale/(2 * Math.PI * distance) * 360;
}

//solve systems of equations using cramers rule 100%
function cramerSolve(constants, coeffitients, solveYZ=true){
	/*012
      345
      678*/
	var D = 1/det(coeffitients);
	var DX = det([constants[0], coeffitients[1], coeffitients[2], 
				  constants[1], coeffitients[4], coeffitients[5], 
				  constants[2], coeffitients[7], coeffitients[8]]);
	if(solveYZ){
		var DY = det([coeffitients[0], constants[0], coeffitients[2], 
					coeffitients[3], constants[1], coeffitients[5], 
					coeffitients[6], constants[2], coeffitients[8]]);
		var DZ = det([coeffitients[0], coeffitients[1], constants[0], 
					coeffitients[3], coeffitients[4], constants[1], 
					coeffitients[6], coeffitients[7], constants[2]]);
		return [DX*D, DY*D, DZ*D];
	}else{
		return DX*D;
	}
}

//calculate multiplying vector by scalar
function vectorScalar(vector1, mult){return vector1.map(value=> value*mult);}

//convert degrees to radians
function degToArc(angle){return angle*Math.PI/180;}

//Converts X,Y values to index value
function xyToIndex(X,Y,width){return (X+(Y*width))*4}

//Converts 3d coordinates to spherical coordinates
function vector3to2(vector1){return [Math.atan(vector1[1]/vector1[0]), Math.atan(vector1[2]/vectorMagnitude([vector1[0], vector1[1]]))]}

//gets vector length
function vectorMagnitude(vector){return Math.sqrt(vector.map(v=>Math.pow(v,2)).reduce((prev,v)=>prev+v));}

//calculate angle between 2 vectors
function vectorsToAngle(vector1, vector2){
	var A = vectorMagnitude(vector1);
	var B = vectorMagnitude(vector2);
	return Math.acos(dotProduct(vector1, vector2)/(A*B));
}

//dot product of 2 vectors
function dotProduct(vector1, vector2){return vector1.map((v,i)=>v*vector2[i]).reduce((prev,v)=>prev+v);}

//compares two arrays
function arrayEqual(arr1, arr2){
	arr1.forEach((value, index)=>{if(value!=arr2[index]){return false}})
	return true
}


export {dotProduct, vectorMagnitude ,arrayEqual, vectorsToAngle, vector3to2, xyToIndex, degToArc, det, midPoint, vector3To2, vectorSubtract, vectorAdd, vectorScalar, vectorDistance, crossProduct, distanceScale, cramerSolve};