import * as THREE from './libs/build/three.module.js';
import {
    FirstPersonControls
} from './libs/controls/FirstPersonControls.js';
import * as MAP from "./js/map.js";
import * as PLAYER from "./js/player.js";
import Game from "./js/game.js";
import * as ANIMATE from "./js/animate.js";

var game= new Game();

/*FUNCION PARA BOTON HTML*/ 
function inicioGame() {
    document.getElementById("juego").style.display = "block";
    document.querySelector("main").requestFullscreen();
    const canvas = game.renderer.domElement;
    canvas.focus(); // Asegurar que el canvas reciba el foco
    captureMouse(); // Bloquear el ratón
    ANIMATE.animate(game);
}

/*ESCENARIO Y EVENTOS*/ 

window.addEventListener('resize', () => {
    game.renderer.setSize(window.innerWidth, window.innerHeight);
    game.camera.aspect = window.innerWidth / window.innerHeight;
    game.camera.updateProjectionMatrix();
});





document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('input[type="button"]');
    button.addEventListener('click', inicioGame);
});


// Función para capturar el ratón
function captureMouse() {
    const element = game.renderer.domElement;
    if (element.requestPointerLock) {
        element.requestPointerLock(); // Bloquear el ratón dentro de la ventana del juego
    } else if (element.mozRequestPointerLock) {
        element.mozRequestPointerLock(); // Firefox
    } else if (element.webkitRequestPointerLock) {
        element.webkitRequestPointerLock(); // Chrome, Safari
    }
}

// Manejar eventos de cuando el ratón entra o sale del "Pointer Lock"
// Llamar a la función para capturar el ratón cuando el jugador haga clic en el canvas
document.body.addEventListener('click', () => {
    if (!game.isPointerLocked) {
        document.querySelector("main").requestFullscreen(); // Asegúrate de que el canvas esté en pantalla completa
        captureMouse();  // Bloqueamos el ratón si no está bloqueado
    }
});

