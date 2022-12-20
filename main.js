import {BBVH, face} from './js/classes.js';
import {reflectRay, rayTriITP, fresCol, sceneXplor} from './js/raytracing.js';
import {degToArc, vectorAdd, vectorScalar, xyToIndex, arrayEqual, vectorSubtract, vector3to2} from './js/math.js'
import * as objParse from './obj-file-parser/dist/OBJFile.js';
import {decode} from './jpeg-js-master/lib/decoder.js'

var debugMode = false;
var ordered = true;
var bounces = 20;
var frameCap = 1000/24
//create canvas objects
var ctx = document.getElementById("screen");
var c = ctx.getContext("2d");
var graph = document.getElementById('Frametime'),  graphc = document.getElementById('Frametime').getContext("2d");;
var width = ctx.width;
var height = ctx.height;

//Debug variables
var renderStart=0,raySinceFrame = 0,timeSinceLastFrame=0,hasErr=false,countsSinceLastErr=0,showDebug=true, frameTimeGraph=[];
//Texture variables
var textures=[],textCoords=[],texturesAlpha=[];

var sceneData = [];
var cameraPer=[1,0,0],cameraVector3=[0,1,0],cameraVer=[0,0,-1];
var cameraLocation = [0, -7, 1];
var fov = 70;
var fovRation = Math.sin(degToArc(fov));

var empty = new Array(width*height*4).fill(0), result1 = empty;
var result2 = new Uint8ClampedArray(new Array(width*height*4).fill(0))
var traced = new Array(width*height).fill(0), tracedNum = 0;

importTexture('./textures/venice_sunset_8k.jpg', 0);
for(var i = 0; i<10;i++){
	break;
	var temp = [(Math.random()*5)-2.5,(Math.random()*5)-2.5,1];
	selfImport({file: './models/Planet.obj', 
				color: [Math.random()*255,Math.random()*255,Math.random()*255],
				offset: temp,
				scale: 0.75});
}
selfImport({file: './models/RaytracingJS2.obj', color: [255,255,0], scale: 10, offset: [0,0,0]})
selfImport({file: './models/dragon.obj', color: [0,100,0], scale: 0.2})
//selfImport({file: './models/bunny.obj', color: [255,0,0], scale: 0.5})

//Different browser settings
if(/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
	var start=[]
	//Gets starting touch position
	window.addEventListener('touchstart', function(e) {
		var music = document.getElementById('music');
		music.play();
		// Cache the client X/Y coordinates
		start = [e.touches[0].clientX, e.touches[0].clientY]
	}, false);
	//Gets postion relative to old position and replaces old position
	window.addEventListener('touchmove', function(e) {
		cameraRotate(-(e.touches[0].clientX-start[0])*document.getElementById('sens').value, -(e.touches[0].clientY-start[1])*document.getElementById('sens').value)
		start = [e.touches[0].clientX, e.touches[0].clientY]
	}, false);
	//Key board event listeners	
	document.addEventListener('keydown', logKeyMobile);
}else{	
	//Mouse Movement Setup
	ctx.requestPointerLock = ctx.requestPointerLock || ctx.mozRequestPointerLock;
	ctx.requestPointerLock();
	document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
	ctx.onclick = function() {
		ctx.requestPointerLock();
	};
	document.addEventListener('pointerlockchange', lockChangeAlert, false);
	document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
	function lockChangeAlert() {
		if (document.pointerLockElement === ctx ||
			document.mozPointerLockElement === ctx) {
			var music = document.getElementById('music');
			music.play();	
			document.addEventListener("mousemove", updatePosition, false);
		} else { 
			document.removeEventListener("mousemove", updatePosition, false);
		}
	}
	//Key board event listeners	
	document.addEventListener('keydown', logKey);
	document.addEventListener('keyup', logKey2);
	function updatePosition(e) {
		cameraRotate(e.movementX*document.getElementById('sens').value, e.movementY*document.getElementById('sens').value)
	}
}

//Begins render
setTimeout(function(){
	console.log(sceneData);
	if(debugMode != false){ 
		for(var i=0; i<debugMode; i++){
			render()
		}
	}else{
		setInterval(getFramerate, 1);
		setInterval(render, frameCap);
	}
},2000)

