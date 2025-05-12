import * as THREE from '../libs/build/three.module.js';

const CHUNK_SIZE = 16; // Tamaño de cada chunk
const RENDER_DISTANCE = 3; // Cantidad de chunks visibles en cada dirección
const cubeSize = 50; // Tamaño de cada cubo

// Geometría y material compartidos para todos los cubos
const sharedGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const texture = new THREE.TextureLoader().load('src/img/top.png');
const sharedMaterial = new THREE.MeshBasicMaterial({ map: texture });

class Chunk {
    constructor(chunkX, chunkZ) {
        this.x = chunkX;
        this.z = chunkZ;
        this.blocks = [];
        this.isLoaded = false;
    }

    generate(scene) {
        if (this.isLoaded) return;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            this.blocks[x] = [];
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = (this.x * CHUNK_SIZE + x);
                const worldZ = (this.z * CHUNK_SIZE + z);
                
                // Usar geometría y material compartidos
                const cube = new THREE.Mesh(sharedGeometry, sharedMaterial);
                
                // Posición en el mundo
                cube.position.set(
                    worldX * cubeSize,
                    cubeSize / 2,
                    worldZ * cubeSize
                );
                
                scene.add(cube);
                this.blocks[x][z] = cube;
            }
        }
        this.isLoaded = true;
    }

    unload(scene) {
        if (!this.isLoaded) return;

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                if (this.blocks[x][z]) {
                    scene.remove(this.blocks[x][z]);
                }
            }
        }
        this.blocks = [];
        this.isLoaded = false;
    }
}

class TerrainManager {
    constructor() {
        this.chunks = new Map();
        this.lastPlayerChunk = { x: 0, z: 0 };
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    updateTerrain(game) {
        const playerX = Math.floor(game.camera.position.x / (CHUNK_SIZE * cubeSize));
        const playerZ = Math.floor(game.camera.position.z / (CHUNK_SIZE * cubeSize));

        // Si el jugador no se ha movido a un nuevo chunk, no hacemos nada
        if (playerX === this.lastPlayerChunk.x && playerZ === this.lastPlayerChunk.z) {
            return;
        }

        this.lastPlayerChunk = { x: playerX, z: playerZ };

        // Cargar chunks nuevos
        for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
            for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
                const chunkX = playerX + dx;
                const chunkZ = playerZ + dz;
                const key = this.getChunkKey(chunkX, chunkZ);

                if (!this.chunks.has(key)) {
                    const chunk = new Chunk(chunkX, chunkZ);
                    this.chunks.set(key, chunk);
                    chunk.generate(game.scene);
                }
            }
        }

        // Descargar chunks lejanos
        for (const [key, chunk] of this.chunks) {
            const dx = chunk.x - playerX;
            const dz = chunk.z - playerZ;
            if (Math.abs(dx) > RENDER_DISTANCE || Math.abs(dz) > RENDER_DISTANCE) {
                chunk.unload(game.scene);
                this.chunks.delete(key);
            }
        }
    }

    getBlockAt(worldX, worldZ) {
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        const key = this.getChunkKey(chunkX, chunkZ);
        
        const chunk = this.chunks.get(key);
        if (!chunk || !chunk.isLoaded) return null;

        const blockX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const blockZ = ((worldZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        
        return chunk.blocks[blockX]?.[blockZ] || null;
    }
}

const terrainManager = new TerrainManager();

// Ajustar el fondo de la escena y la niebla para un efecto visual más suave
function addFogToScene(scene) {
    const fogColor = 0x87ceeb; // Color azul cielo para la niebla y el fondo
    scene.background = new THREE.Color(fogColor); // Establecer el color de fondo de la escena

    const near = 900; // Distancia mínima para que la niebla comience
    const far = 1200; // Distancia máxima donde la niebla es completamente opaca
    scene.fog = new THREE.Fog(fogColor, near, far);
}

// Llamar a la función de niebla al crear el terreno
function createTerrain(game) {
    game.terrain = terrainManager;
    // Forzar la carga del chunk inicial y los adyacentes
    terrainManager.lastPlayerChunk = { x: -999, z: -999 }; // Forzar actualización
    terrainManager.updateTerrain(game);

    // Añadir niebla a la escena
    addFogToScene(game.scene);
}

export {
    createTerrain,
    CHUNK_SIZE,
    cubeSize
};