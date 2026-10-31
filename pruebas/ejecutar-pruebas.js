// Ejecuta las pruebas documentadas desde la consola (opcional, para desarrollo):
//   node pruebas/ejecutar-pruebas.js
// Para la evaluación no hace falta: las mismas pruebas se ven en ABRIR.html → Comprobación.
const { ejecutarTodas } = require('../recursos/js/pruebas.js');

let fallas = 0;
for (const p of ejecutarTodas()) {
  console.log(`${p.pasa ? 'PASA ' : 'FALLA'}  ${p.id}  ${p.modulo}: ${p.titulo}`);
  for (const f of p.filas) {
    if (!f.pasa) fallas++;
    const obtenido = typeof f.obtenido === 'number' ? f.obtenido.toFixed(6) : f.obtenido;
    console.log(`        ${f.pasa ? '✓' : '✗'} ${f.nombre}: esperado ${f.esperado}, obtenido ${obtenido}`);
  }
}
console.log(fallas === 0 ? '\nTodas las pruebas pasan.' : `\n${fallas} comprobación(es) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
