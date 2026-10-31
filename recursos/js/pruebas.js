/*
 * pruebas.js — Pruebas documentadas de la aplicación.
 * Se ejecutan en el módulo "Comprobación" de ABRIR.html y también con Node.js
 * (node pruebas/ejecutar-pruebas.js). Cada prueba registra entradas, resultado
 * esperado, resultado obtenido, tolerancia y referencia.
 *
 * Tolerancia: los resultados esperados se redondearon a 6 decimales, por lo que
 * se aceptan diferencias absolutas de hasta 0.000001 (1e-6). Las pruebas que
 * usan valores de tabla (redondeados a 4 decimales) usan tolerancia 0.0001.
 */
(function (global) {
  'use strict';
  const Est = global.Est || (typeof require !== 'undefined' ? require('./estadistica.js') : null);

  const T6 = 1e-6, T4 = 1e-4;
  const REF_CALC = 'Cálculo manual con la fórmula, verificado con mpmath (Python, 30 dígitos de precisión).';

  const PRUEBAS = [
    {
      id: 'P1', modulo: 'Descriptiva',
      titulo: 'Tiempos de respuesta de una API (ms): varianza poblacional vs. muestral',
      entradas: 'Datos: 120, 135, 128, 140, 150, 128, 132, 145, 138, 128, 160, 126',
      referencia: 'Verificación manual (ver informe, sección "Cálculos verificados a mano"): Σ(x − x̄)² = 1437.666667; σ² = 1437.666667/12; s² = 1437.666667/11.',
      ejecutar: () => {
        const r = Est.descriptiva(Est.leerDatos('120, 135, 128, 140, 150, 128, 132, 145, 138, 128, 160, 126'));
        return [
          ['n', 12, r.n, 0], ['Media', 135.833333, r.media, T6], ['Mediana', 133.5, r.mediana, T6],
          ['Moda', 128, r.moda[0], 0], ['Mínimo', 120, r.minimo, 0], ['Máximo', 160, r.maximo, 0],
          ['Rango', 40, r.rango, 0],
          ['Varianza poblacional σ²', 119.805556, r.varianzaPoblacional, T6],
          ['Varianza muestral s²', 130.696970, r.varianzaMuestral, T6],
          ['Desviación poblacional σ', 10.945572, r.desviacionPoblacional, T6],
          ['Desviación muestral s', 11.432278, r.desviacionMuestral, T6]
        ];
      }
    },
    {
      id: 'P2', modulo: 'Conteo y probabilidad',
      titulo: 'Prueba compuesta: combinaciones, unión, condicional y Bayes',
      entradas: 'C(10, 3); P(A)=0.30, P(B)=0.25, P(A∩B)=0.10; Bayes con P(Ai)=0.5, 0.3, 0.2 y P(E|Ai)=0.01, 0.02, 0.04',
      referencia: 'Verificación manual: C(10,3)=10·9·8/3! = 120; 0.30+0.25−0.10 = 0.45; 0.10/0.25 = 0.40; P(E) = 0.005+0.006+0.008 = 0.019 y P(A3|E) = 0.008/0.019.',
      ejecutar: () => {
        const b = Est.bayes([0.5, 0.3, 0.2], [0.01, 0.02, 0.04]);
        return [
          ['C(10, 3)', 120, Est.combinaciones(10, 3).valor, 0],
          ['P(A∪B)', 0.45, Est.union(0.30, 0.25, 0.10), T6],
          ['P(A|B)', 0.40, Est.condicional(0.10, 0.25), T6],
          ['P(E) total', 0.019, b.total, T6],
          ['P(A1|E)', 0.263158, b.posteriores[0], T6],
          ['P(A2|E)', 0.315789, b.posteriores[1], T6],
          ['P(A3|E)', 0.421053, b.posteriores[2], T6]
        ];
      }
    },
    {
      id: 'P3', modulo: 'Binomial',
      titulo: 'Paquetes perdidos en una red: n = 10, p = 0.10, k = 2',
      entradas: 'n = 10, p = 0.10, k = 2',
      referencia: 'Tabla binomial acumulada (Walpole, Tabla A.1): P(X≤2) = 0.9298, P(X≤1) = 0.7361. ' + REF_CALC,
      ejecutar: () => {
        const r = Est.binomial(10, 0.1, 2);
        return [['P(X = 2)', 0.193710, r.exacto, T6], ['P(X ≤ 2)', 0.929809, r.comoMaximo, T6],
          ['P(X ≥ 2)', 0.263901, r.alMenos, T6], ['Media np', 1, r.media, T6], ['Varianza np(1−p)', 0.9, r.varianza, T6]];
      }
    },
    {
      id: 'P4', modulo: 'Hipergeométrica',
      titulo: 'Licencias defectuosas en un lote: N = 20, K = 5, n = 4, k = 1',
      entradas: 'N = 20, K = 5, n = 4, k = 1',
      referencia: 'Cálculo manual: C(5,1)·C(15,3)/C(20,4) = 5·455/4845 = 2275/4845. ' + REF_CALC,
      ejecutar: () => {
        const r = Est.hipergeometrica(20, 5, 4, 1);
        return [['P(X = 1)', 0.469556, r.exacto, T6], ['Media nK/N', 1, r.media, T6]];
      }
    },
    {
      id: 'P5', modulo: 'Poisson',
      titulo: 'Tickets de soporte: 6 por hora, intervalo de 30 min, k = 2',
      entradas: 'Promedio = 6 en 60 min; intervalo analizado = 30 min (λ = 3); k = 2',
      referencia: 'Tabla de Poisson acumulada (Walpole, Tabla A.2), λ = 3: P(X≤2) = 0.4232. ' + REF_CALC,
      ejecutar: () => {
        const r = Est.poisson(6, 60, 30, 2);
        return [['λ ajustado', 3, r.lambda, T6], ['P(X = 2)', 0.224042, r.exacto, T6],
          ['P(X ≤ 2)', 0.423190, r.comoMaximo, T6], ['P(X ≥ 2)', 0.800852, r.alMenos, T6]];
      }
    },
    {
      id: 'P6', modulo: 'Uniforme continua',
      titulo: 'Tiempo de descarga entre 2 y 10 s; a = 4, b = 7',
      entradas: 'α = 2, β = 10, a = 4, b = 7',
      referencia: 'Cálculo manual: media (2+10)/2 = 6; varianza (10−2)²/12 = 5.333333; P(X≤4) = 2/8; P(X≥7) = 3/8; P(4≤X≤7) = 3/8.',
      ejecutar: () => {
        const r = Est.uniforme(2, 10, 4, 7);
        return [['Media', 6, r.media, T6], ['Varianza', 5.333333, r.varianza, T6],
          ['P(X ≤ 4)', 0.25, r.izquierda, T6], ['P(X ≥ 7)', 0.375, r.derecha, T6], ['P(4 ≤ X ≤ 7)', 0.375, r.entre, T6]];
      }
    },
    {
      id: 'P7', modulo: 'Normal',
      titulo: 'Tiempo de compilación: μ = 50 s, σ = 5 s; a = 45, b = 58',
      entradas: 'μ = 50, σ = 5, a = 45, b = 58 (z = −1 y z = 1.6)',
      referencia: 'Tabla normal estándar (Walpole, Tabla A.3): Φ(−1.00) = 0.1587, Φ(1.60) = 0.9452. ' + REF_CALC,
      ejecutar: () => {
        const r = Est.normal(50, 5, 45, 58);
        return [['z(a)', -1, r.za, T6], ['z(b)', 1.6, r.zb, T6], ['P(X ≤ 45)', 0.158655, r.izquierda, T6],
          ['P(X ≥ 58)', 0.054799, r.derecha, T6], ['P(45 ≤ X ≤ 58)', 0.786545, r.entre, T6]];
      }
    },
    {
      id: 'P8', modulo: 'Gamma',
      titulo: 'Tiempo para atender 3 solicitudes: α = 3, θ = 2 min; a = 4, b = 8',
      entradas: 'α = 3, θ = 2, a = 4, b = 8',
      referencia: 'Cálculo manual (α entero, forma de Erlang): P(X≤x) = 1 − e^(−x/θ)·Σ_{i=0}^{α−1} (x/θ)^i/i!; P(X≤4) = 1 − 5e^(−2); P(X≥8) = 13e^(−4). ' + REF_CALC,
      ejecutar: () => {
        const r = Est.gamma(3, 2, 4, 8);
        return [['Media αθ', 6, r.media, T6], ['Varianza αθ²', 12, r.varianza, T6], ['P(X ≤ 4)', 0.323324, r.izquierda, T6],
          ['P(X ≥ 8)', 0.238103, r.derecha, T6], ['P(4 ≤ X ≤ 8)', 0.438573, r.entre, T6]];
      }
    },
    {
      id: 'P9', modulo: 'Exponencial',
      titulo: 'Tiempo entre fallas de un servidor: λ = 0.5 fallas/h (1/λ = 2 h); a = 1, b = 3',
      entradas: 'λ = 0.5, a = 1, b = 3',
      referencia: 'Cálculo manual: P(X≤1) = 1 − e^(−0.5); P(X≥3) = e^(−1.5); P(1≤X≤3) = e^(−0.5) − e^(−1.5). ' + REF_CALC,
      ejecutar: () => {
        const r = Est.exponencial(0.5, 1, 3);
        return [['Media 1/λ', 2, r.media, T6], ['Varianza 1/λ²', 4, r.varianza, T6], ['P(X ≤ 1)', 0.393469, r.izquierda, T6],
          ['P(X ≥ 3)', 0.223130, r.derecha, T6], ['P(1 ≤ X ≤ 3)', 0.383400, r.entre, T6]];
      }
    },
    {
      id: 'P10', modulo: 'Ji cuadrada',
      titulo: 'Prueba de un generador de números aleatorios: ν = 10; a = 3.940, b = 18.307',
      entradas: 'ν = 10, a = 3.940, b = 18.307',
      referencia: 'Tabla ji cuadrada (Walpole, Tabla A.5), ν = 10: χ²₀.₉₅ = 3.940 y χ²₀.₀₅ = 18.307, por lo que se esperan 0.05, 0.05 y 0.90 (tolerancia 0.0001 por el redondeo de la tabla).',
      ejecutar: () => {
        const r = Est.jiCuadrada(10, 3.940, 18.307);
        return [['Media ν', 10, r.media, T6], ['Varianza 2ν', 20, r.varianza, T6], ['P(X ≤ 3.940)', 0.05, r.izquierda, T4],
          ['P(X ≥ 18.307)', 0.05, r.derecha, T4], ['P(3.940 ≤ X ≤ 18.307)', 0.90, r.entre, T4]];
      }
    },
    {
      id: 'P11', modulo: 'Lognormal',
      titulo: 'Tamaño de archivos subidos (MB): ln X ~ N(μ = 1, σ = 0.5); a = 2, b = 5',
      entradas: 'μ = 1, σ = 0.5, a = 2, b = 5',
      referencia: 'Cálculo manual: media e^(μ+σ²/2) = e^1.125; z(a) = (ln 2 − 1)/0.5; z(b) = (ln 5 − 1)/0.5. ' + REF_CALC,
      ejecutar: () => {
        const r = Est.lognormal(1, 0.5, 2, 5);
        return [['Media', 3.080217, r.media, T6], ['Varianza', 2.694758, r.varianza, T6], ['z(a)', -0.613706, r.za, T6],
          ['z(b)', 1.218876, r.zb, T6], ['P(X ≤ 2)', 0.269705, r.izquierda, T6], ['P(X ≥ 5)', 0.111446, r.derecha, T6],
          ['P(2 ≤ X ≤ 5)', 0.618849, r.entre, T6]];
      }
    },
    {
      id: 'P12', modulo: 'Teorema del límite central',
      titulo: 'Tiempo medio de respuesta de 64 peticiones: μ = 200 ms, σ = 40 ms',
      entradas: 'μ = 200, σ = 40, n = 64; media muestral entre 190 y 210; suma entre 12 500 y 13 000',
      referencia: 'Cálculo manual: error estándar 40/√64 = 5; z = ±2; Φ(2) = 0.9772 (Tabla A.3). Suma: nμ = 12 800, σ√n = 320. ' + REF_CALC,
      ejecutar: () => {
        const m = Est.limiteCentral(200, 40, 64, 'media', 190, 210);
        const s = Est.limiteCentral(200, 40, 64, 'suma', 12500, 13000);
        return [['Error estándar σ/√n', 5, m.errorEstandar, T6], ['P(X̄ ≤ 190)', 0.022750, m.izquierda, T6],
          ['P(190 ≤ X̄ ≤ 210)', 0.954500, m.entre, T6], ['Desviación de la suma σ√n', 320, s.desviacionSuma, T6],
          ['P(ΣX ≤ 12 500)', 0.174251, s.izquierda, T6], ['P(ΣX ≥ 13 000)', 0.265986, s.derecha, T6]];
      }
    },
    {
      id: 'P13', modulo: 'Entrada inválida (Descriptiva)',
      titulo: 'Texto no numérico dentro de los datos',
      entradas: 'Datos: 12, abc, 15',
      referencia: 'Requisito: detectar entradas inválidas con mensajes claros y mantener la aplicación funcionando.',
      error: true,
      ejecutar: () => esperarError(() => Est.descriptiva(Est.leerDatos('12, abc, 15')), 'no es numérico')
    },
    {
      id: 'P14', modulo: 'Entrada inválida (Binomial)',
      titulo: 'Probabilidad de éxito fuera de [0, 1]',
      entradas: 'n = 10, p = 1.5, k = 2',
      referencia: 'Una probabilidad no puede ser mayor que 1.',
      error: true,
      ejecutar: () => esperarError(() => Est.binomial(10, 1.5, 2), 'entre 0 y 1')
    },
    {
      id: 'P15', modulo: 'Entrada inválida (Uniforme)',
      titulo: 'Límites invertidos: a mayor que b',
      entradas: 'α = 2, β = 10, a = 7, b = 4',
      referencia: 'El intervalo [a, b] exige a < b.',
      error: true,
      ejecutar: () => esperarError(() => Est.uniforme(2, 10, 7, 4), 'menor que el límite superior')
    }
  ];

  /** Ejecuta fn y comprueba que lance ErrorEntrada con un mensaje que contenga el texto esperado. */
  function esperarError(fn, textoEsperado) {
    try {
      fn();
      return [['Mensaje de error', `Mensaje que contenga "${textoEsperado}"`, 'No se detectó el error', 'error']];
    } catch (e) {
      const ok = e instanceof Est.ErrorEntrada && e.message.includes(textoEsperado);
      return [['Mensaje de error', `Mensaje que contenga "${textoEsperado}"`, e.message, ok ? 'ok' : 'error']];
    }
  }

  /** Evalúa una fila [nombre, esperado, obtenido, tolerancia] y dice si pasa. */
  function evaluarFila([nombre, esperado, obtenido, tol]) {
    let pasa;
    if (tol === 'ok') pasa = true;
    else if (tol === 'error') pasa = false;
    else pasa = typeof obtenido === 'number' && Math.abs(obtenido - esperado) <= tol + 1e-12;
    return { nombre, esperado, obtenido, tolerancia: tol, pasa };
  }

  function ejecutarTodas() {
    return PRUEBAS.map(p => {
      let filas;
      try { filas = p.ejecutar().map(evaluarFila); }
      catch (e) { filas = [{ nombre: 'Ejecución', esperado: '-', obtenido: 'Error: ' + e.message, tolerancia: '-', pasa: false }]; }
      return { ...p, filas, pasa: filas.every(f => f.pasa) };
    });
  }

  const Pruebas = { PRUEBAS, ejecutarTodas };
  if (typeof module !== 'undefined' && module.exports) module.exports = Pruebas;
  else global.Pruebas = Pruebas;
})(typeof window !== 'undefined' ? window : globalThis);
