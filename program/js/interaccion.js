import * as THREE from '../libs/build/three.module.js';
import * as MAP from "./map.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let previewBlock = null;
let blocksData = null;
let lastKey = '1'; // Default to slot 1

async function loadBlocksData() {
    if (!blocksData) {
        const response = await fetch('./json/blocks.json');
        blocksData = await response.json();
    }
}

async function createPreviewBlock(game) {
    console.log("Creating preview block");

    await loadBlocksData();

    const selectedSlot = lastKey; // Use the globally defined lastKey
    const blockData = blocksData.blocks[selectedSlot];

    let geometry = new THREE.BoxGeometry(MAP.cubeSize, MAP.cubeSize, MAP.cubeSize);
    let materials = [];

    if (blockData.textures.all) {
        const texture = new THREE.TextureLoader().load(blockData.textures.all);
        materials = new Array(6).fill(new THREE.MeshBasicMaterial({ map: texture }));
    } else {
        const topTexture = new THREE.TextureLoader().load(blockData.textures.top);
        const sideTexture = new THREE.TextureLoader().load(blockData.textures.side);
        const bottomTexture = new THREE.TextureLoader().load(blockData.textures.bottom);

        materials = [
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Right
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Left
            new THREE.MeshBasicMaterial({ map: topTexture }),  // Top
            new THREE.MeshBasicMaterial({ map: bottomTexture }), // Bottom
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Front
            new THREE.MeshBasicMaterial({ map: sideTexture })  // Back
        ];
    }

    previewBlock = new THREE.Mesh(geometry, materials);
    /*game.scene.add(previewBlock);*/
}

function updatePreviewBlock(event, game) {
    if (!previewBlock) {
        createPreviewBlock(game);
        return; // Ensure previewBlock is initialized before proceeding
    }

    // Adjust mouse coordinates to account for canvas offset
    const rect = game.renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    console.log("Adjusted mouse coordinates:", mouse);

    // Ensure raycaster is updated correctly
    raycaster.setFromCamera(mouse, game.camera);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(game.scene.children, true).filter(intersect => {
        // Filter to only detect blocks with a specific property, e.g., isDetectable
        return intersect.object.userData.isDetectable;
    });
    console.log("Filtered raycaster intersections:", intersects);

    if (intersects.length > 0) {
        const intersected = intersects[0];

        // Calculate the position for the preview block based on the intersection normal
        const position = intersected.object.position.clone();
        const normal = intersected.face.normal.clone();

        // Adjust the position based on the normal to place the block on the correct side
        position.add(normal.multiplyScalar(MAP.cubeSize));

      //  console.log("Preview block position:", position);

        previewBlock.position.copy(position);
        previewBlock.visible = true;

        // Check if the block is within 4 blocks of the player
        const playerPosition = game.camera.position;
        const distance = playerPosition.distanceTo(previewBlock.position);

        if (distance > 4 * MAP.cubeSize) {
            console.log("Block is too far away. Cannot select or place.");
            previewBlock.visible = false;
            return;
        }

        // Highlight the intersected face in red and ensure it overlaps the face
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.5, transparent: true, side: THREE.DoubleSide, depthTest: false });
        const faceGeometry = new THREE.PlaneGeometry(MAP.cubeSize, MAP.cubeSize);
        const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);

        // Align the faceMesh with the intersected face
        const facePosition = intersected.object.position.clone();
        const faceNormal = intersected.face.normal.clone();
        facePosition.add(faceNormal.multiplyScalar(MAP.cubeSize / 2 + 0.01)); // Slightly offset to ensure overlap
        faceMesh.position.copy(facePosition);
        faceMesh.lookAt(facePosition.clone().add(faceNormal));

        // Add the faceMesh to the scene temporarily
        game.scene.add(faceMesh);

        // Remove the faceMesh after a short delay
        setTimeout(() => {
            game.scene.remove(faceMesh);
        }, 100);

        // Remove any previous highlights from other blocks
        game.scene.children.forEach(child => {
            if (child.userData.highlightedFace && child !== intersected.object) {
                child.remove(child.userData.highlightedFace);
                delete child.userData.highlightedFace;
            }
        });
    } else {
        console.log("No intersections found. Hiding preview block.");
        previewBlock.visible = false;
    }
}

