var renderer = null,
scene = null,
camera = null,
root = null,
robot_idle = null,
robot_attack = null,
group = null,
orbitControls = null,
clicked = null,
targetList = [];
var raycaster;
var mouse = new THREE.Vector2();
var robot_mixer = {}, animationsRobot={};
var deadAnimator;
var maxRobots = 9;
var duration = 20000; // ms
var currentTime = Date.now();
var positions = [], robotMixers = [], robotsA=[];
var robots = 0;
var animation = "idle";
var game = true;
var lastSpawn= -1, spawnRate = 2500, valueScore = 0;

function Queue() {
  this.data = [];
}

Queue.prototype.add = function(record) {
  this.data.unshift(record);
}

Queue.prototype.remove = function() {
  this.data.pop();
}

Queue.prototype.first = function() {
  return this.data[0];
}

Queue.prototype.last = function() {
  return this.data[this.data.length - 1];
}

Queue.prototype.size = function() {
  return this.data.length;
}

const queue = new Queue();




function changeAnimation(animation_text)
{
    animation = animation_text;

    if(animation =="dead")
    {
        createDeadAnimation();
    }
    else
    {
        robot_idle.rotation.x = 0;
        robot_idle.position.y = -4;
    }
}

function createDeadAnimation()
{

}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function timer(){
  // Set the date we're counting down to
  var countDownDate = new Date().getTime()+121000;
  // Update the count down every 1 second
  var x = setInterval(function() {
      // Get todays date and time
      var now = new Date().getTime();
      // Find the distance between now and the count down date
      var distance = countDownDate - now;
      // Time calculations for days, hours, minutes and seconds
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      // Output the result in an element with id="demo"
      document.getElementById("time").innerHTML = "Time: "+ minutes + "m " + seconds + "s";

      // If the count down is over, write some text
      if (distance < 0) {
          clearInterval(x);
          document.getElementById("time").innerHTML = "Game Over";
          game = false;
      }
  }, 1000);
}
function onDocumentMouseDown(event)
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	//event.preventDefault();
  //console.log(targetList.length);
	console.log("Click");

	// update the mouse variable
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	// find intersections

	// create a Ray with origin at the mouse position
	//   and direction into the scene (camera direction)
  raycaster.setFromCamera(mouse, camera);
	// create an array containing all objects in the scene with which the ray intersects
	var intersects = raycaster.intersectObjects(targetList,true);
	// if there is one (or more) intersections
	if (intersects.length > 0)
	{
		console.log("Hit @ " + toString(intersects[0].point));
    clicked = intersects[0].object;
    updateScore();
	}
  else {
  }

}
function toString(v) {
  return "[ " + v.x + ", " + v.y + ", " + v.z + " ]";
}
function updateScore(){
  valueScore = valueScore + 100;
  document.getElementById("score").innerHTML = "Score: "+valueScore;
}
function spawnRobots() {
  var num = Math.floor(Math.random() * maxRobots);
  var newRobot = cloneFbx(robot_idle);
  var mixer = new THREE.AnimationMixer(newRobot);
      robotMixers.push(mixer);
      newRobot.position.set(positions[num].x,positions[num].y,positions[num].z);
      mixer.clipAction(animationsRobot.attack).play();
      targetList.push(newRobot);
      scene.add(newRobot);
      queue.add(newRobot);
      robots = robots+1;
}

function quitRobots() {
  robot = queue.last();
  robot.position.set(robot.position.x,-10,robot.position.z)
  scene.remove(robot);
  queue.remove();
  robots = robots - 1;
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
        //createDeadAnimation();
        robot_mixer["idle"].clipAction(object.animations[0], robot_idle).play();
        animationsRobot.idle = object.animations[0];
        loader.load( 'models/Robot/robot_atk.fbx', function ( object )
        {
            robot_mixer["attack"] = new THREE.AnimationMixer(scene);
            robot_mixer["attack"].clipAction( object.animations[0], robot_idle).play();
            animationsRobot.attack = object.animations[0];
        });
    });
}

function animate() {
    var a;
    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;

    if(robot_idle && robot_mixer["attack"])
    {
      for (var robMix of robotMixers) {
        robMix.update(deltat * 0.001);
      }
        //robot_mixer["attack"].update(deltat * 0.001);
        if (robots < maxRobots && now > (lastSpawn+spawnRate)) {
          lastSpawn = now;
          spawnRobots();
        }
        else if (robots < maxRobots && robots > 0 && now > (lastSpawn+spawnRate-500)) {
          //lastSpawn = now;
          quitRobots();
        }
    }
    if(animation =="dead")
    {
        KF.update();
    }

}

function run() {
    requestAnimationFrame(function() { run(); });
    if(game){
      // Render the scene
      renderer.render( scene, camera );
      // Spin the cube for next frame
      animate();
    }
  // Update the camera controller
  orbitControls.update();
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
    camera.position.set(0, 150, 150);
    camera.rotation.set(-45,0,0);
    scene.add(camera);
    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
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
    map.repeat.set(10, 10);
    mapN.wrapS = mapN.wrapT = THREE.RepeatWrapping;
    mapN.repeat.set(10, 10);
    var color = 0xffffff;
    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
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
        positions.push({x:i*60,y:-4,z:j*60});
        groupCircle.add(circle);
      }
    }
    scene.add(groupCircle);
    // Now add the group to our scene
    scene.add(root);
    window.addEventListener( 'resize', onWindowResize);
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.getElementById("score").innerHTML = "Score: "+valueScore;

    timer();
}
