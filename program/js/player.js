import * as THREE from '../libs/build/three.module.js';
import { PointerLockControls } from '../libs/controls/PointerLockControls.js';
import { setVelocityY } from './animate.js';

const jumpStrength = 300;
let lastKey = null;
const PLAYER_HEIGHT = 170;

function init(game) {
    // Escena
    game.scene = new THREE.Scene();
    game.scene.background = new THREE.Color(0xeeeeee);

    // Renderizador
    game.renderer = new THREE.WebGLRenderer({ antialias: true });
    game.renderer.setPixelRatio(window.devicePixelRatio);
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("juego").appendChild(game.renderer.domElement);

    // Cámara
    game.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    game.camera.position.set(400, PLAYER_HEIGHT, 0);
    game.camera.rotation.order = 'YXZ';

    // Controles
    game.controls = new PointerLockControls(game.camera, game.renderer.domElement);

    // Luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 20);
    directionalLight.castShadow = true;
    game.scene.add(ambientLight, directionalLight);

    // Estados
    game.keys = {};
    game.isJumping = false;
    game.isPointerLocked = false;

    // Captura del ratón
    document.body.addEventListener('click', () => {
        if (!game.isPointerLocked) captureMouse(game.renderer.domElement);
    });

    document.addEventListener('pointerlockchange', () => {
        game.isPointerLocked = document.pointerLockElement === game.renderer.domElement;
        game.controls.enabled = game.isPointerLocked;
    });

    // Resize
    window.addEventListener('resize', () => {
        game.camera.aspect = window.innerWidth / window.innerHeight;
        game.camera.updateProjectionMatrix();
        game.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Teclado
    document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        game.keys[key] = true;

        // Correr
        if (key === 'shift') {
            game.controls.movementSpeed = 300;
        }

        // Saltar
        if (event.code === 'Space' && !game.isJumping) {
            setVelocityY(jumpStrength);
            game.isJumping = true;
        }

        // Selección de número
        if (!isNaN(event.key) && event.key >= '0' && event.key <= '9') {
            if (lastKey !== null) {
                const prevEl = document.getElementById(lastKey);
                if (prevEl) prevEl.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            }

            const currentEl = document.getElementById(event.key);
            if (currentEl) currentEl.style.backgroundColor = "red";

            lastKey = event.key;
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        game.keys[key] = false;

        // Dejar de correr
        if (key === 'shift') {
            game.controls.movementSpeed = 150;
        }
    });
}



function captureMouse(element) {
    element.requestPointerLock?.();
}

export { init };
