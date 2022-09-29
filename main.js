import {face} from './js/classes.js';
import {reflectRay, rayTriITP, fresCol} from './js/raytracing.js';
import {degToArc, vectorAdd, vectorScalar, xyToIndex, arrayEqual} from './js/math.js'
import * as objParse from './obj-file-parser/dist/OBJFile.js';

var debugMode = false;
var frameCap = 1000/24
//create canvas objects
var ctx = document.getElementById("screen");
var c = ctx.getContext("2d");
var graph = document.getElementById('Frametime'),  graphc = document.getElementById('Frametime').getContext("2d");;
var width = ctx.width;
var height = ctx.height;

//temporary variable assignments
let test = [new face(1, [255,0,0], [-0.706398,6.57358,-0.210624],[0.962642,5.67513,-0.015534],[0.376032,4.96034,-0.405714])];
let test2 = [new face(1, [0,0,255], [0.265035,4.27993,0.463644],[0.503704,5.77224,-0.772596],[-0.141839,6.06564,-0.062336])];
//Debug variables
var frameCounter=0,timeSinceLastFrame=0,vertexCount=0,hasErr=false,countsSinceLastErr=0,showDebug=true, frameTimeGraph=[];

var sceneData = [test, test2]; 
var bvh = [test, test2];
var cameraPer=[1,0,0],cameraVector3=[0,1,0],cameraVer=[0,0,-1];
var cameraLocation = [0, 0, 0];
var fov = 70;
var fovRation = Math.sin(degToArc(fov))
var imported = ["test1 (0), ", "test2 (1), ", ];

var result1 = new Array(width*height*4).fill(0)
var result2 = new Uint8ClampedArray(new Array(width*height*4).fill(0))
var traced = new Array(width*height).fill(0)

selfImport({file: './models/RaytracingJS.obj', color: [0,255,0]})
selfImport({file: './models/RaytracingJS2.obj', color: [255,255,0]})

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
		moving = false
		console.log('moving')
	}
	result1 = new Array(width*height*4).fill(0)
	traced = new Array(width*height).fill(0)

	cameraMove();
	cameraRotate();
	var lastWasItt = false;
	var x,y;
	var displayPosition;
	//sets ray x degrees
	for(var i=0; i<height*width; i++){
		var foundRay = false;
		if(lastWasItt){
			x++
			foundRay = true;
			lastWasItt = false;
			displayPosition = (x + (y * width))*4;
		}
		while(!foundRay){
			x = parseInt(Math.random()*width)
			y = parseInt(Math.random()*height)
			displayPosition = (x + (y * width))*4;
			foundRay = traced[displayPosition/4]==0?true:false
		}
		if(timeSinceLastFrame<frameCap){
			traced[displayPosition/4]=1
			var start = 1, end = 1000
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
				var temp = rayTriITP(rayVector, rayLocation, sceneData, bvh);

				lastWasItt = temp?true:false;
				if(temp != false){
					//updates ray info
					var itpFace = sceneData[temp[4]][temp[3]];
					rayLocation = [temp[0], temp[1], temp[2]];
					var rayTemp = reflectRay(rayVector, itpFace);
					rayVector = rayTemp[0]

					//changes ray color
					result1[displayPosition].push([itpFace.color[0],rayTemp[1]]);
					result1[displayPosition+1].push([itpFace.color[1],rayTemp[1]]);
					result1[displayPosition+2].push([itpFace.color[2],rayTemp[1]]);
				}else{
					result2[displayPosition]   = fresCol(result1[displayPosition])
					result2[displayPosition+1] = fresCol(result1[displayPosition+1])
					result2[displayPosition+2] = fresCol(result1[displayPosition+2])
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
	document.getElementById('importedObjects').textContent = "Imported OBJs: " + imported;
	ctx.width = document.getElementById('resolutionX').value;
	width = ctx.width;
	ctx.height = document.getElementById('resolutionY').value;
	height = ctx.height;
	fov = document.getElementById('fov').value

	raytrace(12);
	
	dispTime()
	frameCounter++;
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
	timeSinceLastFrame = 0;
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
	if(X>0 || Y>0 || tiltLeft || tiltRight){
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

		//max and min vetecies
		var upperCorner = [];
		var lowerCorner = [];

		//select faces
		var objectData = [];
		content.faces.forEach((value, index)=>{
			var indexes = [];

			//get indexes of verticies for the face
			value.vertices.forEach((value2)=>{
				indexes.push(value2.vertexIndex);
			})

			//get vertex values
			var ver1 = Object.values(content.vertices[indexes[0]-1]);
			var ver2 = Object.values(content.vertices[indexes[1]-1]);
			var ver3 = Object.values(content.vertices[indexes[2]-1]);


			//add face to objectData
			objectData.push(new face(1, color, ver1, ver3, ver2));

			//Get the maximum and minimum verticies
			var vertexes = [ver1, ver2, ver3];
			if(index == 0){
				upperCorner=Object.values(content.vertices[indexes[0]-1]);
				lowerCorner=Object.values(content.vertices[indexes[0]-1]);
			}else{
				vertexes.forEach((v)=>{
					v.forEach((x, w)=>{
						if(x > upperCorner[w]){
							upperCorner[w]=x;
						}
					})
				})
				vertexes.forEach((v)=>{
					v.forEach((x, w)=>{
						if(x < lowerCorner[w]){
							lowerCorner[w]=x;
						}
					})
				})
			}
		})
		sceneData.push(objectData);
		//create bounding cube
		/*
		0: 1,1,1
		1: 1,0,1
		2: 1,0,0
		3: 1,1,0
		4: 0,1,1
		5: 0,0,1
		6: 0,0,0
		7: 0,1,0
		*/
		var bvt = [upperCorner,
				  [upperCorner[0],lowerCorner[1],upperCorner[2]],
				  [upperCorner[0],lowerCorner[1],lowerCorner[2]],
				  [upperCorner[0],upperCorner[1],lowerCorner[2]],
				  [lowerCorner[0],upperCorner[1],upperCorner[2]],
				  [lowerCorner[0],lowerCorner[1],upperCorner[2]],
				  lowerCorner,
				  [lowerCorner[0],upperCorner[1],lowerCorner[2]],];
		bvh.push([new face(1, [255, 0, 0], bvt[0], bvt[1], bvt[3]),
				  new face(1, [255, 0, 0], bvt[0], bvt[1], bvt[4]),
				  new face(1, [255, 0, 0], bvt[0], bvt[3], bvt[4]),
				  new face(1, [255, 0, 0], bvt[1], bvt[2], bvt[7]),
				  new face(1, [255, 0, 0], bvt[1], bvt[7], bvt[5]),
				  new face(1, [255, 0, 0], bvt[1], bvt[2], bvt[5])]);
		
		//display that another object has been imported 
		imported.push(content.name + "(" + imported.length + "), ");
		document.getElementById('importedObjects').textContent = "Imported OBJs: " + imported;
		console.log('import success');
	});
	fr.readAsText(allText);
}

function nothing(){
	return null;
}