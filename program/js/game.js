import * as MAP from "./map.js";
import * as PLAYER from "./player.js";
import * as INTERACCION from "./interaccion.js";
class Game {

    constructor() {
        this.camera = null;
        this.controls = null;
        this.scene = null;
        this.interaccion = null;
        this.terrain = [];
        this.renderer = null;
        this.isJumping = false;
        this.isPointerLocked = false;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        this.lastKey = '1'; // Default inventory slot
        PLAYER.init(this);
        MAP.createTerrain(this);
    }



}
export default Game;