import * as THREE from '../libs/build/three.module.js';
import * as MAP from './map.js';

const clock = new THREE.Clock();
let velocityY = 0;
const PLAYER_HEIGHT = 150;
const COLLISION_DISTANCE = 25;


function checkCollision(position, terrain) {
    const playerX = position.x;
    const playerZ = position.z;
    
    // Convertir posición del mundo a índices del terreno
    const terrainX = Math.floor((playerX + (MAP.terrainSize * MAP.cubeSize) / 2) / MAP.cubeSize);
    const terrainZ = Math.floor((playerZ + (MAP.terrainSize * MAP.cubeSize) / 2) / MAP.cubeSize);
    
    // Verificar si estamos dentro de los límites del terreno
    if (terrainX >= 0 && terrainX < MAP.terrainSize && 
        terrainZ >= 0 && terrainZ < MAP.terrainSize) {
        
        // Comprobar colisiones con los bloques adyacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const checkX = terrainX + dx;
                const checkZ = terrainZ + dz;
                
                if (checkX >= 0 && checkX < MAP.terrainSize && 
                    checkZ >= 0 && checkZ < MAP.terrainSize) {
                    const block = terrain[checkX][checkZ];
                    if (block) {
                        const blockBB = new THREE.Box3().setFromObject(block);
                        const playerPos = new THREE.Vector3(playerX, PLAYER_HEIGHT/2, playerZ);
                        const distance = blockBB.distanceToPoint(playerPos);
                        
                        if (distance < COLLISION_DISTANCE) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}

function animate(game) {
    const deltaTime = clock.getDelta();
    requestAnimationFrame(() => animate(game));

    // Movimiento con colisiones
    if (game.isPointerLocked) {
        const moveSpeed = 150;
        const direction = new THREE.Vector3();

        if (game.keys.w) direction.z -= 1;
        if (game.keys.s) direction.z += 1;
        if (game.keys.a) direction.x -= 1;
        if (game.keys.d) direction.x += 1;

        direction.normalize();
        
        // Aplicar la rotación de la cámara al vector de dirección
        const moveVector = direction.clone();
        moveVector.applyEuler(new THREE.Euler(0, game.camera.rotation.y, 0));
        moveVector.multiplyScalar(moveSpeed * deltaTime);

        // Calcular la nueva posición
        const newPosition = game.camera.position.clone();
        
        // Verificar movimiento en X y Z
        newPosition.x += moveVector.x;
        newPosition.z += moveVector.z;
        
        // Si no hay colisión, aplicar el movimiento
        if (!checkCollision(newPosition, game.terrain)) {
            game.camera.position.x += moveVector.x;
            game.camera.position.z += moveVector.z;
        }
    }

    // Gravedad y salto
    if (game.isJumping) {
        velocityY -= 9.8 * deltaTime;
        const newY = game.camera.position.y + velocityY * deltaTime;
        
        if (newY <= PLAYER_HEIGHT) {
            game.camera.position.y = PLAYER_HEIGHT;
            game.isJumping = false;
            velocityY = 0;
        } else {
            game.camera.position.y = newY;
        }
    } else {
        // Mantener altura fija cuando no está saltando
        game.camera.position.y = PLAYER_HEIGHT;
    }

    // Renderiza la escena
    render(game);
}

function render(game) {
    game.renderer.render(game.scene, game.camera);
}

function onWindowResize(game) {
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
    game.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Función para establecer la velocidad vertical
function setVelocityY(value) {
    velocityY = value;
}

export {
    animate,
    onWindowResize,
    setVelocityY
};