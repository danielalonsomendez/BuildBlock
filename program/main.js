import * as THREE from './libs/build/three.module.js';
import {
    FirstPersonControls
} from './libs/controls/FirstPersonControls.js';

var camera, controls, scene, renderer;
let terrain = [];
const terrainSize = 50; // Tamaño del terreno (grilla de cubos)
const cubeSize = 50; // Tamaño de cada cubo
let lastPosition = new THREE.Vector3();  // Guardamos la posición de la cámara

const playerOnFloor = false;
const FIXED_PLAYER_HEIGHT = cubeSize * 2.5; // altura en Y donde debe estar la cámara

const moveSpeed = 150;  // Velocidad del jugador
const keys = { w: false, a: false, s: false, d: false };
let isPointerLocked = false; // Variable para verificar si el ratón está bloqueado

const gravity = -9.8;   // Gravedad
const jumpHeight = 200;  // Altura del salto (ajustable)
let velocity = new THREE.Vector3(0, 0, 0);  // Velocidad del jugador

let velocityY = 0;
let isJumping = false;
const jumpStrength = 300;
const groundLevel = cubeSize / 2; // 25

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isJumping) {
        velocityY = jumpStrength;
        isJumping = true;
    }
});


init();
createTerrain();

function inicioGame() {
    document.getElementById("juego").style.display = "block";
    document.getElementById("juego").requestFullscreen();

    const canvas = renderer.domElement;
    canvas.focus(); // Asegurar que el canvas reciba el foco
    captureMouse(); // Bloquear el ratón
    animate();
}

function init() {
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("juego").appendChild(renderer.domElement);
    // Crear un objeto LoadingManager para controlar la carga de recursos
    const loadingManager = new THREE.LoadingManager();

    // Este evento se dispara cuando todos los recursos han terminado de cargarse
    loadingManager.onLoad = function () {
        console.log('Todos los recursos se han cargado. Iniciando la animación...');
        // Iniciar la animación o renderizado aquí, una vez que todo esté listo.
    };

    // Camara 
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(400, 100, 0);

    // Crear los controles de primera persona
    controls = new FirstPersonControls(camera);
    controls.lookSpeed = 0.1; // Reducir la velocidad de rotación de la cámara para mayor fluidez
    controls.movementSpeed = 150; // Reducir ligeramente la velocidad de movimiento
 //   controls.noFly = true; // Evitar que el jugador pueda volar
   controls.activeLook = false; // Hacer que la cámara gire de forma automática al mover el ratón



    // Luz
    var ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);
    var light = new THREE.DirectionalLight(0xffffff, 1, 100, 2);
    light.position.set(10, 20, 20);
    light.castShadow = true;
    scene.add(light);

    

}
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function updateMovement(deltaTime) {
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(keys['s']) - Number(keys['w'])); // Adelante/atrás
    const sideVector = new THREE.Vector3(Number(keys['d']) - Number(keys['a']), 0, 0); // Izquierda/derecha

    // Combina las direcciones de movimiento
    direction.addVectors(frontVector, sideVector).normalize();

    // Calcula la dirección hacia adelante según la cámara
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // Evita movimiento vertical
    forward.normalize();

    
}

document.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;

    // Aumentar velocidad al presionar Shift
    if (event.key === 'Shift') {
        controls.movementSpeed = 300;
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;

    // Restaurar velocidad al soltar Shift
    if (event.key === 'Shift') {
        controls.movementSpeed = 150;
    }
});


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
const clock = new THREE.Clock();

function animate() {
    const deltaTime = clock.getDelta(); // Calcula el tiempo transcurrido desde el último frame
    requestAnimationFrame(animate); // Solicita el siguiente frame de animación

    lastPosition.copy(camera.position); // Guarda la posición actual de la cámara

        controls.update(deltaTime);  // Actualizamos los controles solo cuando el ratón está bloqueado
    
    if (checkCollision(camera)) {
        camera.position.copy(lastPosition); // Revertir la posición si hay colisión
    }

    // Mantén la cámara a una altura fija
    camera.position.y = FIXED_PLAYER_HEIGHT;

    // Llama a la función para actualizar el movimiento
    updateMovement(deltaTime);

    // Renderiza la escena
    render();
}