async function createBlockAtPosition(game, position) {
    await loadBlocksData();

    const selectedSlot = game.lastKey; // Use the lastKey property from the game object
    const blockData = blocksData.blocks[selectedSlot];

    let geometry = new THREE.BoxGeometry(MAP.cubeSize, MAP.cubeSize, MAP.cubeSize);
    let materials = [];

    if (blockData.textures.all) {
        const texture = new THREE.TextureLoader().load(blockData.textures.all);
        materials = new Array(6).fill(new THREE.MeshBasicMaterial({ map: texture }));
    } else {
        const topTexture = new THREE.TextureLoader().load(blockData.textures.top);
        const sideTexture = new THREE.TextureLoader().load(blockData.textures.side);
        const bottomTexture = new THREE.TextureLoader().load(blockData.textures.bottom);

        materials = [
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Right
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Left
            new THREE.MeshBasicMaterial({ map: topTexture }),  // Top
            new THREE.MeshBasicMaterial({ map: bottomTexture }), // Bottom
            new THREE.MeshBasicMaterial({ map: sideTexture }), // Front
            new THREE.MeshBasicMaterial({ map: sideTexture })  // Back
        ];
    }

    const newBlock = new THREE.Mesh(geometry, materials);
    newBlock.position.copy(position);
    newBlock.userData.isDetectable = true;

    game.scene.add(newBlock);

    // Register the block in the terrain manager
    const chunkX = Math.floor(position.x / (MAP.CHUNK_SIZE * MAP.cubeSize));
    const chunkZ = Math.floor(position.z / (MAP.CHUNK_SIZE * MAP.cubeSize));
    const chunkKey = `${chunkX},${chunkZ}`;

    let chunk = game.terrain.chunks.get(chunkKey);
    if (!chunk) {
        chunk = new MAP.Chunk(chunkX, chunkZ);
        game.terrain.chunks.set(chunkKey, chunk);
    }

    const blockX = Math.floor((position.x % (MAP.CHUNK_SIZE * MAP.cubeSize)) / MAP.cubeSize);
    const blockZ = Math.floor((position.z % (MAP.CHUNK_SIZE * MAP.cubeSize)) / MAP.cubeSize);

    if (!chunk.blocks[blockX]) {
        chunk.blocks[blockX] = [];
    }

    chunk.blocks[blockX][blockZ] = newBlock;

    console.log(`Block registered at chunk (${chunkX}, ${chunkZ}) and position (${blockX}, ${blockZ})`);
}

function handleMouseClick(event, game) {
    if (previewBlock && previewBlock.visible) {
        // Verificar si la posición del nuevo bloque colisionaría con el jugador
        const playerBB = createPlayerBoundingBox(game.camera.position);
        const blockBB = new THREE.Box3().setFromObject(previewBlock);

        // Si hay colisión con el jugador, no realizar ninguna acción
        if (playerBB.intersectsBox(blockBB)) {
            return;
        }

        // Detectar si hay un bloque en la posición del previewBlock
        const intersects = raycaster.intersectObjects(game.scene.children, true).filter(intersect => {
            return intersect.object.userData.isDetectable;
        });

        if (event.button === 0 && intersects.length > 0) { // Click izquierdo
            const intersectedBlock = intersects[0].object;
            game.scene.remove(intersectedBlock); // Eliminar el bloque detectado
        } else if (event.button === 2) { // Click derecho
            createBlockAtPosition(game, previewBlock.position); // Colocar un nuevo bloque
        }
    }
}

// Función auxiliar para crear la caja de colisión del jugador
function createPlayerBoundingBox(position) {
    const playerWidth = 30;
    const playerHeight = 250;
    
    const playerMin = new THREE.Vector3(
        position.x - playerWidth/2,
        position.y - playerHeight/2,
        position.z - playerWidth/2
    );
    const playerMax = new THREE.Vector3(
        position.x + playerWidth/2,
        position.y + playerHeight/2,
        position.z + playerWidth/2
    );
    return new THREE.Box3(playerMin, playerMax);
}

export { handleMouseClick, updatePreviewBlock, createPreviewBlock };