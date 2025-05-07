// Importar el módulo de Express
const express = require('express');
const app = express();

// Definir el puerto
const PORT = process.env.PORT || 5000;
app.use(express.static(__dirname + '/program'));

// Ruta principal
app.get('/', (req, res) => {
  res.send('¡Hola, Mundo! Este es mi servidor con Node.js y Express');
});

// Escuchar en el puerto especificado
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
