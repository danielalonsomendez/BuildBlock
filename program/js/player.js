import * as THREE from '../libs/build/three.module.js';
import { PointerLockControls } from '../libs/controls/PointerLockControls.js';
import { setVelocityY } from './animate.js';

const jumpStrength = 350; // Ajustado para un salto más natural
let lastKey = null;
const PLAYER_HEIGHT = 250;

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
        if (event.key === 'Shift') {
            game.keys.shift = true;
        }        // Saltar
        if (event.code === 'Space') {
            console.log('Saltar');
            setVelocityY(jumpStrength);
        }

        // Selección de número
        if (!isNaN(event.key) && event.key >= '0' && event.key <= '9') {
            game.lastKey = event.key; // Update the lastKey property of the game object

            if (lastKey !== null) {
                const prevEl = document.getElementById(lastKey);
                if (prevEl) prevEl.classList.remove("seleccionado");
            }

            const currentEl = document.getElementById(event.key);
            if (currentEl) {
                currentEl.classList.add("seleccionado");

                // Inserta el ID seleccionado como clase en el div del inventario
                const inventario = document.getElementById("inventario");
                if (inventario) {
                    inventario.className = `slot-${event.key}`;
                }
            }

            lastKey = event.key;
        }

        // Navegación con flechas
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            let newKey = null;

            if (lastKey !== null) {
                const prevEl = document.getElementById(lastKey);
                if (prevEl) prevEl.classList.remove("seleccionado");

                if (event.key === 'ArrowLeft') {
                    newKey = (parseInt(lastKey) - 1 + 10) % 10; // Ir al anterior, con wrap-around
                } else if (event.key === 'ArrowRight') {
                    newKey = (parseInt(lastKey) + 1) % 10; // Ir al siguiente, con wrap-around
                }
            } else {
                newKey = event.key === 'ArrowLeft' ? 9 : 0; // Si no hay selección previa, empezar desde el extremo
            }

            const currentEl = document.getElementById(newKey);
            if (currentEl) {
                currentEl.classList.add("seleccionado");

                // Inserta el ID seleccionado como clase en el div del inventario
                const inventario = document.getElementById("inventario");
                if (inventario) {
                    inventario.className = `slot-${newKey}`;
                }
            }

            lastKey = newKey.toString();
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        game.keys[key] = false;

        // Dejar de correr
        if (event.key === 'Shift') {
            game.keys.shift = false;
        }

    });

    // Seleccionar el número 1 por defecto
    document.addEventListener('DOMContentLoaded', () => {
        const defaultKey = '1';
        const defaultEl = document.getElementById(defaultKey);
        if (defaultEl) {
            defaultEl.classList.add("seleccionado");

            // Inserta el ID seleccionado como clase en el div del inventario
            const inventario = document.getElementById("inventario");
            if (inventario) {
                inventario.className = `slot-${defaultKey}`;
            }
        }

        lastKey = defaultKey;
    });
}



function captureMouse(element) {
    element.requestPointerLock?.();
}

export { init };