function checkCollision(object) {
    for (let i = 0; i < terrainSize; i++) {
        for (let j = 0; j < terrainSize; j++) {
            const cube = terrain[i][j];
            
            // Obtenemos las posiciones de los cubos y la cámara
            const cubePos = cube.position;
            const objectPos = object.position;

            // Verificamos si el objeto está dentro del rango de colisión del cubo
            if (
                objectPos.x > cubePos.x - cubeSize / 2 &&
                objectPos.x < cubePos.x + cubeSize / 2 &&
                objectPos.y > cubePos.y - cubeSize / 2 &&
                objectPos.y < cubePos.y + cubeSize / 2 &&
                objectPos.z > cubePos.z - cubeSize / 2 &&
                objectPos.z < cubePos.z + cubeSize / 2
            ) {
                return true; // Hay colisión
            }
        }
    }
    return false; // No hay colisión
}





function createTerrain() {
    for (let i = 0; i < terrainSize; i++) {
        terrain[i] = [];
        for (let j = 0; j < terrainSize; j++) {
            // Crear un cubo para el terreno
            const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
            const loader = new THREE.TextureLoader();
           /* const textures = [
                loader.load('src/img/tierra.jpg'), // Cara frontal
                loader.load('src/img/tierra.jpg'), // Cara frontal
                loader.load('src/img/top.png'), // Cara frontal
                loader.load('src/img/tierra.jpg'), // Cara frontal
                loader.load('src/img/tierra.jpg'), // Cara frontal
                loader.load('src/img/tierra.jpg'), // Cara frontal
            ];


            // Crear los materiales para las demás caras
            const materials = textures.map((texture, index) => {

                return new THREE.MeshStandardMaterial({ map: texture });
            });*/
            var texture = new THREE.TextureLoader().load( 'src/img/top.png' );
            const material = new THREE.MeshBasicMaterial( { map: texture } );
            const cube = new THREE.Mesh(geometry, material);

            // Posicionar los cubos en una cuadrícula
            cube.position.set(i * cubeSize - (terrainSize * cubeSize) / 2, cubeSize / 2, j * cubeSize - (terrainSize * cubeSize) / 2);
            scene.add(cube);
            terrain[i][j] = cube; // Guardar el cubo en el array de terreno
        }
    }
}

function render() {
    renderer.render(scene, camera);
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('input[type="button"]');
    button.addEventListener('click', inicioGame);
});


// Función para capturar el ratón
function captureMouse() {
    const element = renderer.domElement;
    if (element.requestPointerLock) {
        element.requestPointerLock(); // Bloquear el ratón dentro de la ventana del juego
    } else if (element.mozRequestPointerLock) {
        element.mozRequestPointerLock(); // Firefox
    } else if (element.webkitRequestPointerLock) {
        element.webkitRequestPointerLock(); // Chrome, Safari
    }
}

// Función para manejar la liberación del ratón (salir del "Pointer Lock")
function releaseMouse() {
    document.exitPointerLock();
}

// Manejar eventos de cuando el ratón entra o sale del "Pointer Lock"
document.addEventListener('pointerlockchange', function () {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
});

// Llamar a la función para capturar el ratón cuando el jugador haga clic en el canvas
document.body.addEventListener('click', () => {
    if (!isPointerLocked) {
        captureMouse();  // Bloqueamos el ratón si no está bloqueado
    }
});

document.addEventListener('mousemove', (event) => {
    if (isPointerLocked) {
        console.log(`Movimiento del ratón: X=${event.movementX}, Y=${event.movementY}`);
        camera.rotation.y -= event.movementX * 0.05;
        camera.rotation.x -= event.movementY * 0.05;

        // Limitar la rotación vertical
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    } else {
        console.log('El ratón no está bloqueado.');
    }
});
