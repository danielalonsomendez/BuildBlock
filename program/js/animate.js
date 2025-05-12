import * as THREE from '../libs/build/three.module.js';
import * as MAP from './map.js';
import * as INTERACCION from './interaccion.js';


const clock = new THREE.Clock();
let velocityY = 200;
const PLAYER_HEIGHT = 150;
const COLLISION_DISTANCE = 25;
const GRAVITY = 350;
const MAX_FALL_SPEED = 200;
let baseMoveSpeed = 150;




function isOnGround(position, terrain) {
    const playerX = position.x;
    const playerZ = position.z;

    // Convertir posición del mundo a índices del terreno
    const terrainX = Math.floor(playerX / MAP.cubeSize);
    const terrainZ = Math.floor(playerZ / MAP.cubeSize);

    // Verificar si hay un bloque en esta posición
    const block = terrain.getBlockAt(terrainX, terrainZ);
    return block !== null;
}

function checkCollision(position, terrain) {
    const playerX = position.x;
    const playerZ = position.z;
    const playerY = position.y;

    // Convertir posición del mundo a índices del terreno
    const terrainX = Math.floor(playerX / MAP.cubeSize);
    const terrainZ = Math.floor(playerZ / MAP.cubeSize);

    // Comprobar colisiones con los bloques adyacentes
    for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
            const checkX = terrainX + dx;
            const checkZ = terrainZ + dz;

            const block = terrain.getBlockAt(checkX, checkZ);
            if (block) {
                const blockBB = new THREE.Box3().setFromObject(block);

                // Crear un punto para la posición del jugador usando la altura completa
                const playerPos = new THREE.Vector3(playerX, playerY, playerZ);

                // Verificar si el jugador está dentro del bloque
                if (blockBB.containsPoint(playerPos)) {
                    return true;
                }

                // También verificar la distancia para colisiones cercanas
                const distance = blockBB.distanceToPoint(playerPos);
                if (distance < COLLISION_DISTANCE) {
                    return true;
                }
            }
        }
    }
    return false;
}

function animate(game) {
    const deltaTime = clock.getDelta();
    requestAnimationFrame(() => animate(game));

    // Actualizar chunks del terreno
    game.terrain.updateTerrain(game);

    // Movimiento con colisiones
    if (game.isPointerLocked) {
        const moveSpeed = game.keys.shift ? 300 : baseMoveSpeed;
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
        newPosition.x += moveVector.x;
        newPosition.z += moveVector.z;

        // Si no hay colisión, aplicar el movimiento
        if (!checkCollision(newPosition, game.terrain)) {
            game.camera.position.x += moveVector.x;
            game.camera.position.z += moveVector.z;
        }
    } // Gravedad y salto
    // Aplicar gravedad si no estamos en el suelo
    if (!isOnGround(game.camera.position, game.terrain) && velocityY === 0 && !game.isJumping) {
        velocityY = -0.1; // Iniciar caída suave
    }


    // Física de salto y caída
    // Física de salto y caída
    if (game.isJumping) {
        // Aplicar gravedad durante el salto
        velocityY -= GRAVITY * deltaTime;
        velocityY = Math.max(velocityY, -MAX_FALL_SPEED); // Limita la velocidad de caída

        // Calcular nueva posición
        const newPosition = game.camera.position.clone();
        newPosition.y += velocityY * deltaTime;

        // Si chocamos con algo
        if (checkCollision(newPosition, game.terrain)) {
            const terrainX = Math.floor(game.camera.position.x / MAP.cubeSize);
            const terrainZ = Math.floor(game.camera.position.z / MAP.cubeSize);
            const block = game.terrain.getBlockAt(terrainX, terrainZ);

            if (block) {
                // Si hay un bloque, posicionar encima
                game.camera.position.y = block.position.y + MAP.cubeSize / 2 + PLAYER_HEIGHT;
            } else {
                // Si no hay bloque, volver al suelo
                game.camera.position.y = PLAYER_HEIGHT;
            }
            game.isJumping = false; // Finalizar el salto
            velocityY = 0;
        } else {
            // Si no hay colisión, actualizar posición Y
            game.camera.position.y = newPosition.y;

            // Si caemos por debajo del nivel del suelo, resetear
            if (game.camera.position.y < PLAYER_HEIGHT) {
                game.camera.position.y = PLAYER_HEIGHT;
                game.isJumping = false; // Finalizar el salto
                velocityY = 0;
            }
        }
    } else if (!isOnGround(game.camera.position, game.terrain)) {
        // Aplicar gravedad si no estamos en el suelo
        velocityY -= GRAVITY * deltaTime;
        velocityY = Math.max(velocityY, -MAX_FALL_SPEED); // Limita la velocidad de caída

        const newPosition = game.camera.position.clone();
        newPosition.y += velocityY * deltaTime;

        if (checkCollision(newPosition, game.terrain)) {
            const terrainX = Math.floor(game.camera.position.x / MAP.cubeSize);
            const terrainZ = Math.floor(game.camera.position.z / MAP.cubeSize);
            const block = game.terrain.getBlockAt(terrainX, terrainZ);

            if (block) {
                game.camera.position.y = block.position.y + MAP.cubeSize / 2 + PLAYER_HEIGHT;
            } else {
                game.camera.position.y = PLAYER_HEIGHT;
            }
            velocityY = 0;
        } else {
            game.camera.position.y = newPosition.y;

            if (game.camera.position.y < PLAYER_HEIGHT) {
                game.camera.position.y = PLAYER_HEIGHT;
                velocityY = 0;
            }
        }
    } else {
        // Resetear velocidad vertical si estamos en el suelo
        velocityY = 0;
        game.isJumping = false; // Asegurarse de que el estado de salto se reinicie
    }


    // Llamar a la detección de intersecciones en cada frame
//INTERACCION.handleMouseMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }, game);
    // Renderizar la escena
    game.renderer.render(game.scene, game.camera);

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

function setVelocityY(value) {
    velocityY = value;
}

export {
    animate,
    onWindowResize,
    setVelocityY
};