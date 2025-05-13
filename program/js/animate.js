import * as THREE from '../libs/build/three.module.js';
import * as MAP from './map.js';
import * as INTERACCION from './interaccion.js';


const clock = new THREE.Clock();
let velocityY = 0; // Iniciamos sin velocidad vertical
const JUMP_SPEED = 400; // Velocidad de salto más controlada
const PLAYER_HEIGHT = 250;
const COLLISION_DISTANCE = 25;
const GRAVITY = 1200; // Gravedad aumentada para una caída más natural
const MAX_FALL_SPEED = 600;
const GROUND_CHECK_TOLERANCE = 40; // Incrementar tolerancia para evitar falsos negativos
let baseMoveSpeed = 150;




function isOnGround(position, terrain) {
    const playerX = position.x;
    const playerZ = position.z;
    const playerY = position.y - PLAYER_HEIGHT /2; // Verificar desde la base del jugador

    // Obtener todos los objetos de la escena que son detectables
    const blocks = terrain.scene.children.filter(obj => obj.userData.isDetectable);

    let closestBlock = null;
    let minDistance = Infinity;

    // Comprobar si hay algún bloque debajo del jugador
    for (const block of blocks) {
        const blockBB = new THREE.Box3().setFromObject(block);

        // Verificar si el jugador está sobre el bloque (en X y Z)
        if (
            playerX >= blockBB.min.x &&
            playerX <= blockBB.max.x &&
            playerZ >= blockBB.min.z &&
            playerZ <= blockBB.max.z
        ) {
            // Verificar si el bloque está debajo del jugador
            const heightDiff = playerY - blockBB.max.y;
            if (heightDiff >= -GROUND_CHECK_TOLERANCE && heightDiff <= GROUND_CHECK_TOLERANCE) {
                const distance = Math.abs(heightDiff);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestBlock = blockBB.max.y;
                }
            }
        }
    }

    // Ajustar la tolerancia para evitar falsos positivos
    const isGrounded = closestBlock !== null && Math.abs(playerY - closestBlock) <= GROUND_CHECK_TOLERANCE;

    return {
        onGround: isGrounded,
        blockY: closestBlock || 0
    };
}

function checkCollision(position, terrain) {
    const playerX = position.x;
    const playerZ = position.z;
    const playerY = position.y;
    
    // Crear una caja de colisión más precisa para el jugador
    const playerHeight = PLAYER_HEIGHT * 0.8; // Reducida para mejor detección
    const playerWidth = 20; // Reducido para movimiento más preciso
    
    const playerMin = new THREE.Vector3(
        playerX - playerWidth/2,
        playerY - playerHeight/2,
        playerZ - playerWidth/2
    );
    const playerMax = new THREE.Vector3(
        playerX + playerWidth/2,
        playerY + playerHeight/2,
        playerZ + playerWidth/2
    );
    const playerBB = new THREE.Box3(playerMin, playerMax);

    // Obtener todos los objetos de la escena que son detectables
    const blocks = terrain.scene.children.filter(obj => obj.userData.isDetectable);

    let collision = false;
    let nearestBlockY = null;

    for (const block of blocks) {
        const blockBB = new THREE.Box3().setFromObject(block);
        
        if (playerBB.intersectsBox(blockBB)) {
            collision = true;
            
            // Si es una colisión desde arriba, guardar la altura del bloque
            if (playerMin.y > blockBB.max.y - 10) {
                if (nearestBlockY === null || blockBB.max.y > nearestBlockY) {
                    nearestBlockY = blockBB.max.y;
                }
            }
        }
    }
    
    return {
        collision: collision,
        blockY: nearestBlockY
    };
}

function handleJump(game) {
    if (game.keys.space && !game.isJumping) {
        game.isJumping = true;
        velocityY = JUMP_SPEED;
        console.log("Player jumped. Velocity Y:", velocityY);
    }
}

function animate(game) {
    const deltaTime = clock.getDelta();
    requestAnimationFrame(() => animate(game));

    // Actualizar chunks del terreno
    game.terrain.updateTerrain(game);

    // Manejar el salto
    handleJump(game);

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

        // Verificar colisión horizontal
        const horizontalCollision = checkCollision(newPosition, game);
        if (!horizontalCollision.collision) {
            game.camera.position.x += moveVector.x;
            game.camera.position.z += moveVector.z;
        }
    }

    // Aplicar física de movimiento vertical
    const groundState = isOnGround(game.camera.position, game);
    console.log("Ground state:", groundState);
    if (groundState.onGround) {
        const targetY = groundState.blockY + MAP.cubeSize / 2 + PLAYER_HEIGHT / 2;
        const diffY = Math.abs(game.camera.position.y - targetY);

        if (diffY > 0.1) {
            game.camera.position.y = targetY;
        } else {
            game.camera.position.y = targetY;
        }

        // Resetear velocidad vertical al tocar el suelo
        velocityY = 0;
    } else {
        velocityY -= GRAVITY * deltaTime;
        velocityY = Math.max(velocityY, -MAX_FALL_SPEED);

        const newPosition = game.camera.position.clone();
        newPosition.y += velocityY * deltaTime;

        const verticalCollision = checkCollision(newPosition, game);
        if (verticalCollision.collision && verticalCollision.blockY !== null) {
            if (velocityY < 0) {
                game.camera.position.y = verticalCollision.blockY + MAP.cubeSize / 2 + PLAYER_HEIGHT / 2;
                velocityY = 0;
                game.isJumping = false;
            } else {
                velocityY = 0;
            }
        } else {
            game.camera.position.y = newPosition.y;
        }

        if (game.camera.position.y < PLAYER_HEIGHT) {
            game.camera.position.y = PLAYER_HEIGHT;
            game.isJumping = false;
            velocityY = 0;
        }
    }

    game.renderer.render(game.scene, game.camera);
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
    velocityY = value; // Establecer la velocidad vertical directamente
    return true; // Indicar que la operación fue exitosa
}

export {
    animate,
    onWindowResize,
    setVelocityY
};