//Key press detection
var moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown, tiltLeft, tiltRight, increaseSpeed, decreaseSpeed;
var movementSpeed = 1;
var moving = true;
function logKey(e) {
	switch(e.code){
		case 'KeyM':
			showDebug = showDebug? false: true;
			break;
		case 'KeyW':
			moveForward = true;
			break;	
		case 'KeyS':
			moveBackward = true;
			break;
		case 'KeyA':
			moveLeft = true;
			break;
		case 'KeyD':
			moveRight = true;
			break;
		case 'KeyQ':
			tiltLeft = true;
			break;
		case 'KeyE':
			tiltRight = true;
			break;	
		case 'Space':
			moveUp = true;
			break;
		case 'ShiftLeft':
			moveDown = true;
			break;
		case 'KeyZ':
			increaseSpeed = true;
			break;
		case 'KeyX':
			decreaseSpeed = true;
			break;
	}
}
function logKey2(e) {
	switch(e.code){
		case 'KeyW':
			moveForward = false;
			break;	
		case 'KeyS':
			moveBackward = false;
			break;
		case 'KeyA':
			moveLeft = false;
			break;
		case 'KeyD':
			moveRight = false;
			break;
		case 'KeyQ':
			tiltLeft = false;
			break;
		case 'KeyE':
			tiltRight = false;
			break;	
		case 'Space':
			moveUp = false;
			break;
		case 'ShiftLeft':
			moveDown = false;
			break;
		case 'KeyZ':
			increaseSpeed = false;
			break;
		case 'KeyX':
			decreaseSpeed = false;
			break;
	}
}
function logKeyMobile(e) {
	switch(e.code){
		case 'KeyW':
			moveForward = moveForward? false: true;
			break;	
		case 'KeyS':
			moveBackward = moveBackward? false: true;
			break;
		case 'KeyA':
			moveLeft = moveLeft? false: true;
			break;
		case 'KeyD':
			moveRight = moveRight? false: true;
			break;
		case 'KeyQ':
			tiltLeft = tiltLeft? false: true;
			break;
		case 'KeyE':
			tiltRight = tiltRight? false: true;
			break;	
		case 'Space':
			moveUp = moveUp? false: true;
			break;
		case 'ShiftLeft':
			moveDown = moveDown? false: true;
			break;
		case 'KeyZ':
			increaseSpeed = increaseSpeed? false: true;
			break;
		case 'KeyX':
			decreaseSpeed = decreaseSpeed? false: true;
			break;
	}
}

//draw image on screen function 
function display(image){
	var canvasImage = c.createImageData(width, height);
	canvasImage.data.set(image);
	c.putImageData(canvasImage, 0, 0);
}

//fills image data array with single color
function fillScreen(R, G, B){
	var c = document.getElementById("screen");
	var result = [];
	for (var h=0; h<height; h++){
		for (var w=0; w<width; w++){
			var i = ((h*width) + w) * 4;
			result[i    ] = R;
			result[i + 1] = G;
			result[i + 2] = B;
			result[i + 3] = 255;
		}
	}
	return result;
}

//###########################################Render functions###########################################

//render method
function raytrace(bounces){
	if (moving){
		result2 = new Uint8ClampedArray(new Array(width*height*4).fill(0))
		traced = new Array(width*height).fill(0);
		renderStart = window.performance.now()
		tracedNum = 0;
		moving = false
	}
	//Gets full render time
	if(!(tracedNum < width*height) && renderStart){
		console.log((window.performance.now() - renderStart)/1000);
		renderStart = false;
	}
	result1 = empty;

	cameraMove();
	//sets ray x degrees
	for(i=0; i<height*width; i++){
		var foundRay = false
		var start = 1, end = 1000
		while(!foundRay && timeSinceLastFrame<frameCap && tracedNum < width*height){
			//Renders in a top down order
			if(ordered){
				var displayPosition = tracedNum*4;
				var x = tracedNum%width
				var y = Math.floor(tracedNum/width);
				foundRay = true
				break;
			}
			//Renders in a random order
			start = window.performance.now()
			var x = parseInt(Math.random()*width)
			var y = parseInt(Math.random()*height)
			var displayPosition = (x + (y * width))*4;
			foundRay = traced[displayPosition/4]==0?true:false;
			end = window.performance.now()
			timeSinceLastFrame+=end-start;
		}
		if(timeSinceLastFrame<frameCap && foundRay){
			traced[displayPosition/4]=1
			raySinceFrame++;
			tracedNum++;
			start = window.performance.now()

			//Sets begining state
			var rayLocation = cameraLocation;
			var rayVector = vectorAdd(vectorScalar(cameraVer,fovRation*y/width-0.25), vectorAdd(cameraVector3, 
										vectorScalar(cameraPer,fovRation*x/width-0.5)));

			//sets colors to 0,0,0
			result1[displayPosition] 	= [];
			result1[displayPosition + 1] = [];
			result1[displayPosition + 2] = [];
			result2[displayPosition + 3] = 255;

			//bounces x amount of times			
			for(var w = 0; w < bounces; w++){

				//checks if ray did indded get a bounce
				var temp = sceneXplor(rayVector, rayLocation, sceneData);
				//break;
				
				if(temp != false && w < bounces-1){
					//updates ray info
					rayLocation = [temp[0], temp[1], temp[2]];
					var rayTemp = reflectRay(rayVector, temp[3]);
					rayVector = rayTemp[0]

					//changes ray color
					result1[displayPosition].push([temp[3].color[0],rayTemp[1]]);
					result1[displayPosition+1].push([temp[3].color[1],rayTemp[1]]);
					result1[displayPosition+2].push([temp[3].color[2],rayTemp[1]]);
				}else{
					temp = vector3to2(rayVector);
					temp = vectorScalar(temp,180/Math.PI);
					var x = parseInt((temp[0]+70)/180*textures[0].width);
					var y = parseInt((-temp[1]/180+0.5)*textures[0].height);
					var texPos = (x + (y * textures[0].width))*4;
					result2[displayPosition]   = fresCol(result1[displayPosition], textures[0].data[texPos])
					result2[displayPosition+1] = fresCol(result1[displayPosition+1], textures[0].data[texPos+1])
					result2[displayPosition+2] = fresCol(result1[displayPosition+2], textures[0].data[texPos+2])
					break;
				}
			}
			end = window.performance.now()
			timeSinceLastFrame+=end-start;
		}else{
			display(result2);
			frameTimeGraph=[timeSinceLastFrame, ...frameTimeGraph].slice(0,100)
			return
		}
	}
	//draws image
	display(result2);
}

