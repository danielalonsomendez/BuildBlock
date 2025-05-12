import * as THREE from '../libs/build/three.module.js';

const terrainSize = 50; // Tamaño del terreno (grilla de cubos)
const cubeSize = 50; // Tamaño de cada cubo

function createTerrain(game) {
    for (let i = 0; i < terrainSize; i++) {
        game.terrain[i] = [];
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
            var texture = new THREE.TextureLoader().load('src/img/top.png');
            const material = new THREE.MeshBasicMaterial({
                map: texture
            });
            const cube = new THREE.Mesh(geometry, material);

            // Posicionar los cubos en una cuadrícula
            cube.position.set(i * cubeSize - (terrainSize * cubeSize) / 2, cubeSize / 2, j * cubeSize - (terrainSize * cubeSize) / 2);
            game.scene.add(cube);
            game.terrain[i][j] = cube; // Guardar el cubo en el array de terreno
        }
    }
}
export {
    createTerrain,
    terrainSize,
    cubeSize
};