/*
 * modulos.js — Definición de cada módulo: teoría (definición, parámetros, supuestos,
 * media y varianza), campos de entrada, ejemplo precargado y función de cálculo.
 * La interfaz (app.js) construye las pantallas a partir de estas definiciones.
 */
(function (global) {
  'use strict';
  const Est = global.Est;

  // ---------- Formato ----------
  function fmt(x, d = 6) {
    if (typeof x !== 'number' || Number.isNaN(x)) return '—';
    if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (Number.isInteger(x) && Math.abs(x) < 1e15) return String(x);
    if (x !== 0 && Math.abs(x) < 1e-6) return x.toExponential(4);
    return x.toFixed(d).replace(/0+$/, '').replace(/\.$/, '') || '0';
  }
  const f6 = x => (typeof x === 'number' && Number.isFinite(x) && Math.abs(x) >= 1e-6) ? x.toFixed(6) : fmt(x);
  const pct = p => (p * 100).toFixed(2) + '\u00a0%'; // espacio no separable antes de %
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const conU = (x, u) => u ? `${fmt(x)} ${esc(u)}` : fmt(x);
  const varX = v => v && v.variable ? esc(v.variable) : 'X';

  // Campos repetidos en las distribuciones continuas
  const campoVariable = (ej) => ({ id: 'variable', etiqueta: '¿Qué representa X? (opcional)', tipo: 'texto', opcional: true,
    ayuda: `Descripción breve para la interpretación, por ejemplo: "${ej}".` });
  const campoUnidad = (ej) => ({ id: 'unidad', etiqueta: 'Unidad de medida (opcional)', tipo: 'texto', opcional: true,
    ayuda: `Unidad en que se mide X, por ejemplo: ${ej}.` });
  const camposLimites = [
    { id: 'a', etiqueta: 'a (límite inferior)', tipo: 'numero', ayuda: 'Se calcula P(X ≤ a): probabilidad a la izquierda de a.' },
    { id: 'b', etiqueta: 'b (límite superior)', tipo: 'numero', ayuda: 'Se calcula P(X ≥ b) a la derecha de b y P(a ≤ X ≤ b) entre ambos. Debe cumplirse a < b.' }
  ];

  /** Filas e interpretación comunes de las tres probabilidades continuas. */
  function filasContinuas(r) {
    return [
      ['P(X ≤ a) — izquierda', f6(r.izquierda), pct(r.izquierda)],
      ['P(X ≥ b) — derecha', f6(r.derecha), pct(r.derecha)],
      ['P(a ≤ X ≤ b) — entre', f6(r.entre), pct(r.entre)]
    ];
  }
  function interpretacionContinua(r, v, a, b) {
    const X = varX(v), u = v.unidad;
    return `<p>Si <b>X</b> = ${X}: la probabilidad de que X sea <b>a lo sumo ${conU(a, u)}</b> es ${f6(r.izquierda)} (${pct(r.izquierda)}); ` +
      `de que sea <b>al menos ${conU(b, u)}</b> es ${f6(r.derecha)} (${pct(r.derecha)}); ` +
      `y de que quede <b>entre ${conU(a, u)} y ${conU(b, u)}</b> es ${f6(r.entre)} (${pct(r.entre)}).</p>` +
      `<p class="nota">En una variable continua P(X = x) = 0, por eso da lo mismo usar &lt; o ≤. ` +
      `Las tres probabilidades no suman 1 porque las colas se toman en puntos distintos (a y b).</p>`;
  }

  const MODULOS = [
    // =====================================================================
    {
      id: 'descriptiva', nombre: 'Descriptiva', grupo: 'Estadística descriptiva',
      teoria: {
        definicion: 'Resume un conjunto de datos numéricos sin agrupar con medidas de tendencia central (media, mediana, moda) y de dispersión (rango, varianza y desviación estándar).',
        parametros: ['Datos x₁, x₂, …, xₙ (números separados por comas, espacios o saltos de línea).',
          'Tipo: <b>población</b> (se tienen todos los elementos, se divide entre n) o <b>muestra</b> (subconjunto, se divide entre n − 1).'],
        supuestos: ['Los datos son cuantitativos y medidos en la misma unidad.',
          'Si los datos son una muestra, se usa n − 1 (corrección de Bessel) para que s² estime sin sesgo a σ².'],
        media: 'x̄ = Σxᵢ / n',
        varianza: 'σ² = Σ(xᵢ − x̄)² / n  (poblacional)   ·   s² = Σ(xᵢ − x̄)² / (n − 1)  (muestral)'
      },
      campos: [
        { id: 'datos', etiqueta: 'Datos numéricos', tipo: 'area', importar: true,
          ayuda: 'Escriba o pegue los datos. Separe con comas, espacios, punto y coma o saltos de línea. Use punto (.) para decimales. También puede importar un archivo .txt o .csv.' },
        { id: 'tipo', etiqueta: 'Los datos son…', tipo: 'select', opciones: [['muestra', 'Una muestra (dividir entre n − 1)'], ['poblacion', 'Toda la población (dividir entre n)']],
          ayuda: 'Se muestran ambas varianzas para compararlas; la que corresponde al tipo elegido se resalta.' },
        campoUnidad('ms, segundos, MB')
      ],
      ejemplo: {
        titulo: 'Tiempos de respuesta de una API REST',
        origen: 'Datos simulados',
        contexto: 'Un equipo de desarrollo midió el tiempo de respuesta (en milisegundos) de 12 peticiones a un endpoint de su API para evaluar su rendimiento. Las 12 peticiones son una muestra de todas las que recibe el servidor.',
        valores: { datos: '120, 135, 128, 140, 150, 128, 132, 145, 138, 128, 160, 126', tipo: 'muestra', unidad: 'ms' },
        esperado: ['n = 12; media = 135.833333 ms; mediana = 133.5 ms; moda = 128 ms', 'mínimo = 120; máximo = 160; rango = 40 ms',
          'Varianza poblacional σ² = 119.805556; muestral s² = 130.696970', 'Desviación poblacional σ = 10.945572; muestral s = 11.432278 ms'],
        interpretacion: 'El tiempo típico de respuesta es de unos 136 ms y la mitad de las peticiones responde en 133.5 ms o menos. Como es una muestra, la desviación adecuada es s ≈ 11.43 ms: la mayoría de tiempos están entre 124 y 147 ms. La varianza muestral es mayor que la poblacional porque divide entre n − 1 = 11 en lugar de 12.'
      },
      calcular(v) {
        const datos = Est.leerDatos(v.datos);
        const r = Est.descriptiva(datos);
        const u = v.unidad, esMuestra = v.tipo === 'muestra';
        const modaTxt = r.moda.length === 0 ? 'No hay moda (todos los valores aparecen una sola vez)'
          : `${r.moda.map(m => fmt(m)).join(', ')} (se repite ${r.frecuenciaModa} veces)`;
        const filas = [
          ['Cantidad de observaciones (n)', fmt(r.n), ''],
          ['Media (x̄)', conU(r.media, u), ''],
          ['Mediana', conU(r.mediana, u), ''],
          ['Moda', modaTxt, r.moda.length > 1 ? 'Multimodal' : ''],
          ['Mínimo', conU(r.minimo, u), ''], ['Máximo', conU(r.maximo, u), ''],
          ['Rango', conU(r.rango, u), 'máximo − mínimo'],
          ['Varianza poblacional (σ²)', fmt(r.varianzaPoblacional) + (u ? ` ${esc(u)}²` : ''), 'divide entre n', !esMuestra],
          ['Desviación estándar poblacional (σ)', conU(r.desviacionPoblacional, u), '√σ²', !esMuestra],
          ['Varianza muestral (s²)', r.n > 1 ? fmt(r.varianzaMuestral) + (u ? ` ${esc(u)}²` : '') : 'No definida con n = 1', 'divide entre n − 1', esMuestra],
          ['Desviación estándar muestral (s)', r.n > 1 ? conU(r.desviacionMuestral, u) : 'No definida con n = 1', '√s²', esMuestra]
        ];
        const mitad = r.n % 2 === 1
          ? `n = ${r.n} es impar: la mediana es el dato en la posición (n + 1)/2 = ${(r.n + 1) / 2}.`
          : `n = ${r.n} es par: la mediana es el promedio de los datos en las posiciones ${r.n / 2} y ${r.n / 2 + 1}: (${fmt(r.ordenados[r.n / 2 - 1])} + ${fmt(r.ordenados[r.n / 2])}) / 2 = ${fmt(r.mediana)}.`;
        const procedimiento = [
          `Datos ordenados: ${r.ordenados.map(x => fmt(x)).join(', ')}`,
          `Suma: Σxᵢ = ${fmt(r.suma)} → x̄ = ${fmt(r.suma)} / ${r.n} = ${fmt(r.media)}`,
          mitad,
          `Suma de cuadrados: Σ(xᵢ − x̄)² = ${fmt(r.sumaCuadrados)}`,
          `Poblacional: σ² = ${fmt(r.sumaCuadrados)} / ${r.n} = ${fmt(r.varianzaPoblacional)};  σ = √σ² = ${fmt(r.desviacionPoblacional)}`,
          r.n > 1 ? `Muestral: s² = ${fmt(r.sumaCuadrados)} / ${r.n - 1} = ${fmt(r.varianzaMuestral)};  s = √s² = ${fmt(r.desviacionMuestral)}` : 'Con n = 1 no se puede calcular la varianza muestral (n − 1 = 0).'
        ];
        const d = esMuestra ? r.desviacionMuestral : r.desviacionPoblacional;
        const interpretacion = `<p>El valor promedio es ${conU(r.media, u)} y la mitad de los datos es menor o igual que ${conU(r.mediana, u)}. ` +
          `Los datos van de ${conU(r.minimo, u)} a ${conU(r.maximo, u)} (rango ${conU(r.rango, u)}).</p>` +
          (r.n > 1 ? `<p>Como los datos son <b>${esMuestra ? 'una muestra' : 'toda la población'}</b>, la desviación adecuada es ${esMuestra ? 's' : 'σ'} = ${conU(d, u)}: ` +
          `en promedio los datos se alejan aproximadamente esa cantidad de la media. ` +
          `La varianza muestral (${fmt(r.varianzaMuestral)}) siempre es mayor que la poblacional (${fmt(r.varianzaPoblacional)}) porque divide entre n − 1 = ${r.n - 1} en lugar de n = ${r.n}; la diferencia se reduce cuando n crece.</p>` : '');
        return { filas, procedimiento, interpretacion, grafica: { tipo: 'datos', datos: r.ordenados, unidad: u, moda: r.moda } };
      }
    },
    // =====================================================================
    {
      id: 'conteo', nombre: 'Conteo y probabilidad', grupo: 'Probabilidad',
      teoria: {
        definicion: 'Herramientas básicas de probabilidad. Las <b>combinaciones</b> cuentan de cuántas formas se eligen r elementos de n sin importar el orden. La <b>regla de la unión</b>, la <b>probabilidad condicional</b> y la <b>regla de Bayes</b> relacionan probabilidades de eventos.',
        parametros: ['Combinaciones: n (total) y r (elegidos), enteros con 0 ≤ r ≤ n.',
          'Unión: P(A), P(B) y P(A∩B).', 'Condicional: P(A∩B) y P(B) > 0.',
          'Bayes: probabilidades a priori P(A₁), …, P(Aₖ) y verosimilitudes P(E|A₁), …, P(E|Aₖ).'],
        supuestos: ['Las probabilidades están entre 0 y 1.', 'En Bayes, los eventos A₁, …, Aₖ forman una partición: son mutuamente excluyentes y sus probabilidades suman 1.',
          'Puede llenar solo las secciones que necesite; las secciones vacías se omiten.'],
        media: 'C(n, r) = n! / [r! (n − r)!]   ·   P(A∪B) = P(A) + P(B) − P(A∩B)',
        varianza: 'P(A|B) = P(A∩B) / P(B)   ·   P(Aᵢ|E) = P(Aᵢ)P(E|Aᵢ) / Σⱼ P(Aⱼ)P(E|Aⱼ)',
        etiquetas: ['Combinaciones y unión', 'Condicional y Bayes']
      },
      campos: [
        { id: 'n', grupo: '1. Combinaciones', etiqueta: 'n (total de elementos)', tipo: 'numero', opcional: true, ayuda: 'Entero ≥ 0.' },
        { id: 'r', grupo: '1. Combinaciones', etiqueta: 'r (elementos a elegir)', tipo: 'numero', opcional: true, ayuda: 'Entero entre 0 y n.' },
        { id: 'pA', grupo: '2. Unión de dos eventos', etiqueta: 'P(A)', tipo: 'numero', opcional: true, ayuda: 'Probabilidad del evento A (0 a 1).' },
        { id: 'pB', grupo: '2. Unión de dos eventos', etiqueta: 'P(B)', tipo: 'numero', opcional: true, ayuda: 'Probabilidad del evento B (0 a 1).' },
        { id: 'pAyB', grupo: '2. Unión de dos eventos', etiqueta: 'P(A∩B)', tipo: 'numero', opcional: true, ayuda: 'Probabilidad de que ocurran A y B a la vez.' },
        { id: 'cAyB', grupo: '3. Probabilidad condicional P(A|B)', etiqueta: 'P(A∩B)', tipo: 'numero', opcional: true, ayuda: 'Probabilidad de A y B juntos.' },
        { id: 'cB', grupo: '3. Probabilidad condicional P(A|B)', etiqueta: 'P(B)', tipo: 'numero', opcional: true, ayuda: 'Probabilidad del evento que ya ocurrió (debe ser > 0).' },
        { id: 'priores', grupo: '4. Regla de Bayes', etiqueta: 'P(A₁), P(A₂), … (a priori)', tipo: 'texto', opcional: true, ayuda: 'Separadas por comas. Deben sumar 1. Ej.: 0.5, 0.3, 0.2' },
        { id: 'veros', grupo: '4. Regla de Bayes', etiqueta: 'P(E|A₁), P(E|A₂), …', tipo: 'texto', opcional: true, ayuda: 'Probabilidad del evento E dentro de cada Aᵢ, en el mismo orden.' },
        { id: 'nombres', grupo: '4. Regla de Bayes', etiqueta: 'Nombres de A₁, A₂, … (opcional)', tipo: 'texto', opcional: true, ayuda: 'Ej.: Servidor 1, Servidor 2, Servidor 3' }
      ],
      ejemplo: {
        titulo: 'Equipo de pruebas, fallas y servidores',
        origen: 'Datos simulados',
        contexto: '(1) ¿De cuántas formas se eligen 3 testers de un equipo de 10? (2) En un sistema, A = "falla la red" con P = 0.30, B = "falla la base de datos" con P = 0.25 y ambas ocurren con P = 0.10. (3) ¿Cuál es P(A|B)? (4) Un balanceador envía 50 %, 30 % y 20 % de las peticiones a tres servidores cuyas tasas de error son 1 %, 2 % y 4 %. Si una petición falló (E), ¿de qué servidor proviene probablemente?',
        valores: { n: 10, r: 3, pA: 0.30, pB: 0.25, pAyB: 0.10, cAyB: 0.10, cB: 0.25, priores: '0.5, 0.3, 0.2', veros: '0.01, 0.02, 0.04', nombres: 'Servidor 1, Servidor 2, Servidor 3' },
        esperado: ['C(10, 3) = 120', 'P(A∪B) = 0.45', 'P(A|B) = 0.40', 'P(E) = 0.019; P(S1|E) = 0.263158; P(S2|E) = 0.315789; P(S3|E) = 0.421053'],
        interpretacion: 'Hay 120 equipos de 3 testers posibles. Con probabilidad 0.45 falla al menos la red o la base de datos. Si la base de datos falló, la red falla con probabilidad 0.40. Aunque el Servidor 3 recibe solo el 20 % del tráfico, es el origen más probable de una petición fallida (42.1 %) porque su tasa de error es la más alta.'
      },
      calcular(v) {
        const filas = [], procedimiento = [], interp = [];
        const lleno = ids => ids.map(id => v[id] !== '' && v[id] !== undefined);
        const seccion = (ids, nombre) => {
          const l = lleno(ids);
          if (l.every(x => !x)) return false;
          if (!l.every(x => x)) throw new Est.ErrorEntrada(`Complete todos los campos de la sección "${nombre}" o déjela vacía.`);
          return true;
        };
        let alguna = false;
        if (seccion(['n', 'r'], '1. Combinaciones')) {
          alguna = true;
          const c = Est.combinaciones(v.n, v.r);
          filas.push([`C(${v.n}, ${v.r})`, c.exacto, 'combinaciones']);
          procedimiento.push(`C(${v.n}, ${v.r}) = ${v.n}! / [${v.r}! · ${v.n - v.r}!] = ${c.exacto}`);
          interp.push(`Hay <b>${c.exacto}</b> formas distintas de elegir ${v.r} elementos de ${v.n} cuando el orden no importa.`);
        }
        if (seccion(['pA', 'pB', 'pAyB'], '2. Unión de dos eventos')) {
          alguna = true;
          const u = Est.union(v.pA, v.pB, v.pAyB);
          filas.push(['P(A∪B)', f6(u), pct(u)]);
          procedimiento.push(`P(A∪B) = P(A) + P(B) − P(A∩B) = ${fmt(v.pA)} + ${fmt(v.pB)} − ${fmt(v.pAyB)} = ${fmt(u)}`);
          interp.push(`La probabilidad de que ocurra <b>A o B (o ambos)</b> es ${fmt(u)} (${pct(u)}). Se resta P(A∩B) para no contar dos veces la parte común.`);
        }
        if (seccion(['cAyB', 'cB'], '3. Probabilidad condicional')) {
          alguna = true;
          const c = Est.condicional(v.cAyB, v.cB);
          filas.push(['P(A|B)', f6(c), pct(c)]);
          procedimiento.push(`P(A|B) = P(A∩B) / P(B) = ${fmt(v.cAyB)} / ${fmt(v.cB)} = ${fmt(c)}`);
          interp.push(`Sabiendo que B ya ocurrió, la probabilidad de A es ${fmt(c)} (${pct(c)}): el espacio muestral se reduce a B.`);
        }
        if (seccion(['priores', 'veros'], '4. Regla de Bayes')) {
          alguna = true;
          const pri = Est.leerDatos(v.priores), ver = Est.leerDatos(v.veros);
          const b = Est.bayes(pri, ver);
          const nombres = v.nombres ? v.nombres.split(',').map(s => s.trim()) : [];
          const nom = i => nombres[i] || `A${i + 1}`;
          procedimiento.push(`Probabilidad total: P(E) = ${pri.map((p, i) => `${fmt(p)}·${fmt(ver[i])}`).join(' + ')} = ${b.conjuntas.map(c => fmt(c)).join(' + ')} = ${fmt(b.total)}`);
          filas.push(['P(E) (probabilidad total)', f6(b.total), pct(b.total)]);
          b.posteriores.forEach((p, i) => {
            filas.push([`P(${esc(nom(i))} | E)`, f6(p), pct(p)]);
            procedimiento.push(`P(${esc(nom(i))}|E) = ${fmt(b.conjuntas[i])} / ${fmt(b.total)} = ${fmt(p)}`);
          });
          const imax = b.posteriores.indexOf(Math.max(...b.posteriores));
          interp.push(`Dado que ocurrió E, el origen más probable es <b>${esc(nom(imax))}</b> con ${pct(b.posteriores[imax])}. ` +
            `Bayes actualiza las probabilidades iniciales (${pri.map(p => pct(p)).join(', ')}) con la información de E.`);
        }
        if (!alguna) throw new Est.ErrorEntrada('Complete al menos una de las cuatro secciones (o use "Cargar ejemplo").');
        return { filas, procedimiento, interpretacion: interp.map(t => `<p>${t}</p>`).join('') };
      }
    },
    // =====================================================================
    {
      id: 'binomial', nombre: 'Binomial', grupo: 'Distribuciones discretas',
      teoria: {
        definicion: 'La variable aleatoria discreta X = número de éxitos en n ensayos independientes, cada uno con la misma probabilidad de éxito p (ensayos de Bernoulli).',
        parametros: ['n: número de ensayos (entero ≥ 1).', 'p: probabilidad de éxito en cada ensayo (0 ≤ p ≤ 1).', 'k: número de éxitos de interés (0 ≤ k ≤ n).'],
        supuestos: ['Número fijo de ensayos n.', 'Cada ensayo tiene solo dos resultados: éxito o fracaso.', 'p es constante en todos los ensayos.', 'Los ensayos son independientes (muestreo con reemplazo o población muy grande).'],
        media: 'E[X] = μ = np',
        varianza: 'σ² = np(1 − p)',
        formula: 'P(X = k) = C(n, k) pᵏ (1 − p)ⁿ⁻ᵏ'
      },
      campos: [
        { id: 'n', etiqueta: 'n (número de ensayos)', tipo: 'numero', ayuda: 'Entero ≥ 1. Ej.: paquetes enviados.' },
        { id: 'p', etiqueta: 'p (probabilidad de éxito)', tipo: 'numero', ayuda: 'Entre 0 y 1. Ej.: 0.10 para 10 %.' },
        { id: 'k', etiqueta: 'k (número de éxitos)', tipo: 'numero', ayuda: 'Entero entre 0 y n.' },
        { id: 'variable', etiqueta: '¿Qué cuenta X? (opcional)', tipo: 'texto', opcional: true, ayuda: 'Ej.: "paquetes perdidos".' }
      ],
      ejemplo: {
        titulo: 'Pérdida de paquetes en una red',
        origen: 'Datos simulados (p tomado como tasa típica de pérdida en una red inalámbrica congestionada)',
        contexto: 'Se envían 10 paquetes por una red donde cada paquete se pierde de forma independiente con probabilidad 0.10. X = número de paquetes perdidos. ¿Probabilidad de perder exactamente 2, como máximo 2 y al menos 2?',
        valores: { n: 10, p: 0.10, k: 2, variable: 'paquetes perdidos' },
        esperado: ['P(X = 2) = 0.193710', 'P(X ≤ 2) = 0.929809', 'P(X ≥ 2) = 0.263901', 'E[X] = 1; σ² = 0.9'],
        interpretacion: 'Hay 19.37 % de probabilidad de perder exactamente 2 paquetes; en el 92.98 % de los envíos se pierden 2 o menos; y en el 26.39 % se pierden 2 o más, lo que obligaría a retransmitir. En promedio se pierde 1 paquete de cada 10.'
      },
      calcular(v) {
        const r = Est.binomial(v.n, v.p, v.k);
        const { n, p, k } = v, X = v.variable ? esc(v.variable) : 'éxitos';
        const filas = [
          [`P(X = ${k}) — exactamente k`, f6(r.exacto), pct(r.exacto)],
          [`P(X ≤ ${k}) — como máximo k`, f6(r.comoMaximo), pct(r.comoMaximo)],
          [`P(X ≥ ${k}) — al menos k`, f6(r.alMenos), pct(r.alMenos)],
          ['Media E[X] = np', fmt(r.media), ''], ['Varianza np(1 − p)', fmt(r.varianza), ''], ['Desviación estándar', fmt(Math.sqrt(r.varianza)), '']
        ];
        const procedimiento = [
          `P(X = ${k}) = C(${n}, ${k}) · ${fmt(p)}^${k} · ${fmt(1 - p)}^${n - k} = ${Est.combinacionExacta(n, k)} · ${fmt(p ** k)} · ${fmt((1 - p) ** (n - k))} = ${f6(r.exacto)}`,
          `P(X ≤ ${k}) = Σ P(X = i) para i = 0, …, ${k} = ${f6(r.comoMaximo)}`,
          k === 0 ? 'P(X ≥ 0) = 1' : `P(X ≥ ${k}) = 1 − P(X ≤ ${k - 1}) = 1 − ${f6(1 - r.alMenos)} = ${f6(r.alMenos)}`,
          `E[X] = np = ${n} · ${fmt(p)} = ${fmt(r.media)};  σ² = np(1 − p) = ${fmt(r.varianza)}`
        ];
        const interpretacion = `<p>En ${n} ensayos, la probabilidad de obtener <b>exactamente ${k}</b> ${X} es ${pct(r.exacto)}; ` +
          `<b>como máximo ${k}</b>, ${pct(r.comoMaximo)}; y <b>al menos ${k}</b>, ${pct(r.alMenos)}.</p>` +
          `<p>La esperanza E[X] = ${fmt(r.media)} indica cuántos ${X} se esperan en promedio si el experimento se repite muchas veces.</p>`;
        const max = n <= 60 ? n : Math.min(n, Math.ceil(r.media + 5 * Math.sqrt(r.varianza) + 2));
        const min = n <= 60 ? 0 : Math.max(0, Math.floor(r.media - 5 * Math.sqrt(r.varianza) - 2));
        const barras = [];
        for (let i = Math.min(min, k); i <= Math.max(max, k); i++) barras.push({ x: i, p: Est.binomialPMF(n, p, i) });
        return { filas, procedimiento, interpretacion, grafica: { tipo: 'discreta', barras, k } };
      }
    },
    // =====================================================================
    {
      id: 'hipergeometrica', nombre: 'Hipergeométrica', grupo: 'Distribuciones discretas',
      teoria: {
        definicion: 'X = número de éxitos en una muestra de tamaño n tomada <b>sin reemplazo</b> de una población finita de N elementos, de los cuales K son éxitos.',
        parametros: ['N: tamaño de la población.', 'K: éxitos en la población.', 'n: tamaño de la muestra.', 'k: éxitos en la muestra.'],
        supuestos: ['Población finita y conocida.', 'Muestreo sin reemplazo: cada extracción cambia la probabilidad de las siguientes (ensayos dependientes).', 'Todas las muestras de tamaño n son igualmente probables.'],
        media: 'E[X] = n·K / N',
        varianza: 'σ² = n (K/N)(1 − K/N)(N − n)/(N − 1)',
        formula: 'P(X = k) = C(K, k) · C(N − K, n − k) / C(N, n)'
      },
      campos: [
        { id: 'N', etiqueta: 'N (tamaño de la población)', tipo: 'numero', ayuda: 'Entero ≥ 1.' },
        { id: 'K', etiqueta: 'K (éxitos en la población)', tipo: 'numero', ayuda: 'Entero entre 0 y N.' },
        { id: 'n', etiqueta: 'n (tamaño de la muestra)', tipo: 'numero', ayuda: 'Entero entre 1 y N.' },
        { id: 'k', etiqueta: 'k (éxitos en la muestra)', tipo: 'numero', ayuda: 'Entero entre 0 y n.' },
        { id: 'variable', etiqueta: '¿Qué es un éxito? (opcional)', tipo: 'texto', opcional: true, ayuda: 'Ej.: "licencias defectuosas".' }
      ],
      ejemplo: {
        titulo: 'Licencias de software defectuosas',
        origen: 'Datos simulados',
        contexto: 'Un lote de 20 claves de licencia contiene 5 que no activan. Un técnico toma 4 claves al azar (sin reemplazo) para instalar en 4 equipos. X = número de claves defectuosas en la muestra. ¿Cuál es la probabilidad de que exactamente 1 sea defectuosa?',
        valores: { N: 20, K: 5, n: 4, k: 1, variable: 'licencias defectuosas' },
        esperado: ['P(X = 1) = C(5,1)·C(15,3)/C(20,4) = 5·455/4845 = 0.469556', 'E[X] = 4·5/20 = 1'],
        interpretacion: 'Hay 46.96 % de probabilidad de que exactamente una de las 4 claves elegidas no active. En promedio se espera 1 clave defectuosa por cada 4 tomadas.'
      },
      calcular(v) {
        const { N, K, n, k } = v;
        const r = Est.hipergeometrica(N, K, n, k);
        const X = v.variable ? esc(v.variable) : 'éxitos';
        const filas = [[`P(X = ${k}) — exactamente k`, f6(r.exacto), pct(r.exacto)],
          [`P(X ≤ ${k}) — acumulada (adicional)`, f6(r.comoMaximo), pct(r.comoMaximo)],
          ['Media E[X] = nK/N', fmt(r.media), ''], ['Varianza', fmt(r.varianza), '']];
        const procedimiento = [
          `C(K, k) = C(${K}, ${k}) = ${r.numerador[0]}  (formas de elegir los ${k} éxitos)`,
          `C(N − K, n − k) = C(${N - K}, ${n - k}) = ${r.numerador[1]}  (formas de elegir los ${n - k} fracasos)`,
          `C(N, n) = C(${N}, ${n}) = ${r.denominador}  (muestras posibles)`,
          `P(X = ${k}) = ${r.numerador[0]} · ${r.numerador[1]} / ${r.denominador} = ${f6(r.exacto)}`,
          `E[X] = ${n} · ${K} / ${N} = ${fmt(r.media)}`
        ];
        const interpretacion = `<p>Al tomar ${n} elementos sin reemplazo de ${N}, la probabilidad de que exactamente <b>${k}</b> sean ${X} es <b>${pct(r.exacto)}</b>.</p>` +
          `<p>Se esperan en promedio ${fmt(r.media)} ${X} por muestra. Como no hay reemplazo, la varianza es menor que la de una binomial con p = K/N (factor (N − n)/(N − 1)).</p>`;
        const barras = [];
        for (let i = Math.max(0, n - (N - K)); i <= Math.min(n, K) && barras.length < 200; i++) barras.push({ x: i, p: Est.hipergeometricaPMF(N, K, n, i) });
        return { filas, procedimiento, interpretacion, grafica: { tipo: 'discreta', barras, k } };
      }
    },
    // =====================================================================
    {
      id: 'poisson', nombre: 'Poisson', grupo: 'Distribuciones discretas',
      teoria: {
        definicion: 'X = número de ocurrencias de un evento en un intervalo (de tiempo, espacio, etc.) cuando ocurren al azar con una tasa promedio constante λ.',
        parametros: ['Promedio de ocurrencias en un intervalo de referencia (ej.: 6 tickets por hora).',
          'Longitud del intervalo de referencia y del intervalo analizado (en la misma unidad).',
          '<b>λ ajustado = promedio × (intervalo analizado / intervalo de referencia)</b>.', 'k: número de ocurrencias de interés.'],
        supuestos: ['Las ocurrencias son independientes entre sí.', 'La tasa promedio es constante en todo el intervalo.', 'No ocurren dos eventos exactamente al mismo tiempo.'],
        media: 'E[X] = λ',
        varianza: 'σ² = λ',
        formula: 'P(X = k) = e^(−λ) λᵏ / k!'
      },
      campos: [
        { id: 'promedio', etiqueta: 'Promedio de ocurrencias', tipo: 'numero', ayuda: 'Número promedio de eventos en el intervalo de referencia (≥ 0).' },
        { id: 'refIntervalo', etiqueta: 'Intervalo de referencia', tipo: 'numero', ayuda: 'Longitud del intervalo en que se conoce el promedio. Ej.: 60 (minutos).' },
        { id: 'analizado', etiqueta: 'Intervalo analizado', tipo: 'numero', ayuda: 'Longitud del intervalo que se quiere estudiar, en la misma unidad. Ej.: 30 (minutos).' },
        { id: 'unidad', etiqueta: 'Unidad del intervalo (opcional)', tipo: 'texto', opcional: true, ayuda: 'Ej.: min, horas, km, MB.' },
        { id: 'k', etiqueta: 'k (número de ocurrencias)', tipo: 'numero', ayuda: 'Entero ≥ 0.' },
        { id: 'variable', etiqueta: '¿Qué se cuenta? (opcional)', tipo: 'texto', opcional: true, ayuda: 'Ej.: "tickets de soporte".' }
      ],
      ejemplo: {
        titulo: 'Tickets de soporte técnico',
        origen: 'Datos simulados (promedio supuesto a partir de un histórico típico de mesa de ayuda)',
        contexto: 'La mesa de ayuda recibe en promedio 6 tickets por hora. Se analiza un turno de 30 minutos. X = número de tickets en 30 min. Primero se ajusta λ: 6 × 30/60 = 3.',
        valores: { promedio: 6, refIntervalo: 60, analizado: 30, unidad: 'min', k: 2, variable: 'tickets de soporte' },
        esperado: ['λ = 3', 'P(X = 2) = 0.224042', 'P(X ≤ 2) = 0.423190', 'P(X ≥ 2) = 0.800852'],
        interpretacion: 'En media hora se esperan 3 tickets. Hay 22.40 % de probabilidad de recibir exactamente 2, 42.32 % de recibir 2 o menos y 80.09 % de recibir al menos 2, por lo que conviene tener a alguien disponible en cada turno de 30 min.'
      },
      calcular(v) {
        const r = Est.poisson(v.promedio, v.refIntervalo, v.analizado, v.k);
        const k = v.k, L = r.lambda, u = v.unidad ? ' ' + esc(v.unidad) : '';
        const X = v.variable ? esc(v.variable) : 'ocurrencias';
        const filas = [['λ ajustado al intervalo', fmt(L), `${fmt(v.analizado)}${u}`],
          [`P(X = ${k}) — exacta`, f6(r.exacto), pct(r.exacto)],
          [`P(X ≤ ${k}) — acumulada`, f6(r.comoMaximo), pct(r.comoMaximo)],
          [`P(X ≥ ${k}) — al menos k`, f6(r.alMenos), pct(r.alMenos)],
          [`P(X > ${k})`, f6(r.mayorQue), pct(r.mayorQue)],
          ['Media E[X] = λ', fmt(L), ''], ['Varianza = λ', fmt(L), '']];
        const procedimiento = [
          `λ = ${fmt(v.promedio)} × (${fmt(v.analizado)}${u} / ${fmt(v.refIntervalo)}${u}) = ${fmt(L)}`,
          `P(X = ${k}) = e^(−${fmt(L)}) · ${fmt(L)}^${k} / ${k}! = ${f6(r.exacto)}`,
          `P(X ≤ ${k}) = Σ e^(−λ) λⁱ / i!  para i = 0, …, ${k} = ${f6(r.comoMaximo)}`,
          k === 0 ? 'P(X ≥ 0) = 1' : `P(X ≥ ${k}) = 1 − P(X ≤ ${k - 1}) = ${f6(r.alMenos)}`
        ];
        const interpretacion = `<p>En un intervalo de ${fmt(v.analizado)}${u} se esperan en promedio <b>λ = ${fmt(L)}</b> ${X}. ` +
          `La probabilidad de exactamente ${k} es ${pct(r.exacto)}, de como máximo ${k} es ${pct(r.comoMaximo)} y de al menos ${k} es ${pct(r.alMenos)}.</p>` +
          `<p class="nota">Si se usara el promedio sin ajustar (${fmt(v.promedio)}) para un intervalo distinto, el resultado sería incorrecto: λ siempre debe corresponder al intervalo analizado.</p>`;
        const max = Math.max(k, Math.ceil(L + 4 * Math.sqrt(L) + 3));
        const min = L > 50 ? Math.max(0, Math.floor(L - 4 * Math.sqrt(L) - 3)) : 0;
        const barras = [];
        for (let i = Math.min(min, k); i <= max && barras.length < 300; i++) barras.push({ x: i, p: Est.poissonPMF(L, i) });
        return { filas, procedimiento, interpretacion, grafica: { tipo: 'discreta', barras, k } };
      }
    },
    // =====================================================================
    {
      id: 'uniforme', nombre: 'Uniforme continua', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X es una variable aleatoria continua que toma cualquier valor entre α y β con la misma densidad: intervalos de igual longitud tienen igual probabilidad.',
        parametros: ['α: valor mínimo.', 'β: valor máximo (α < β).'],
        supuestos: ['Todos los valores del intervalo [α, β] son igualmente probables.', 'Fuera de [α, β] la probabilidad es 0.'],
        media: 'E[X] = (α + β) / 2',
        varianza: 'σ² = (β − α)² / 12',
        formula: 'f(x) = 1/(β − α) en [α, β];  P(X ≤ x) = (x − α)/(β − α)'
      },
      campos: [
        { id: 'minimo', etiqueta: 'α (valor mínimo)', tipo: 'numero', ayuda: 'Extremo inferior del intervalo.' },
        { id: 'maximo', etiqueta: 'β (valor máximo)', tipo: 'numero', ayuda: 'Extremo superior; debe ser mayor que α.' },
        ...camposLimites, campoVariable('tiempo de descarga'), campoUnidad('s')
      ],
      ejemplo: {
        titulo: 'Tiempo de descarga de una actualización',
        origen: 'Datos simulados',
        contexto: 'Por la variación de la red, el tiempo de descarga de una actualización es igualmente probable entre 2 y 10 segundos. Calcule P(X ≤ 4), P(X ≥ 7) y P(4 ≤ X ≤ 7).',
        valores: { minimo: 2, maximo: 10, a: 4, b: 7, variable: 'tiempo de descarga', unidad: 's' },
        esperado: ['Media = 6 s; varianza = 5.333333 s²', 'P(X ≤ 4) = 0.25', 'P(X ≥ 7) = 0.375', 'P(4 ≤ X ≤ 7) = 0.375'],
        interpretacion: 'La descarga tarda en promedio 6 s. Hay 25 % de probabilidad de que termine en 4 s o menos, 37.5 % de que tarde 7 s o más y 37.5 % de que tarde entre 4 y 7 s.'
      },
      calcular(v) {
        const r = Est.uniforme(v.minimo, v.maximo, v.a, v.b);
        const { minimo: al, maximo: be, a, b } = v, w = be - al, u = v.unidad;
        const recorte = x => Math.min(Math.max(x, al), be);
        const filas = [['Media E[X]', conU(r.media, u), ''], ['Varianza σ²', fmt(r.varianza), u ? esc(u) + '²' : ''],
          ['Desviación estándar σ', conU(Math.sqrt(r.varianza), u), ''], ['Densidad f(x) = 1/(β − α)', fmt(r.densidad), ''],
          ...filasContinuas(r)];
        const procedimiento = [
          `E[X] = (${fmt(al)} + ${fmt(be)}) / 2 = ${fmt(r.media)};  σ² = (${fmt(be)} − ${fmt(al)})² / 12 = ${fmt(r.varianza)}`,
          `P(X ≤ ${fmt(a)}) = (${fmt(recorte(a))} − ${fmt(al)}) / ${fmt(w)} = ${f6(r.izquierda)}`,
          `P(X ≥ ${fmt(b)}) = (${fmt(be)} − ${fmt(recorte(b))}) / ${fmt(w)} = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = (${fmt(recorte(b))} − ${fmt(recorte(a))}) / ${fmt(w)} = ${f6(r.entre)}`,
          'Los valores fuera de [α, β] se recortan al intervalo porque allí la densidad es 0.'
        ];
        return { filas, procedimiento, interpretacion: interpretacionContinua(r, v, a, b),
          grafica: { tipo: 'continua', f: x => Est.densidades.uniforme(x, v), xmin: al - 0.15 * w, xmax: be + 0.15 * w, a, b, unidad: u } };
      }
    },
    // =====================================================================
    {
      id: 'normal', nombre: 'Normal', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X es una variable continua con forma de campana, simétrica alrededor de su media μ. Para calcular probabilidades se <b>estandariza</b>: Z = (X − μ)/σ sigue una normal estándar (media 0, desviación 1).',
        parametros: ['μ: media (centro de la campana).',
          '<b>σ: desviación estándar</b> (no la varianza): mide cuánto se alejan los valores de μ, en las mismas unidades que X. Si conoce la varianza σ², elija esa opción y la aplicación calcula σ = √σ².'],
        supuestos: ['La variable es continua y su distribución es simétrica y unimodal.', 'σ > 0.', 'Aproximadamente el 68 %, 95 % y 99.7 % de los valores están a 1, 2 y 3 σ de μ.'],
        media: 'E[X] = μ',
        varianza: 'Var(X) = σ²',
        formula: 'z = (x − μ) / σ;  P(X ≤ x) = Φ(z)'
      },
      campos: [
        { id: 'mu', etiqueta: 'μ (media)', tipo: 'numero', ayuda: 'Centro de la distribución.' },
        { id: 'sigma', etiqueta: 'Dispersión', tipo: 'numero', ayuda: 'Valor de σ (desviación estándar) o de σ² (varianza), según la opción de abajo. Debe ser > 0.' },
        { id: 'tipoSigma', etiqueta: 'El valor de dispersión ingresado es…', tipo: 'select', opciones: [['sigma', 'σ — desviación estándar'], ['varianza', 'σ² — varianza (se sacará raíz)']], ayuda: 'σ es la desviación estándar; σ² es la varianza. No los confunda: z siempre usa σ.' },
        ...camposLimites, campoVariable('tiempo de compilación'), campoUnidad('s')
      ],
      ejemplo: {
        titulo: 'Tiempo de compilación de un proyecto',
        origen: 'Datos simulados',
        contexto: 'El tiempo de compilación de un proyecto en el servidor de integración continua sigue una distribución normal con μ = 50 s y σ = 5 s. ¿Qué proporción de compilaciones tarda 45 s o menos, 58 s o más y entre 45 y 58 s?',
        valores: { mu: 50, sigma: 5, tipoSigma: 'sigma', a: 45, b: 58, variable: 'tiempo de compilación', unidad: 's' },
        esperado: ['z(45) = −1; z(58) = 1.6', 'P(X ≤ 45) = 0.158655', 'P(X ≥ 58) = 0.054799', 'P(45 ≤ X ≤ 58) = 0.786545'],
        interpretacion: '15.87 % de las compilaciones termina en 45 s o menos (1 σ bajo la media), solo 5.48 % tarda 58 s o más y 78.65 % queda entre 45 y 58 s. Si el límite aceptable fuera 58 s, aproximadamente 1 de cada 18 compilaciones lo superaría.'
      },
      calcular(v) {
        if (!(v.sigma > 0)) throw new Est.ErrorEntrada(`La dispersión (${v.tipoSigma === 'varianza' ? 'varianza σ²' : 'desviación estándar σ'}) debe ser mayor que 0.`);
        const sigma = v.tipoSigma === 'varianza' ? Math.sqrt(v.sigma) : v.sigma;
        const r = Est.normal(v.mu, sigma, v.a, v.b);
        const { mu, a, b } = v, u = v.unidad;
        const filas = [['Media E[X] = μ', conU(mu, u), ''], ['Desviación estándar σ', conU(sigma, u), v.tipoSigma === 'varianza' ? `σ = √${fmt(v.sigma)}` : ''],
          ['Varianza σ²', fmt(sigma * sigma), u ? esc(u) + '²' : ''], ['z(a)', fmt(r.za, 4), ''], ['z(b)', fmt(r.zb, 4), ''],
          ...filasContinuas(r)];
        const procedimiento = [
          v.tipoSigma === 'varianza' ? `Se ingresó la varianza: σ = √σ² = √${fmt(v.sigma)} = ${fmt(sigma)}` : `σ = ${fmt(sigma)} (desviación estándar)`,
          `Estandarización: z(a) = (${fmt(a)} − ${fmt(mu)}) / ${fmt(sigma)} = ${fmt(r.za)};  z(b) = (${fmt(b)} − ${fmt(mu)}) / ${fmt(sigma)} = ${fmt(r.zb)}`,
          `P(X ≤ ${fmt(a)}) = Φ(${fmt(r.za, 4)}) = ${f6(r.izquierda)}`,
          `P(X ≥ ${fmt(b)}) = 1 − Φ(${fmt(r.zb, 4)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = Φ(${fmt(r.zb, 4)}) − Φ(${fmt(r.za, 4)}) = ${f6(r.entre)}`
        ];
        const interp = interpretacionContinua(r, v, a, b) +
          `<p>El valor z indica a cuántas desviaciones estándar σ = ${conU(sigma, u)} está cada límite de la media: a está a ${fmt(Math.abs(r.za), 4)} σ ${r.za < 0 ? 'por debajo' : 'por encima'} y b a ${fmt(Math.abs(r.zb), 4)} σ ${r.zb < 0 ? 'por debajo' : 'por encima'}.</p>`;
        const lo = Math.min(mu - 4 * sigma, a - sigma), hi = Math.max(mu + 4 * sigma, b + sigma);
        return { filas, procedimiento, interpretacion: interp,
          grafica: { tipo: 'continua', f: x => Est.densidades.normal(x, { mu, sigma }), xmin: lo, xmax: hi, a, b, unidad: u } };
      }
    },
    // =====================================================================
    {
      id: 'gamma', nombre: 'Gamma', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X es una variable continua positiva, útil para modelar tiempos de espera hasta que ocurren α eventos de un proceso de Poisson, o tiempos de servicio con asimetría a la derecha.',
        parametros: ['α: parámetro de <b>forma</b> (> 0). Si es entero, representa el número de eventos que se esperan.',
          'θ: parámetro de <b>escala</b> (> 0): tiempo promedio entre eventos. Si su texto usa la tasa β, entonces θ = 1/β.'],
        supuestos: ['X ≥ 0.', 'Con α = 1 se obtiene la exponencial; con α = ν/2 y θ = 2, la ji cuadrada.'],
        media: 'E[X] = αθ',
        varianza: 'σ² = αθ²',
        formula: 'f(x) = x^(α−1) e^(−x/θ) / [Γ(α) θ^α];  P(X ≤ x) = P(α, x/θ) (gamma incompleta regularizada)'
      },
      campos: [
        { id: 'alfa', etiqueta: 'α (forma)', tipo: 'numero', ayuda: 'Mayor que 0. Ej.: número de solicitudes a atender.' },
        { id: 'theta', etiqueta: 'θ (escala)', tipo: 'numero', ayuda: 'Mayor que 0. Tiempo promedio por evento (θ = 1/tasa).' },
        ...camposLimites, campoVariable('tiempo para atender 3 solicitudes'), campoUnidad('min')
      ],
      ejemplo: {
        titulo: 'Tiempo para atender 3 solicitudes',
        origen: 'Datos simulados',
        contexto: 'Un servidor atiende solicitudes de un proceso de Poisson; cada una tarda en promedio θ = 2 min. X = tiempo total hasta completar α = 3 solicitudes. Calcule P(X ≤ 4), P(X ≥ 8) y P(4 ≤ X ≤ 8).',
        valores: { alfa: 3, theta: 2, a: 4, b: 8, variable: 'tiempo para atender 3 solicitudes', unidad: 'min' },
        esperado: ['Media = 6 min; varianza = 12 min²', 'P(X ≤ 4) = 0.323324', 'P(X ≥ 8) = 0.238103', 'P(4 ≤ X ≤ 8) = 0.438573'],
        interpretacion: 'En promedio se tarda 6 min en completar las 3 solicitudes. Hay 32.33 % de probabilidad de terminar en 4 min o menos, 23.81 % de tardar 8 min o más y 43.86 % de terminar entre 4 y 8 min.'
      },
      calcular(v) {
        const r = Est.gamma(v.alfa, v.theta, v.a, v.b);
        const { alfa, theta, a, b } = v, u = v.unidad;
        const filas = [['Media E[X] = αθ', conU(r.media, u), ''], ['Varianza αθ²', fmt(r.varianza), u ? esc(u) + '²' : ''],
          ['Desviación estándar', conU(Math.sqrt(r.varianza), u), ''], ...filasContinuas(r)];
        const procedimiento = [
          `E[X] = ${fmt(alfa)} · ${fmt(theta)} = ${fmt(r.media)};  σ² = ${fmt(alfa)} · ${fmt(theta)}² = ${fmt(r.varianza)}`,
          `P(X ≤ ${fmt(a)}) = P(α = ${fmt(alfa)}, x/θ = ${fmt(a / theta)}) = ${f6(r.izquierda)}`,
          `P(X ≥ ${fmt(b)}) = 1 − P(${fmt(alfa)}, ${fmt(b / theta)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = F(${fmt(b)}) − F(${fmt(a)}) = ${f6(r.Fb)} − ${f6(r.Fa)} = ${f6(r.entre)}`,
          Number.isInteger(alfa) && alfa <= 20
            ? `Como α es entero (Erlang): F(x) = 1 − e^(−x/θ) Σ (x/θ)ⁱ / i!, i = 0, …, ${alfa - 1}`
            : 'F(x) se calcula con la función gamma incompleta regularizada (serie / fracción continua).'
        ];
        const sd = Math.sqrt(r.varianza);
        return { filas, procedimiento, interpretacion: interpretacionContinua(r, v, a, b),
          grafica: { tipo: 'continua', f: x => Est.densidades.gamma(x, v), xmin: 0, xmax: Math.max(r.media + 5 * sd, b * 1.15), a, b, unidad: u } };
      }
    },
    // =====================================================================
    {
      id: 'exponencial', nombre: 'Exponencial', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X = tiempo (o distancia) hasta el siguiente evento en un proceso de Poisson. Es una variable continua sin memoria: lo que ya se esperó no cambia la probabilidad futura.',
        parametros: ['<b>λ: tasa</b> = número promedio de eventos por unidad de tiempo (ej.: 0.5 fallas por hora).',
          '<b>1/λ: tiempo promedio</b> entre eventos (ej.: 2 horas entre fallas). Son inversos: no los confunda. Puede ingresar cualquiera de los dos.'],
        supuestos: ['Los eventos ocurren según un proceso de Poisson (independientes, tasa constante).', 'X ≥ 0.', 'Propiedad de falta de memoria: P(X > s + t | X > s) = P(X > t).'],
        media: 'E[X] = 1/λ',
        varianza: 'σ² = 1/λ²',
        formula: 'f(x) = λe^(−λx);  P(X ≤ x) = 1 − e^(−λx)'
      },
      campos: [
        { id: 'parametro', etiqueta: 'Valor del parámetro', tipo: 'numero', ayuda: 'Mayor que 0. Indique abajo si es la tasa λ o el tiempo promedio 1/λ.' },
        { id: 'tipoParametro', etiqueta: 'El valor ingresado es…', tipo: 'select', opciones: [['lambda', 'λ — tasa (eventos por unidad de tiempo)'], ['media', '1/λ — tiempo promedio entre eventos']], ayuda: 'Ej.: "0.5 fallas por hora" es λ; "una falla cada 2 horas" es 1/λ = 2.' },
        ...camposLimites, campoVariable('tiempo hasta la próxima falla'), campoUnidad('h')
      ],
      ejemplo: {
        titulo: 'Tiempo entre fallas de un servidor',
        origen: 'Datos simulados',
        contexto: 'Un servidor presenta en promedio 0.5 fallas por hora (λ = 0.5), es decir, una falla cada 1/λ = 2 horas. X = tiempo hasta la próxima falla. Calcule P(X ≤ 1), P(X ≥ 3) y P(1 ≤ X ≤ 3).',
        valores: { parametro: 0.5, tipoParametro: 'lambda', a: 1, b: 3, variable: 'tiempo hasta la próxima falla', unidad: 'h' },
        esperado: ['Media 1/λ = 2 h; varianza = 4 h²', 'P(X ≤ 1) = 0.393469', 'P(X ≥ 3) = 0.223130', 'P(1 ≤ X ≤ 3) = 0.383400'],
        interpretacion: 'Hay 39.35 % de probabilidad de que el servidor falle en la próxima hora y 22.31 % de que funcione al menos 3 horas sin fallar. Por la falta de memoria, este resultado no depende de cuánto tiempo lleva funcionando.'
      },
      calcular(v) {
        if (!(v.parametro > 0)) throw new Est.ErrorEntrada(`El ${v.tipoParametro === 'media' ? 'tiempo promedio 1/λ' : 'valor de la tasa λ'} debe ser mayor que 0.`);
        const lambda = v.tipoParametro === 'media' ? 1 / v.parametro : v.parametro;
        const r = Est.exponencial(lambda, v.a, v.b);
        const { a, b } = v, u = v.unidad;
        const filas = [['Tasa λ', fmt(lambda) + (u ? ` eventos/${esc(u)}` : ''), ''], ['Tiempo promedio 1/λ = E[X]', conU(r.media, u), ''],
          ['Varianza 1/λ²', fmt(r.varianza), u ? esc(u) + '²' : ''], ...filasContinuas(r)];
        const procedimiento = [
          v.tipoParametro === 'media' ? `Se ingresó el tiempo promedio 1/λ = ${fmt(v.parametro)} → λ = 1/${fmt(v.parametro)} = ${fmt(lambda)}` : `Se ingresó la tasa λ = ${fmt(lambda)} → tiempo promedio 1/λ = ${fmt(r.media)}`,
          `P(X ≤ ${fmt(a)}) = 1 − e^(−${fmt(lambda)} · ${fmt(a)}) = ${f6(r.izquierda)}`,
          `P(X ≥ ${fmt(b)}) = e^(−${fmt(lambda)} · ${fmt(b)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = e^(−${fmt(lambda * a)}) − e^(−${fmt(lambda * b)}) = ${f6(r.entre)}`
        ];
        return { filas, procedimiento, interpretacion: interpretacionContinua(r, v, a, b),
          grafica: { tipo: 'continua', f: x => Est.densidades.exponencial(x, { lambda }), xmin: 0, xmax: Math.max(5 / lambda, b * 1.15), a, b, unidad: u } };
      }
    },
    // =====================================================================
    {
      id: 'jicuadrada', nombre: 'Ji cuadrada', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X = Z₁² + Z₂² + … + Z_ν², la suma de los cuadrados de ν variables normales estándar independientes. Se usa en pruebas de bondad de ajuste, independencia y para la varianza muestral: (n − 1)s²/σ² ~ χ²(n − 1).',
        parametros: ['ν: grados de libertad (entero ≥ 1). Es el único parámetro.'],
        supuestos: ['X ≥ 0 y es asimétrica a la derecha; se vuelve más simétrica cuando ν crece.', 'Es un caso de la gamma con α = ν/2 y θ = 2.'],
        media: 'E[X] = ν',
        varianza: 'σ² = 2ν',
        formula: 'P(X ≤ x) = P(ν/2, x/2) (gamma incompleta regularizada)'
      },
      campos: [
        { id: 'nu', etiqueta: 'ν (grados de libertad)', tipo: 'numero', ayuda: 'Entero ≥ 1. En bondad de ajuste: número de categorías − 1 − parámetros estimados.' },
        ...camposLimites, campoVariable('estadístico de prueba'), campoUnidad('sin unidad')
      ],
      ejemplo: {
        titulo: 'Prueba de un generador de números aleatorios',
        origen: 'Valores de la tabla ji cuadrada (Walpole, Tabla A.5)',
        contexto: 'Para validar un generador de números aleatorios se agrupan 1 000 números en 11 categorías y se calcula un estadístico χ² con ν = 10. La tabla da χ²₀.₉₅ = 3.940 y χ²₀.₀₅ = 18.307. Compruebe las áreas de las colas.',
        valores: { nu: 10, a: 3.940, b: 18.307, variable: 'estadístico de prueba χ²', unidad: '' },
        esperado: ['Media = 10; varianza = 20', 'P(X ≤ 3.940) ≈ 0.05', 'P(X ≥ 18.307) ≈ 0.05', 'P(3.940 ≤ X ≤ 18.307) ≈ 0.90 (tolerancia 0.0001)'],
        interpretacion: 'Si el generador es correcto, el estadístico cae entre 3.940 y 18.307 el 90 % de las veces. Un valor mayor que 18.307 (5 % de probabilidad) sería evidencia de que los números no son uniformes con α = 0.05.'
      },
      calcular(v) {
        const r = Est.jiCuadrada(v.nu, v.a, v.b);
        const { nu, a, b } = v;
        const filas = [['Media E[X] = ν', fmt(r.media), ''], ['Varianza 2ν', fmt(r.varianza), ''],
          ['Desviación estándar', fmt(Math.sqrt(r.varianza)), ''], ...filasContinuas(r)];
        const procedimiento = [
          `E[X] = ν = ${nu};  σ² = 2ν = ${2 * nu}`,
          `Equivale a una gamma con α = ν/2 = ${fmt(nu / 2)} y θ = 2.`,
          `P(X ≤ ${fmt(a)}) = P(${fmt(nu / 2)}, ${fmt(a / 2)}) = ${f6(r.izquierda)}`,
          `P(X ≥ ${fmt(b)}) = 1 − P(${fmt(nu / 2)}, ${fmt(b / 2)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = ${f6(r.Fb)} − ${f6(r.Fa)} = ${f6(r.entre)}`
        ];
        const sd = Math.sqrt(2 * nu);
        return { filas, procedimiento, interpretacion: interpretacionContinua(r, v, a, b),
          grafica: { tipo: 'continua', f: x => Est.densidades.jiCuadrada(x, { nu }), xmin: 0, xmax: Math.max(nu + 5 * sd, b * 1.15), a, b, unidad: v.unidad } };
      }
    },
    // =====================================================================
    {
      id: 'lognormal', nombre: 'Lognormal', grupo: 'Distribuciones continuas',
      teoria: {
        definicion: 'X es lognormal si su logaritmo natural ln X sigue una distribución normal. Modela variables positivas y asimétricas a la derecha: tamaños de archivos, tiempos de reparación, ingresos.',
        parametros: ['μ: media de <b>ln X</b> (no de X).', 'σ: desviación estándar de <b>ln X</b> (> 0).'],
        supuestos: ['X > 0.', 'ln X ~ Normal(μ, σ). Para calcular probabilidades se estandariza el logaritmo: z = (ln x − μ)/σ.'],
        media: 'E[X] = e^(μ + σ²/2)',
        varianza: 'σ²_X = (e^(σ²) − 1) · e^(2μ + σ²)',
        formula: 'P(X ≤ x) = Φ((ln x − μ) / σ)'
      },
      campos: [
        { id: 'mu', etiqueta: 'μ (media de ln X)', tipo: 'numero', ayuda: 'Media del logaritmo natural de X.' },
        { id: 'sigma', etiqueta: 'σ (desviación estándar de ln X)', tipo: 'numero', ayuda: 'Mayor que 0.' },
        { id: 'a', etiqueta: 'a (límite inferior)', tipo: 'numero', ayuda: 'Se calcula P(X ≤ a). Debe ser > 0 porque no existe ln de 0 ni de negativos.' },
        camposLimites[1], campoVariable('tamaño de archivo subido'), campoUnidad('MB')
      ],
      ejemplo: {
        titulo: 'Tamaño de archivos subidos a una plataforma',
        origen: 'Datos simulados',
        contexto: 'El tamaño de los archivos que suben los usuarios (en MB) es lognormal con ln X ~ N(μ = 1, σ = 0.5). ¿Qué proporción pesa 2 MB o menos, 5 MB o más y entre 2 y 5 MB?',
        valores: { mu: 1, sigma: 0.5, a: 2, b: 5, variable: 'tamaño de archivo subido', unidad: 'MB' },
        esperado: ['E[X] = e^1.125 = 3.080217 MB; varianza = 2.694758 MB²', 'z(a) = (ln 2 − 1)/0.5 = −0.613706; z(b) = (ln 5 − 1)/0.5 = 1.218876',
          'P(X ≤ 2) = 0.269705', 'P(X ≥ 5) = 0.111446', 'P(2 ≤ X ≤ 5) = 0.618849'],
        interpretacion: 'El tamaño medio es 3.08 MB. 26.97 % de los archivos pesa 2 MB o menos y 11.14 % pesa 5 MB o más; si el límite de subida fuera 5 MB, cerca de 1 de cada 9 archivos sería rechazado.'
      },
      calcular(v) {
        const r = Est.lognormal(v.mu, v.sigma, v.a, v.b);
        const { mu, sigma, a, b } = v, u = v.unidad;
        const filas = [['Media E[X]', conU(r.media, u), ''], ['Varianza de X', fmt(r.varianza), u ? esc(u) + '²' : ''],
          ['Mediana e^μ', conU(Math.exp(mu), u), ''], ['ln a / z(a)', `${fmt(r.lnA)} / ${fmt(r.za, 4)}`, ''],
          ['ln b / z(b)', `${fmt(r.lnB)} / ${fmt(r.zb, 4)}`, ''], ...filasContinuas(r)];
        const procedimiento = [
          `E[X] = e^(${fmt(mu)} + ${fmt(sigma)}²/2) = e^${fmt(mu + sigma * sigma / 2)} = ${fmt(r.media)}`,
          `Var(X) = (e^${fmt(sigma * sigma)} − 1) · e^${fmt(2 * mu + sigma * sigma)} = ${fmt(r.varianza)}`,
          `Estandarizar el logaritmo: z(a) = (ln ${fmt(a)} − ${fmt(mu)}) / ${fmt(sigma)} = (${fmt(r.lnA)} − ${fmt(mu)}) / ${fmt(sigma)} = ${fmt(r.za)}`,
          `z(b) = (ln ${fmt(b)} − ${fmt(mu)}) / ${fmt(sigma)} = (${fmt(r.lnB)} − ${fmt(mu)}) / ${fmt(sigma)} = ${fmt(r.zb)}`,
          `P(X ≤ ${fmt(a)}) = Φ(${fmt(r.za, 4)}) = ${f6(r.izquierda)};  P(X ≥ ${fmt(b)}) = 1 − Φ(${fmt(r.zb, 4)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ X ≤ ${fmt(b)}) = ${f6(r.Fb)} − ${f6(r.Fa)} = ${f6(r.entre)}`
        ];
        const interp = interpretacionContinua(r, v, a, b) +
          `<p class="nota">μ = ${fmt(mu)} y σ = ${fmt(sigma)} son parámetros de ln X; la media de X es ${fmt(r.media)}, no μ.</p>`;
        return { filas, procedimiento, interpretacion: interp,
          grafica: { tipo: 'continua', f: x => Est.densidades.lognormal(x, v), xmin: 0, xmax: Math.max(Math.exp(mu + 3 * sigma), b * 1.15), a, b, unidad: u } };
      }
    },
    // =====================================================================
    {
      id: 'tlc', nombre: 'Teorema del límite central', grupo: 'Distribuciones muestrales',
      teoria: {
        definicion: 'Si se toman muestras aleatorias de tamaño n de una población con media μ y desviación σ, la media muestral X̄ y la suma ΣX tienen distribución aproximadamente normal cuando n es grande, sin importar la forma de la población.',
        parametros: ['μ: media de la población.', 'σ: desviación estándar de la población.', 'n: tamaño de la muestra.',
          'Error estándar: σ/√n (desviación de X̄).'],
        supuestos: ['Las observaciones son independientes (muestra aleatoria).', 'n ≥ 30 como regla práctica; si la población ya es normal, vale para cualquier n.',
          'σ es conocida (o se usa una buena estimación).', 'Si se muestrea sin reemplazo, n debe ser menor que el 5 % de la población.'],
        media: 'E[X̄] = μ  ·  E[ΣX] = nμ',
        varianza: 'Var(X̄) = σ²/n (error estándar σ/√n)  ·  Var(ΣX) = nσ²',
        formula: 'z = (x̄ − μ)/(σ/√n)  ·  z = (Σx − nμ)/(σ√n)'
      },
      campos: [
        { id: 'mu', etiqueta: 'μ (media de la población)', tipo: 'numero', ayuda: 'Media de una observación individual.' },
        { id: 'sigma', etiqueta: 'σ (desviación de la población)', tipo: 'numero', ayuda: 'Desviación estándar de una observación individual (> 0).' },
        { id: 'n', etiqueta: 'n (tamaño de la muestra)', tipo: 'numero', ayuda: 'Entero ≥ 1. Se recomienda n ≥ 30.' },
        { id: 'tipo', etiqueta: 'Analizar…', tipo: 'select', opciones: [['media', 'La media muestral X̄'], ['suma', 'La suma total ΣX']], ayuda: 'Los límites a y b se interpretan en la escala elegida.' },
        ...camposLimites, campoVariable('tiempo de respuesta'), campoUnidad('ms')
      ],
      ejemplo: {
        titulo: 'Tiempo medio de respuesta de 64 peticiones',
        origen: 'Datos simulados',
        contexto: 'Cada petición a un servicio tarda en promedio μ = 200 ms con σ = 40 ms (distribución desconocida, asimétrica). Se monitorean n = 64 peticiones. ¿Cuál es la probabilidad de que la media muestral quede entre 190 y 210 ms? (Cambie "Analizar" a suma con a = 12 500 y b = 13 000 para el tiempo total.)',
        valores: { mu: 200, sigma: 40, n: 64, tipo: 'media', a: 190, b: 210, variable: 'tiempo de respuesta', unidad: 'ms' },
        esperado: ['Error estándar = 40/√64 = 5 ms', 'z = ±2', 'P(X̄ ≤ 190) = 0.022750; P(X̄ ≥ 210) = 0.022750', 'P(190 ≤ X̄ ≤ 210) = 0.954500',
          'Suma: nμ = 12 800, σ√n = 320; P(ΣX ≤ 12 500) = 0.174251; P(ΣX ≥ 13 000) = 0.265986'],
        interpretacion: 'Aunque una petición individual varía mucho (σ = 40 ms), el promedio de 64 peticiones varía solo 5 ms. Por eso hay 95.45 % de probabilidad de que el promedio observado quede entre 190 y 210 ms; un promedio fuera de ese rango sería señal de un cambio en el servicio.'
      },
      calcular(v) {
        const r = Est.limiteCentral(v.mu, v.sigma, v.n, v.tipo, v.a, v.b);
        const { mu, sigma, n, a, b } = v, u = v.unidad, esMedia = v.tipo === 'media';
        const S = esMedia ? 'X̄' : 'ΣX';
        const filas = [['Media de X̄ = μ', conU(mu, u), ''], ['Error estándar σ/√n', conU(r.errorEstandar, u), ''],
          ['Media de la suma nμ', conU(r.mediaSuma, u), ''], ['Desviación de la suma σ√n', conU(r.desviacionSuma, u), ''],
          ['z(a)', fmt(r.za, 4), ''], ['z(b)', fmt(r.zb, 4), ''],
          [`P(${S} ≤ a) — izquierda`, f6(r.izquierda), pct(r.izquierda)],
          [`P(${S} ≥ b) — derecha`, f6(r.derecha), pct(r.derecha)],
          [`P(a ≤ ${S} ≤ b) — entre`, f6(r.entre), pct(r.entre)]];
        const procedimiento = [
          esMedia ? `Error estándar: σ/√n = ${fmt(sigma)} / √${n} = ${fmt(r.errorEstandar)}` : `Suma: E[ΣX] = nμ = ${n} · ${fmt(mu)} = ${fmt(r.mediaSuma)};  σ√n = ${fmt(sigma)} · √${n} = ${fmt(r.desviacionSuma)}`,
          `Estandarización: z(a) = (${fmt(a)} − ${fmt(r.centro)}) / ${fmt(r.dispersion)} = ${fmt(r.za)};  z(b) = (${fmt(b)} − ${fmt(r.centro)}) / ${fmt(r.dispersion)} = ${fmt(r.zb)}`,
          `P(${S} ≤ ${fmt(a)}) ≈ Φ(${fmt(r.za, 4)}) = ${f6(r.izquierda)}`,
          `P(${S} ≥ ${fmt(b)}) ≈ 1 − Φ(${fmt(r.zb, 4)}) = ${f6(r.derecha)}`,
          `P(${fmt(a)} ≤ ${S} ≤ ${fmt(b)}) ≈ ${f6(r.Fb)} − ${f6(r.Fa)} = ${f6(r.entre)}`
        ];
        const aviso = n < 30 ? `<p class="aviso">Atención: n = ${n} es menor que 30. La aproximación normal solo es confiable si la población es aproximadamente normal.</p>` : '';
        const interp = `<p>Para ${esMedia ? 'la <b>media</b>' : 'la <b>suma</b>'} de ${n} observaciones de ${varX(v)}: la probabilidad de que sea a lo sumo ${conU(a, u)} es ${pct(r.izquierda)}, ` +
          `de que sea al menos ${conU(b, u)} es ${pct(r.derecha)} y de que quede entre ambos es <b>${pct(r.entre)}</b>.</p>` +
          `<p>El error estándar ${conU(r.errorEstandar, u)} es mucho menor que σ = ${conU(sigma, u)}: los promedios varían menos que los datos individuales. Los resultados son <b>aproximados</b> (TLC).</p>` + aviso;
        return { filas, procedimiento, interpretacion: interp,
          grafica: { tipo: 'continua', f: x => Est.densidades.normal(x, { mu: r.centro, sigma: r.dispersion }),
            xmin: Math.min(r.centro - 4 * r.dispersion, a - r.dispersion), xmax: Math.max(r.centro + 4 * r.dispersion, b + r.dispersion), a, b, unidad: u } };
      }
    }
  ];

  global.Modulos = { MODULOS, fmt, f6, pct, esc };
})(window);