//render timed
function render(){
	ctx.width = document.getElementById('resolutionX').value;
	width = ctx.width;
	ctx.height = document.getElementById('resolutionY').value;
	height = ctx.height;
	fov = document.getElementById('fov').value

	//Hides or unhides debug elements
	var displayMode = showDebug?'inline':'none'
	var colorMode = showDebug?'orange':'black'
	document.getElementById('Framerate').setAttribute('style', 'color: '+colorMode)
	document.getElementById('Rayrate').setAttribute('style', 'color: '+colorMode)
	try{
		document.getElementById('settings').setAttribute('style', 'display: '+displayMode)
	}catch{
	}
	document.getElementById('inputLabel').setAttribute('style', 'display: '+displayMode)
	document.getElementById('keys').setAttribute('style', showDebug?'width: 20px; display: inline; float: none':'display: none')

	raytrace(bounces);
	
	dispTime()
}

//displays frametimes
function dispTime(){
	var result = new Uint8ClampedArray((new Array(graph.width*graph.height*4).fill(0)))
	var graphPeak = Math.max(...frameTimeGraph)
	var previousYval = graph.height-1
	for(var i=graph.width;i>=0;i--){
		var yValue = parseInt(graph.height*(1-frameTimeGraph[i]/graphPeak))
		if(yValue<previousYval){
			for(var x=yValue; x<previousYval;x++){
				result.set([255,0,0,255],xyToIndex(i,x, graph.width))
			}
			previousYval=yValue
		}else{
			result.set([255,0,0,255],xyToIndex(i,yValue, graph.width))
			previousYval=yValue
		}
	}
	var canvasImage = graphc.createImageData(graph.width, graph.height);
	canvasImage.data.set(result);
	graphc.putImageData(canvasImage, 0, 0);
}

//gets framerate and displays
function getFramerate(){
	document.getElementById('Rayrate').textContent = 'Rayrate: ' + (raySinceFrame*1000/timeSinceLastFrame).toFixed(2) + ' '
	if(!hasErr){
		document.getElementById('Framerate').textContent = 'Framerate: ' + (1000/timeSinceLastFrame).toFixed(2) + ' '
	}else{
		nothing();
	}
	if(countsSinceLastErr<10){
		countsSinceLastErr++
	}else{
		countsSinceLastErr=0
		hasErr=false
	}
	timeSinceLastFrame = 1;
	raySinceFrame = 0;
}
//###########################################Render functions###########################################
//###########################################Camera Math###########################################
//moves camera
function cameraMove(){
	increaseSpeed? movementSpeed*=1.1: nothing();
	decreaseSpeed? movementSpeed=movementSpeed/1.1: nothing();
	moveForward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, 0.1*movementSpeed)): nothing();
	moveBackward? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVector3, -0.1*movementSpeed)): nothing();
	moveLeft? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPer, -0.1*movementSpeed)): nothing();
	moveRight? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraPer, 0.1*movementSpeed)): nothing();
	moveUp? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVer, -0.1*movementSpeed)): nothing();
	moveDown? cameraLocation = vectorAdd(cameraLocation, vectorScalar(cameraVer, 0.1*movementSpeed)): nothing();
	if (moveForward || moveBackward || moveLeft || moveRight || moveUp || moveDown){
		moving = true
	}
}
//turns camera
function cameraRotate(X=0, Y=0){
	if(X!=0 || Y!=0 || tiltLeft || tiltRight){
		moving = true
	}
	//Perform roll
	var arcX = degToArc(X), arcY = degToArc(Y)
	var tempVer = tiltRight? vectorAdd(vectorScalar(cameraVer, Math.sin(degToArc(91))), vectorScalar(cameraPer, Math.cos(degToArc(91)))): cameraVer
	var tempPer = tiltRight? vectorAdd(vectorScalar(cameraVer, Math.sin(degToArc(1))), vectorScalar(cameraPer, Math.cos(degToArc(1)))): cameraPer
	tempVer = tiltLeft? vectorAdd(vectorScalar(tempVer, Math.sin(degToArc(89))), vectorScalar(tempPer, Math.cos(degToArc(89)))): tempVer
	tempPer = tiltLeft? vectorAdd(vectorScalar(tempVer, Math.sin(degToArc(-1))), vectorScalar(tempPer, Math.cos(degToArc(-1)))): tempPer
	//Perform yaw
	var tempV3 = vectorAdd(vectorScalar(cameraVector3, Math.cos(arcX)), vectorScalar(tempPer, Math.sin(arcX)))
	tempPer = vectorAdd(vectorScalar(cameraVector3, Math.cos(arcX+Math.PI/2)), vectorScalar(tempPer, Math.sin(arcX+Math.PI/2)))
	var tempV32 = tempV3
	//Perform pitch
	tempV3 = vectorAdd(vectorScalar(tempV32, Math.cos(arcY)), vectorScalar(tempVer, Math.sin(arcY)))
	tempVer = vectorAdd(vectorScalar(tempV32, Math.cos(arcY+Math.PI/2)), vectorScalar(tempVer, Math.sin(arcY+Math.PI/2)))
	//Finalizes
	cameraVector3 = tempV3
	cameraPer = tempPer
	cameraVer = tempVer
}

