import Game from "./js/game.js";
import * as ANIMATE from "./js/animate.js";
import * as INTERACCION from "./js/interaccion.js";
import * as THREE from './libs/build/three.module.js';

var game = new Game();
var juegoejecutado = false;
/*FUNCION PARA BOTON HTML*/
function inicioGame() {
    document.getElementById("juego").style.display = "block";
    captureMouse();
    document.getElementById("juego").requestFullscreen();
    console.log("Iniciando juego...");
    if (!juegoejecutado) {
        juegoejecutado = true;
        ANIMATE.animate(game);
    }
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
    if (!game.isPointerLocked && document.getElementById("juego").style.display != "none") {
        captureMouse();  // Bloqueamos el ratón si no está bloqueado
        document.querySelector("main").requestFullscreen(); // Asegúrate de que el canvas esté en pantalla completa
    }
});

document.addEventListener('fullscreenchange', () => {
    const ocultarElemento = document.getElementById('juego');
    if (!document.fullscreenElement) {
        document.getElementById("inicio").style.display = "none";
        document.querySelector("header").style.display = "none";
        //ocultarElemento.style.display = 'none';
    }
});


let lastIntersected = null; // Para rastrear la última cara impactada

// Detectar movimiento del ratón
/*window.addEventListener('mousemove', (event) => {
    lastIntersected = INTERACCION.handleMouseMove(event, game);
});*/

// Detectar clic del ratón para colocar un bloque
// Add event listeners for mouse movement and clicks
document.addEventListener('mousemove', (event) => {
    if (game && game.isPointerLocked) {
        INTERACCION.updatePreviewBlock(event, game);
    }
});

document.addEventListener('click', (event) => {
    if (game && game.isPointerLocked) {
        INTERACCION.handleMouseClick(event, game);
    }
});
