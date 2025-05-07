import * as THREE from './libs/build/three.module.js';
import { FirstPersonControls } from './libs/controls/FirstPersonControls.js';

var camera, controls, scene, renderer;
let terrain = [];
const terrainSize = 50;  // Tamaño del terreno (grilla de cubos)
const cubeSize = 50;  // Tamaño de cada cubo

function inicioGame(){
    init(); createTerrain();

animate();

}
function init() {
    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById("juego").appendChild(renderer.domElement);
    renderer.domElement.requestFullscreen();

    // Camara 
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 400, 0, 0 );
    

// Crear los controles de primera persona
 controls = new FirstPersonControls(camera);
controls.lookSpeed = 0.1;  // Velocidad de rotación de la cámara
controls.movementSpeed = 200;  // Velocidad de movimiento
controls.noFly = true;  // Evitar que el jugador pueda volar
controls.activeLook = true;  // Hacer que la cámara gire de forma automática al mover el ratón

    // Rejilla
    var helper = new THREE.GridHelper( 2000, 100 );
    helper.position.y = 0;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add( helper );

    // Luz
    var ambient = new THREE.AmbientLight(0xffffff,0.3);
    scene.add(ambient);
    var light = new THREE.DirectionalLight(0xffffff, 1, 100, 2 );
    light.position.set(10,20 , 20); 
    light.castShadow = true;
    scene.add(light);

 
    //document.addEventListener();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame( animate );
    controls.update( clock.getDelta() );
    render();
}
function createTerrain() {
    for (let i = 0; i < terrainSize; i++) {
        terrain[i] = [];
        for (let j = 0; j < terrainSize; j++) {
            // Crear un cubo para el terreno
            const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
            var texture = new THREE.TextureLoader().load( 'tierra.jpg' );
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
    renderer.render( scene, camera );
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('input[type="button"]');
    button.addEventListener('click', inicioGame);
});