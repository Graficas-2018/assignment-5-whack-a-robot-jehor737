var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
group = null,
groupRobots = null,
orbitControls = null,
CLICKED = null,
targetList = [];
var buttonClicked = false;
var button = null;
var duration = 120;
var raycaster;
var clock = new THREE.Clock();
var mouse = new THREE.Vector2();
var robot_mixer = {}, animationsRobot={};
var deadAnimator;
var maxRobots = 9;
var positions = [], robotMixers = [];
var robots = 0,robotNumber=0;
var animation = "attack";
var game = false;
var lastSpawn= -1, spawnRate = 2500, valueScore = 0;
var clip = null;

function createDeadAnimation()
{
  const keyFrame = new THREE.NumberKeyframeTrack( '.parent.quaternion', [ 0, 1 ], [ 0, 0, 0, 1, 0, 0, 0.7071068, 0.7071068] ); //Quaternion turns 90 degrees in z
  var keyFrameArray = [];
  keyFrameArray.push(keyFrame);
  clip =  new THREE.AnimationClip("dead", 2, keyFrameArray);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function timer(){
  document.getElementById("time").innerHTML = "Time: "+ Math.round(duration-clock.elapsedTime) + "s";
}
function onDocumentMouseDown(event)
{
	// update the mouse variable
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	// find intersections
	// create a Ray with origin at the mouse position
	// and direction into the scene (camera direction)
  raycaster.setFromCamera(mouse, camera);
	// create an array containing all objects in the scene with which the ray intersects
	var intersects = raycaster.intersectObjects(targetList,true);
	// if there is one (or more) intersections
	if (intersects.length > 0)
	{
		console.log("Hit @ " + toString(intersects[0].point));
    CLICKED = intersects[0].object;
    if(CLICKED.parent.hit){//if object was hit then don't count for score
      return;
    }
    CLICKED.parent.hit = true;
    robotMixers[CLICKED.parent.idR].stopAllAction(); //Stop current animation
    robotMixers[CLICKED.parent.idR].addEventListener("finished",function (e) { //When animation has finished
      groupRobots.remove(e.target._root);//delete robot
      positions[e.target._root.positionNumber].occupied = false;//update position occupation
      if(targetList.indexOf(e.target._root) > -1){
        targetList.splice(targetList.indexOf(e.target._root),1);//delete from targets
      }
      robots = robots - 1;//update number of robots
      updateScore();
      CLICKED = null;
    });

    robotMixers[CLICKED.parent.idR].clipAction(animationsRobot.idle).play();//Add animation
    deadAnimator = robotMixers[CLICKED.parent.idR].clipAction(clip);//Add keyframes
    deadAnimator.setLoop(THREE.LoopOnce);//Do keyframe animation
    deadAnimator.clampWhenFinished = true;
    deadAnimator.play();
	}
}
function toString(v) {
  return "[ " + v.x + ", " + v.y + ", " + v.z + " ]";
}
function updateScore(){
  valueScore = valueScore + 100;
  document.getElementById("score").innerHTML = "Score: "+valueScore;
}
///Spawn Robots
function spawnRobots() {
  var num = Math.floor(Math.random() * maxRobots);
  if(positions[num].occupied){
    return; //If position is with a robot then get another number
  }
  var newRobot = cloneFbx(robot_idle); //Clone robot
  newRobot.idR = robotNumber; //Add ID
  newRobot.hit=false; //Add it hasn't been hit
  newRobot.positionNumber = num; //Add position is occupied
  robotNumber=robotNumber+1; //Add number of robots
  targetList.push(newRobot); //Add as a target
  var mixer = new THREE.AnimationMixer(newRobot);//Add Animation Mixer
  robotMixers.push(mixer);
  mixer.clipAction(animationsRobot.attack).play();
  positions[num].occupied =  true;
  newRobot.position.set(positions[num].x,positions[num].y,positions[num].z); //Set position
  groupRobots.add(newRobot);//Add clone to scene
  robots = robots+1;
}

function quitRobots() {
  if (CLICKED == null) {
    var robot = groupRobots.children[0];//Get first robot
    robot.position.set(robot.position.x,10,robot.position.z)
    positions[robot.positionNumber].occupied = false;
    if(targetList.indexOf(robot) > -1){
      targetList.splice(targetList.indexOf(robot),1);
    }
    //Delete robot from scene
    groupRobots.remove(robot);
    robots = robots - 1;
    console.log("Removed");
  }
}

function loadFBX()
{
    var loader = new THREE.FBXLoader();
    loader.load( 'models/Robot/robot_idle.fbx', function ( object )
    {
        robot_mixer["idle"] = new THREE.AnimationMixer(scene);
        object.scale.set(0.02, 0.02, 0.02);
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        } );
        robot_idle = object;
        robot_mixer["idle"].clipAction(object.animations[0], robot_idle).play();
        animationsRobot.idle = object.animations[0];
        loader.load( 'models/Robot/robot_atk.fbx', function ( object )
        {
            robot_mixer["attack"] = new THREE.AnimationMixer(scene);
            robot_mixer["attack"].clipAction( object.animations[0], robot_idle).play();
            animationsRobot.attack = object.animations[0];
        });
        createDeadAnimation();
    });
}

