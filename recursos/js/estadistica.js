/*
 * estadistica.js — Motor de cálculo de la aplicación.
 * No usa bibliotecas externas: todas las funciones están implementadas aquí
 * para que la aplicación funcione sin internet.
 *
 * Funciones numéricas base:
 *  - lnGamma(x): logaritmo de la función gamma (aproximación de Lanczos, g = 7).
 *  - gammaP(a, x) / gammaQ(a, x): función gamma incompleta regularizada
 *    (serie para x < a + 1 y fracción continua de Lentz en otro caso).
 *    Con ellas se obtienen las acumuladas de Normal, Gamma, Ji cuadrada y Lognormal.
 */
(function (global) {
  'use strict';

  // ---------- Errores de validación ----------
  class ErrorEntrada extends Error {
    constructor(mensaje) { super(mensaje); this.name = 'ErrorEntrada'; }
  }
  function exigir(condicion, mensaje) { if (!condicion) throw new ErrorEntrada(mensaje); }
  function exigirNumero(v, nombre) {
    exigir(typeof v === 'number' && Number.isFinite(v), `"${nombre}" debe ser un número válido.`);
  }
  function exigirEntero(v, nombre, minimo) {
    exigirNumero(v, nombre);
    exigir(Number.isInteger(v), `"${nombre}" debe ser un número entero (sin decimales).`);
    if (minimo !== undefined) exigir(v >= minimo, `"${nombre}" debe ser mayor o igual que ${minimo}.`);
  }
  function exigirProbabilidad(v, nombre) {
    exigirNumero(v, nombre);
    exigir(v >= 0 && v <= 1, `"${nombre}" es una probabilidad: debe estar entre 0 y 1.`);
  }
  function exigirPositivo(v, nombre) {
    exigirNumero(v, nombre);
    exigir(v > 0, `"${nombre}" debe ser mayor que 0.`);
  }
  function exigirLimites(a, b) {
    exigirNumero(a, 'a (límite inferior)');
    exigirNumero(b, 'b (límite superior)');
    exigir(a < b, 'El límite inferior a debe ser menor que el límite superior b.');
  }

  // ---------- Funciones especiales ----------
  const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
    x -= 1;
    let s = LANCZOS[0];
    for (let i = 1; i < 9; i++) s += LANCZOS[i] / (x + i);
    const t = x + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(s);
  }

  function gammaSerie(a, x) {
    let ap = a, suma = 1 / a, delta = suma;
    for (let n = 0; n < 10000; n++) {
      ap += 1; delta *= x / ap; suma += delta;
      if (Math.abs(delta) < Math.abs(suma) * 1e-16) break;
    }
    return suma * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  function gammaFraccion(a, x) {
    const MIN = 1e-300;
    let b = x + 1 - a, c = 1 / MIN, d = 1 / b, h = d;
    for (let i = 1; i < 10000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < MIN) d = MIN;
      c = b + an / c; if (Math.abs(c) < MIN) c = MIN;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  /** P(a, x): gamma incompleta regularizada inferior. */
  function gammaP(a, x) {
    if (x <= 0) return 0;
    return x < a + 1 ? gammaSerie(a, x) : 1 - gammaFraccion(a, x);
  }
  /** Q(a, x) = 1 − P(a, x). */
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    return x < a + 1 ? 1 - gammaSerie(a, x) : gammaFraccion(a, x);
  }

  /** Φ(z): acumulada de la normal estándar. Φ(z) = ½[1 + erf(z/√2)], erf(t) = P(½, t²). */
  function phi(z) {
    if (z === Infinity) return 1;
    if (z === -Infinity) return 0;
    const t = z * z / 2;
    return z >= 0 ? 0.5 + 0.5 * gammaP(0.5, t) : 0.5 * gammaQ(0.5, t);
  }
  function densidadNormal(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

  function lnComb(n, r) { return lnGamma(n + 1) - lnGamma(r + 1) - lnGamma(n - r + 1); }

  /** C(n, r) exacta como BigInt (para mostrar el entero completo). */
  function combinacionExacta(n, r) {
    if (r < 0 || r > n) return 0n;
    r = Math.min(r, n - r);
    let res = 1n;
    for (let i = 1; i <= r; i++) res = res * BigInt(n - r + i) / BigInt(i);
    return res;
  }
  /** C(n, r) como número (puede perder precisión si es muy grande). */
  function combinacion(n, r) {
    if (r < 0 || r > n) return 0;
    if (n <= 1000) return Number(combinacionExacta(n, r));
    return Math.round(Math.exp(lnComb(n, r)));
  }

  // ---------- Estadística descriptiva ----------
  /**
   * Convierte texto en lista de números. Separadores aceptados: coma, punto y coma,
   * espacios, tabulaciones y saltos de línea. El punto es el separador decimal.
   */
  function leerDatos(texto) {
    exigir(typeof texto === 'string' && texto.trim() !== '', 'Ingrese al menos un dato numérico.');
    const partes = texto.split(/[\s,;]+/).filter(p => p !== '');
    const datos = [];
    partes.forEach((p, i) => {
      const limpio = p.trim();
      const valor = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(limpio) ? Number(limpio) : NaN;
      exigir(Number.isFinite(valor),
        `El dato número ${i + 1} ("${limpio}") no es numérico. Use punto para decimales y separe los datos con comas, espacios o saltos de línea.`);
      datos.push(valor);
    });
    return datos;
  }

  function descriptiva(datos) {
    exigir(Array.isArray(datos) && datos.length > 0, 'Ingrese al menos un dato numérico.');
    datos.forEach((d, i) => exigirNumero(d, `dato ${i + 1}`));
    const n = datos.length;
    const ordenados = [...datos].sort((a, b) => a - b);
    const suma = datos.reduce((s, x) => s + x, 0);
    const media = suma / n;
    const mediana = n % 2 === 1 ? ordenados[(n - 1) / 2]
      : (ordenados[n / 2 - 1] + ordenados[n / 2]) / 2;

    const frecuencias = new Map();
    ordenados.forEach(x => frecuencias.set(x, (frecuencias.get(x) || 0) + 1));
    const maxFrec = Math.max(...frecuencias.values());
    const moda = maxFrec === 1 ? [] : [...frecuencias].filter(([, f]) => f === maxFrec).map(([x]) => x);

    const sc = datos.reduce((s, x) => s + (x - media) ** 2, 0); // suma de cuadrados
    const varPob = sc / n;
    const varMuestral = n > 1 ? sc / (n - 1) : NaN;
    return {
      n, suma, media, mediana, moda, frecuenciaModa: maxFrec,
      minimo: ordenados[0], maximo: ordenados[n - 1], rango: ordenados[n - 1] - ordenados[0],
      sumaCuadrados: sc,
      varianzaPoblacional: varPob, desviacionPoblacional: Math.sqrt(varPob),
      varianzaMuestral: varMuestral, desviacionMuestral: Math.sqrt(varMuestral),
      ordenados
    };
  }

  // ---------- Conteo y probabilidad ----------
  function combinaciones(n, r) {
    exigirEntero(n, 'n (total de elementos)', 0);
    exigirEntero(r, 'r (elementos elegidos)', 0);
    exigir(r <= n, 'r no puede ser mayor que n.');
    return { valor: combinacion(n, r), exacto: combinacionExacta(n, r).toString() };
  }
  function union(pA, pB, pAB) {
    exigirProbabilidad(pA, 'P(A)'); exigirProbabilidad(pB, 'P(B)'); exigirProbabilidad(pAB, 'P(A∩B)');
    exigir(pAB <= Math.min(pA, pB) + 1e-12, 'P(A∩B) no puede ser mayor que P(A) ni que P(B).');
    const res = pA + pB - pAB;
    exigir(res <= 1 + 1e-12, 'Con esos valores P(A∪B) sería mayor que 1: revise P(A∩B).');
    return res;
  }
  function condicional(pAB, pB) {
    exigirProbabilidad(pAB, 'P(A∩B)'); exigirProbabilidad(pB, 'P(B)');
    exigir(pB > 0, 'P(B) debe ser mayor que 0 para condicionar en B.');
    exigir(pAB <= pB + 1e-12, 'P(A∩B) no puede ser mayor que P(B).');
    return pAB / pB;
  }
  /** Bayes con k eventos que forman una partición: P(Ai) y P(E|Ai). */
  function bayes(priores, verosimilitudes) {
    exigir(priores.length >= 2, 'Bayes necesita al menos dos eventos A1, A2, ...');
    exigir(priores.length === verosimilitudes.length,
      'Debe ingresar la misma cantidad de probabilidades P(Ai) y P(E|Ai).');
    priores.forEach((p, i) => exigirProbabilidad(p, `P(A${i + 1})`));
    verosimilitudes.forEach((p, i) => exigirProbabilidad(p, `P(E|A${i + 1})`));
    const sumaPriores = priores.reduce((s, x) => s + x, 0);
    exigir(Math.abs(sumaPriores - 1) < 1e-6,
      `Las probabilidades P(Ai) deben sumar 1 (forman una partición); suman ${redondear(sumaPriores, 6)}.`);
    const conjuntas = priores.map((p, i) => p * verosimilitudes[i]);
    const total = conjuntas.reduce((s, x) => s + x, 0);
    exigir(total > 0, 'La probabilidad total P(E) es 0: no se puede aplicar Bayes.');
    return { conjuntas, total, posteriores: conjuntas.map(c => c / total) };
  }

  // ---------- Distribuciones discretas ----------
  function binomialPMF(n, p, k) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    return Math.exp(lnComb(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  function binomialCDF(n, p, k) {
    let s = 0;
    for (let i = 0; i <= Math.min(k, n); i++) s += binomialPMF(n, p, i);
    return Math.min(1, s);
  }
  function binomial(n, p, k) {
    exigirEntero(n, 'n (número de ensayos)', 1);
    exigir(n <= 100000, 'n es demasiado grande para esta aplicación (máximo 100 000).');
    exigirProbabilidad(p, 'p (probabilidad de éxito)');
    exigirEntero(k, 'k (número de éxitos)', 0);
    exigir(k <= n, 'k no puede ser mayor que n.');
    const exacto = binomialPMF(n, p, k);
    const comoMaximo = binomialCDF(n, p, k);
    const alMenos = k === 0 ? 1 : Math.max(0, 1 - binomialCDF(n, p, k - 1));
    return { exacto, comoMaximo, alMenos, media: n * p, varianza: n * p * (1 - p) };
  }

  function hipergeometricaPMF(N, K, n, k) {
    if (k < Math.max(0, n - (N - K)) || k > Math.min(n, K)) return 0;
    return Math.exp(lnComb(K, k) + lnComb(N - K, n - k) - lnComb(N, n));
  }
  function hipergeometrica(N, K, n, k) {
    exigirEntero(N, 'N (tamaño de la población)', 1);
    exigirEntero(K, 'K (éxitos en la población)', 0);
    exigirEntero(n, 'n (tamaño de la muestra)', 1);
    exigirEntero(k, 'k (éxitos en la muestra)', 0);
    exigir(K <= N, 'K no puede ser mayor que N.');
    exigir(n <= N, 'La muestra n no puede ser mayor que la población N (es sin reemplazo).');
    exigir(k <= n, 'k no puede ser mayor que n.');
    exigir(k <= K, 'k no puede ser mayor que K: no hay tantos éxitos en la población.');
    exigir(n - k <= N - K, 'n − k no puede ser mayor que N − K: no hay tantos fracasos en la población.');
    const media = n * K / N;
    const varianza = N > 1 ? n * (K / N) * (1 - K / N) * (N - n) / (N - 1) : 0;
    let acumulada = 0;
    for (let i = 0; i <= k; i++) acumulada += hipergeometricaPMF(N, K, n, i);
    return {
      exacto: hipergeometricaPMF(N, K, n, k), comoMaximo: Math.min(1, acumulada),
      numerador: [combinacionExacta(K, k).toString(), combinacionExacta(N - K, n - k).toString()],
      denominador: combinacionExacta(N, n).toString(), media, varianza
    };
  }

  function poissonPMF(lambda, k) {
    if (lambda === 0) return k === 0 ? 1 : 0;
    return Math.exp(-lambda + k * Math.log(lambda) - lnGamma(k + 1));
  }
  function poissonCDF(lambda, k) {
    if (k < 0) return 0;
    return gammaQ(k + 1, lambda); // P(X ≤ k) = Q(k + 1, λ)
  }
  /** λ ajustado = promedio × (intervalo analizado / intervalo de referencia). */
  function poisson(promedio, intervaloRef, intervaloAnalizado, k) {
    exigirNumero(promedio, 'promedio de ocurrencias');
    exigir(promedio >= 0, 'El promedio de ocurrencias no puede ser negativo.');
    exigirPositivo(intervaloRef, 'intervalo de referencia');
    exigirPositivo(intervaloAnalizado, 'intervalo analizado');
    exigirEntero(k, 'k (número de ocurrencias)', 0);
    const lambda = promedio * intervaloAnalizado / intervaloRef;
    exigir(lambda <= 1e6, 'λ es demasiado grande para esta aplicación.');
    const exacto = poissonPMF(lambda, k);
    const comoMaximo = lambda === 0 ? 1 : poissonCDF(lambda, k);
    const alMenos = k === 0 ? 1 : (lambda === 0 ? 0 : gammaP(k, lambda)); // P(X ≥ k) = P(k, λ)
    return { lambda, exacto, comoMaximo, alMenos, mayorQue: 1 - comoMaximo, media: lambda, varianza: lambda };
  }

  // ---------- Distribuciones continuas ----------
  /** Arma las tres probabilidades pedidas a partir de la función acumulada F. */
  function tresProbabilidades(F, a, b) {
    const Fa = F(a), Fb = F(b);
    return { izquierda: Fa, derecha: 1 - Fb, entre: Math.max(0, Fb - Fa), Fa, Fb };
  }

  function uniforme(minimo, maximo, a, b) {
    exigirNumero(minimo, 'α (mínimo)'); exigirNumero(maximo, 'β (máximo)');
    exigir(minimo < maximo, 'El mínimo α debe ser menor que el máximo β.');
    exigirLimites(a, b);
    const F = x => x <= minimo ? 0 : x >= maximo ? 1 : (x - minimo) / (maximo - minimo);
    return {
      media: (minimo + maximo) / 2, varianza: (maximo - minimo) ** 2 / 12,
      densidad: 1 / (maximo - minimo), ...tresProbabilidades(F, a, b)
    };
  }

  function normal(mu, sigma, a, b) {
    exigirNumero(mu, 'μ (media)'); exigirPositivo(sigma, 'σ (desviación estándar)');
    exigirLimites(a, b);
    const za = (a - mu) / sigma, zb = (b - mu) / sigma;
    return {
      media: mu, varianza: sigma * sigma, za, zb,
      izquierda: phi(za), derecha: phi(-zb), entre: Math.max(0, phi(zb) - phi(za)),
      Fa: phi(za), Fb: phi(zb)
    };
  }

  function gamma(alfa, theta, a, b) {
    exigirPositivo(alfa, 'α (forma)'); exigirPositivo(theta, 'θ (escala)');
    exigirLimites(a, b);
    exigir(a >= 0, 'La distribución gamma solo toma valores x ≥ 0: use a ≥ 0.');
    const F = x => gammaP(alfa, Math.max(0, x) / theta);
    return { media: alfa * theta, varianza: alfa * theta * theta, ...tresProbabilidades(F, a, b),
      derecha: gammaQ(alfa, b / theta) };
  }

  function exponencial(lambda, a, b) {
    exigirPositivo(lambda, 'λ (tasa)');
    exigirLimites(a, b);
    exigir(a >= 0, 'La distribución exponencial solo toma valores x ≥ 0: use a ≥ 0.');
    const F = x => x <= 0 ? 0 : 1 - Math.exp(-lambda * x);
    return { lambda, tiempoPromedio: 1 / lambda, media: 1 / lambda, varianza: 1 / (lambda * lambda),
      ...tresProbabilidades(F, a, b), derecha: Math.exp(-lambda * b) };
  }

  function jiCuadrada(nu, a, b) {
    exigirPositivo(nu, 'ν (grados de libertad)');
    exigir(Number.isInteger(nu), 'ν (grados de libertad) debe ser un número entero.');
    exigirLimites(a, b);
    exigir(a >= 0, 'La ji cuadrada solo toma valores x ≥ 0: use a ≥ 0.');
    const F = x => gammaP(nu / 2, Math.max(0, x) / 2);
    return { media: nu, varianza: 2 * nu, ...tresProbabilidades(F, a, b), derecha: gammaQ(nu / 2, b / 2) };
  }

  function lognormal(mu, sigma, a, b) {
    exigirNumero(mu, 'μ (media de ln X)'); exigirPositivo(sigma, 'σ (desviación de ln X)');
    exigirLimites(a, b);
    exigir(a > 0, 'La lognormal solo toma valores x > 0 (no existe ln de 0 ni de negativos): use a > 0.');
    const za = (Math.log(a) - mu) / sigma, zb = (Math.log(b) - mu) / sigma;
    return {
      media: Math.exp(mu + sigma * sigma / 2),
      varianza: (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma),
      za, zb, lnA: Math.log(a), lnB: Math.log(b),
      izquierda: phi(za), derecha: phi(-zb), entre: Math.max(0, phi(zb) - phi(za)), Fa: phi(za), Fb: phi(zb)
    };
  }

  /** Teorema del límite central para la media muestral y la suma. */
  function limiteCentral(mu, sigma, n, tipo, a, b) {
    exigirNumero(mu, 'μ (media de la población)'); exigirPositivo(sigma, 'σ (desviación de la población)');
    exigirEntero(n, 'n (tamaño de muestra)', 1);
    exigir(tipo === 'media' || tipo === 'suma', 'Elija si analiza la media muestral o la suma.');
    exigirLimites(a, b);
    const errorEstandar = sigma / Math.sqrt(n);
    const centro = tipo === 'media' ? mu : n * mu;
    const dispersion = tipo === 'media' ? errorEstandar : sigma * Math.sqrt(n);
    const za = (a - centro) / dispersion, zb = (b - centro) / dispersion;
    return {
      mediaMuestral: mu, errorEstandar, mediaSuma: n * mu, desviacionSuma: sigma * Math.sqrt(n),
      centro, dispersion, za, zb,
      izquierda: phi(za), derecha: phi(-zb), entre: Math.max(0, phi(zb) - phi(za)), Fa: phi(za), Fb: phi(zb)
    };
  }

  // ---------- Densidades (para las gráficas) ----------
  const densidades = {
    uniforme: (x, p) => (x >= p.minimo && x <= p.maximo) ? 1 / (p.maximo - p.minimo) : 0,
    normal: (x, p) => densidadNormal((x - p.mu) / p.sigma) / p.sigma,
    gamma: (x, p) => x <= 0 ? 0 : Math.exp((p.alfa - 1) * Math.log(x) - x / p.theta - lnGamma(p.alfa) - p.alfa * Math.log(p.theta)),
    exponencial: (x, p) => x < 0 ? 0 : p.lambda * Math.exp(-p.lambda * x),
    jiCuadrada: (x, p) => x <= 0 ? 0 : Math.exp((p.nu / 2 - 1) * Math.log(x) - x / 2 - lnGamma(p.nu / 2) - (p.nu / 2) * Math.log(2)),
    lognormal: (x, p) => x <= 0 ? 0 : densidadNormal((Math.log(x) - p.mu) / p.sigma) / (x * p.sigma)
  };

  function redondear(x, decimales) {
    const f = 10 ** decimales;
    return Math.round(x * f) / f;
  }

  const Est = {
    ErrorEntrada, lnGamma, gammaP, gammaQ, phi, densidadNormal, combinacion, combinacionExacta,
    leerDatos, descriptiva, combinaciones, union, condicional, bayes,
    binomialPMF, binomial, hipergeometricaPMF, hipergeometrica, poissonPMF, poisson,
    uniforme, normal, gamma, exponencial, jiCuadrada, lognormal, limiteCentral,
    densidades, redondear
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Est;
  else global.Est = Est;
})(typeof window !== 'undefined' ? window : globalThis);