//###########################################Camera Math###########################################

//self import file
function selfImport(object, userMode=false)
{
	//Checks if object variables are undefined
	var file=object.file,
		offset=object.offset!=undefined?object.offset:[0,0,0], 
		scale=object.scale!=undefined?object.scale:1, 
		isEmmision=object.isEmmision!=undefined?object.isEmmision:false, 
		isBackground=object.isBackground!=undefined?object.isBackground:false, 
		LOD=object.LOD!=undefined?object.LOD:false,
		roughness=object.roughness!=undefined?object.roughness:3,
		textureIndex=object.textureIndex!=undefined?object.textureIndex:0,
		color=object.color!=undefined?object.color:[255,0,255]
	var rawFile = new XMLHttpRequest();
	var allText=file;
	if(!userMode){
		rawFile.open("GET", file, false);
		rawFile.onreadystatechange = function ()
		{
			if(rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status == 0))
			{
				allText = new Blob([rawFile.responseText]);
			}
		}
		rawFile.send(null);
	}
	const fr = new FileReader();
	//convert the file into text
	fr.addEventListener('load', (event)=>{

		//convert the text into .OBJ object
		const obj = new objParse.OBJFile(event.target.result);
		var content = obj.parse().models[0];

		//select faces
		var objectData = [];
		content.faces.forEach((value, index)=>{
			var indexes = [];

			//get indexes of verticies for the face
			value.vertices.forEach((value2)=>{
				indexes.push(value2.vertexIndex);
			})

			//get vertex values
			var ver1 = vectorAdd(vectorScalar(Object.values(content.vertices[indexes[0]-1]),scale),offset);
			var ver2 = vectorAdd(vectorScalar(Object.values(content.vertices[indexes[1]-1]),scale),offset);
			var ver3 = vectorAdd(vectorScalar(Object.values(content.vertices[indexes[2]-1]),scale),offset);

			//add face to objectData
			objectData.push(new face(1, color, ver1, ver3, ver2));
		})
		//create bounding cube
		//var C = vectorScalar(vectorAdd(upperCorner, lowerCorner), 0.5); //bounding box center
		sceneData.push(new BBVH(objectData, 0));
		
		//display that another object has been imported 
		console.log('import success');
	});
	fr.readAsText(allText);
}
//Self import texture
function importTexture(path, ind, isAlpha){
	var oReq = new XMLHttpRequest();
	oReq.open("GET", path, true);
	oReq.responseType = "arraybuffer";

	oReq.onreadystatechange = function (){
		if(oReq.readyState === 4 && (oReq.status === 200 || oReq.status == 0))
		{
			var arrayBuffer = oReq.response;
			if (arrayBuffer) {
				var byteArray = new Uint8Array(arrayBuffer);
				var rawImageData = decode(byteArray, {useTArray:true});
				if(isAlpha){
					var temp = texturesAlpha
					temp[ind] = rawImageData
					texturesAlpha = temp
				}else{
					var temp = textures
					temp[ind] = rawImageData
					textures = temp
				}
			}
		}
	};
	oReq.send(null);
}

function nothing(){
	return null;
}