function animate() {
  if(game){
    var a = 500, i = 1;
    if(clock.elapsedTime > duration){
      document.getElementById("time").innerHTML = "Game finished";
      button.innerHTML = "Restart";
      button.style.display = "block";
      return;
    }
    var deltat = clock.getDelta();
    for (var robMix of robotMixers) {
      robMix.update(deltat);
    }
    timer();
    if(robot_idle && robot_mixer[animation])
    {
      if (robots < maxRobots && clock.oldTime > (lastSpawn+spawnRate)) {
        lastSpawn = clock.oldTime;
        spawnRobots();
      }
      else if (robots < maxRobots && robots > 0 && clock.oldTime > (lastSpawn+spawnRate - 1000)){
        quitRobots();
      }
    }
  }
}
function startGame(){
  game = true;
  button.style.display = "none";
}

function restartGame() {
  scene.remove(groupRobots);
  groupRobots = new THREE.Object3D;
  scene.add(groupRobots);
  for (var position in positions) {
    position.occupied = false;
  }
  //Reset counters, clock, targets, score
  targetList = [];
  robots = 0;
  robotNumber = 0;
  lastSpawn = -1;
  clock = new THREE.Clock();
  robotMixers = [];
  button.style.display = "none";
  valueScore = 0;
  document.getElementById("score").innerHTML = "Score: "+valueScore;
}


function run() {
  requestAnimationFrame(function() { run(); });
  // Render the scene
  renderer.render(scene, camera);
  // Spin the cube for next frame
  animate();
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "images/grasslush.png";
var normalMapUrl =  "images/grassnormalmap.png";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);
    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Create a new Three.js scene
    scene = new THREE.Scene();
    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 5000 );
    camera.position.set(0, 180, 120);
    camera.rotation.set(-45,0,0);
    scene.add(camera);
    //orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    ambientLight = new THREE.AmbientLight ( 0xffffff );
    root.add(ambientLight);
    // Create the objects
    loadFBX();
    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);
    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    var mapN = new THREE.TextureLoader().load(normalMapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);
    mapN.wrapS = mapN.wrapT = THREE.RepeatWrapping;
    mapN.repeat.set(8, 8);
    var color = 0xffffff;
    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 100, 100);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map,normalMap:mapN, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add(mesh);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    raycaster = new THREE.Raycaster();
    // initialize object to perform world/screen calculations
    geometry = new THREE.CircleGeometry(15,60);
    material = new THREE.MeshBasicMaterial({color: 0x000000});
    groupCircle =  new THREE.Object3D;
    for (var i = -1; i < 2; i++) {
      for (var j = -1; j < 2; j++) {
        circle = new THREE.Mesh(geometry,material);
        circle.position.set(i*60,-4,j*60);
        circle.rotation.x = -Math.PI / 2;
        positions.push({x:i*60,y:-4,z:j*60,occupied:false});
        groupCircle.add(circle);
      }
    }
    groupRobots =  new THREE.Object3D;
    scene.add(groupCircle);
    scene.add(groupRobots);
    // Now add the group to our scene
    scene.add(root);
    window.addEventListener( 'resize', onWindowResize);
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.getElementById("score").innerHTML = "Score: "+valueScore;
    button = document.getElementById("start");
}
