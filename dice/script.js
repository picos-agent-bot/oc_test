import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup Three.js
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
scene.fog = new THREE.Fog(0x222222, 10, 50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 5;
controls.maxDistance = 30;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// Setup Cannon.js
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82 * 4, 0), // Increased gravity for snappier feel
});
world.allowSleep = true;
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 20;

// Default material and contact material
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.3,
        restitution: 0.5, // bounciness
    }
);
world.addContactMaterial(defaultContactMaterial);

// Create Floor
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a5e20, // Casino green felt
    roughness: 0.8,
    metalness: 0.1
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({ mass: 0, material: defaultMaterial });
floorBody.addShape(floorShape);
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);

// Dice creation helper
function createDiceTexture(number) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, 256, 256);
    
    // Border
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 252);

    ctx.fillStyle = (number === 1) ? '#e74c3c' : '#2c3e50';
    
    const dotSize = 25;
    const center = 128;
    const offset = 65;

    function drawDot(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }

    if ([1, 3, 5].includes(number)) drawDot(center, center);
    if ([2, 3, 4, 5, 6].includes(number)) {
        drawDot(center - offset, center - offset);
        drawDot(center + offset, center + offset);
    }
    if ([4, 5, 6].includes(number)) {
        drawDot(center - offset, center + offset);
        drawDot(center + offset, center - offset);
    }
    if (number === 6) {
        drawDot(center - offset, center);
        drawDot(center + offset, center);
    }

    return new THREE.CanvasTexture(canvas);
}

// Ensure dice materials are ordered correctly for standard dice
// BoxGeometry faces order: px, nx, py, ny, pz, nz
// We want opposite sides to sum to 7.
// px=1, nx=6
// py=3, ny=4
// pz=2, nz=5
const diceMaterials = [
    new THREE.MeshStandardMaterial({ map: createDiceTexture(1), roughness: 0.2, metalness: 0.1 }), // px
    new THREE.MeshStandardMaterial({ map: createDiceTexture(6), roughness: 0.2, metalness: 0.1 }), // nx
    new THREE.MeshStandardMaterial({ map: createDiceTexture(3), roughness: 0.2, metalness: 0.1 }), // py
    new THREE.MeshStandardMaterial({ map: createDiceTexture(4), roughness: 0.2, metalness: 0.1 }), // ny
    new THREE.MeshStandardMaterial({ map: createDiceTexture(2), roughness: 0.2, metalness: 0.1 }), // pz
    new THREE.MeshStandardMaterial({ map: createDiceTexture(5), roughness: 0.2, metalness: 0.1 }), // nz
];

const diceSize = 1.2;
// Add slight bevel/segments for better look if possible, but standard Box is fine for now
const diceGeometry = new THREE.BoxGeometry(diceSize, diceSize, diceSize);
const shape = new CANNON.Box(new CANNON.Vec3(diceSize/2, diceSize/2, diceSize/2));

const dices = [];

function createDice() {
    const mesh = new THREE.Mesh(diceGeometry, diceMaterials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 1,
        shape: shape,
        material: defaultMaterial,
        sleepTimeLimit: 0.2, // Sleep faster when barely moving
        allowSleep: true
    });
    body.angularDamping = 0.3;
    body.linearDamping = 0.1;
    world.addBody(body);

    return { mesh, body, value: 0 };
}

for (let i = 0; i < 3; i++) {
    dices.push(createDice());
}

const resultText = document.getElementById('result-text');
let isRolling = false;

function rollDice() {
    if (isRolling) return;
    isRolling = true;
    resultText.innerText = 'Rolling...';

    dices.forEach((dice, index) => {
        dice.body.wakeUp();
        
        // Random starting position high up
        dice.body.position.set(
            (Math.random() - 0.5) * 4,
            6 + index * 2.5 + Math.random() * 3,
            (Math.random() - 0.5) * 4
        );
        
        // Random starting rotation
        dice.body.quaternion.setFromEuler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // Random velocity and spin
        dice.body.velocity.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 2 - 2, // Slightly downward
            (Math.random() - 0.5) * 10
        );
        dice.body.angularVelocity.set(
            Math.random() * 30 - 15,
            Math.random() * 30 - 15,
            Math.random() * 30 - 15
        );
    });
}

function checkResults() {
    let allSleeping = true;
    let sum = 0;

    dices.forEach(dice => {
        if (dice.body.sleepState !== CANNON.Body.SLEEPING) {
            allSleeping = false;
        }
    });

    if (allSleeping && isRolling) {
        dices.forEach(dice => {
            const euler = new THREE.Euler().setFromQuaternion(dice.mesh.quaternion);
            
            // Determine which face is up by checking normals
            const normals = [
                { face: 1, vec: new THREE.Vector3(1, 0, 0) }, // px
                { face: 6, vec: new THREE.Vector3(-1, 0, 0) }, // nx
                { face: 3, vec: new THREE.Vector3(0, 1, 0) }, // py
                { face: 4, vec: new THREE.Vector3(0, -1, 0) }, // ny
                { face: 2, vec: new THREE.Vector3(0, 0, 1) }, // pz
                { face: 5, vec: new THREE.Vector3(0, 0, -1) }  // nz
            ];

            let maxDot = -Infinity;
            let topFace = 0;

            normals.forEach(n => {
                const worldNormal = n.vec.clone().applyEuler(euler);
                const dot = worldNormal.dot(new THREE.Vector3(0, 1, 0));
                if (dot > maxDot) {
                    maxDot = dot;
                    topFace = n.face;
                }
            });

            dice.value = topFace;
            sum += topFace;
        });

        resultText.innerText = `Total: ${sum}`;
        isRolling = false;
    }
}

// Add Invisible Walls to keep dice on screen
const wallMaterial = new CANNON.Material();
const wallContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    wallMaterial,
    { friction: 0.1, restitution: 0.8 }
);
world.addContactMaterial(wallContactMaterial);

const wallShape = new CANNON.Plane();
const createWall = (position, quaternion) => {
    const wall = new CANNON.Body({ mass: 0, material: wallMaterial });
    wall.addShape(wallShape);
    wall.position.copy(position);
    wall.quaternion.copy(quaternion);
    world.addBody(wall);
};

// Top, Bottom, Left, Right walls (invisible bounding box)
createWall(new CANNON.Vec3(0, 0, -10), new CANNON.Quaternion().setFromEuler(0, 0, 0));
createWall(new CANNON.Vec3(0, 0, 10), new CANNON.Quaternion().setFromEuler(0, Math.PI, 0));
createWall(new CANNON.Vec3(-10, 0, 0), new CANNON.Quaternion().setFromEuler(0, Math.PI / 2, 0));
createWall(new CANNON.Vec3(10, 0, 0), new CANNON.Quaternion().setFromEuler(0, -Math.PI / 2, 0));


window.addEventListener('click', rollDice);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const clock = new THREE.Clock();
const timeStep = 1 / 60;

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    world.step(timeStep, dt, 3);

    dices.forEach(dice => {
        dice.mesh.position.copy(dice.body.position);
        dice.mesh.quaternion.copy(dice.body.quaternion);
    });

    checkResults();
    controls.update();
    renderer.render(scene, camera);
}

// Allow time for initialization
setTimeout(rollDice, 500);
animate();