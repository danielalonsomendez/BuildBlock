import * as THREE from '../libs/build/three.module.js';
import * as MAP from "./map.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let previewBlock = null;

function createPreviewBlock(game) {
    console.log("Creating preview block");
    const geometry = new THREE.BoxGeometry(MAP.cubeSize, MAP.cubeSize, MAP.cubeSize);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
    previewBlock = new THREE.Mesh(geometry, material);
    game.scene.add(previewBlock);
}

function updatePreviewBlock(event, game) {
    if (!previewBlock) createPreviewBlock(game);

    // Convert mouse position to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    console.log("Mouse coordinates:", mouse);

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, game.camera);

    // Check for intersections with objects in the scene
    const intersects = raycaster.intersectObjects(game.scene.children, true);
    console.log("Raycaster intersections:", intersects);

    if (intersects.length > 0) {
        const intersected = intersects[0];

        // Calculate the position for the preview block
        const normal = intersected.face.normal;
        const position = intersected.point.clone().add(normal.multiplyScalar(MAP.cubeSize));
        position.x = Math.round(position.x / MAP.cubeSize) * MAP.cubeSize;
        position.y = Math.round(position.y / MAP.cubeSize) * MAP.cubeSize;
        position.z = Math.round(position.z / MAP.cubeSize) * MAP.cubeSize;

        console.log("Preview block position:", position);

        previewBlock.position.copy(position);
        previewBlock.visible = true;
    } else {
        console.log("No intersections found. Hiding preview block.");
        previewBlock.visible = false;
    }
}

function handleMouseClick(event, game) {
    if (previewBlock && previewBlock.visible) {
        // Create a new block at the preview block's position
        const geometry = new THREE.BoxGeometry(MAP.cubeSize, MAP.cubeSize, MAP.cubeSize);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const newBlock = new THREE.Mesh(geometry, material);
        newBlock.position.copy(previewBlock.position);

        console.log("Placing new block at:", newBlock.position);

        // Add the new block to the scene
        game.scene.add(newBlock);
    } else {
        console.log("Preview block is not visible. No block placed.");
    }
}


export { handleMouseClick, updatePreviewBlock, createPreviewBlock };