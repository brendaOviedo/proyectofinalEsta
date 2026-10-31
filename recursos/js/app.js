/*
 * app.js — Interfaz: menú, formularios, botones (Calcular, Limpiar, Cargar ejemplo,
 * Importar archivo), resultados, gráficas y la página de Comprobación.
 */
(function () {
  'use strict';
  const { MODULOS, fmt, esc } = window.Modulos;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // ===================== Navegación =====================
  function construirMenu() {
    const nav = $('#menu');
    let grupoActual = null, html = '<a href="#inicio" data-id="inicio">Inicio</a>';
    MODULOS.forEach(m => {
      if (m.grupo !== grupoActual) { html += `<div class="menu-grupo">${esc(m.grupo)}</div>`; grupoActual = m.grupo; }
      html += `<a href="#${m.id}" data-id="${m.id}">${esc(m.nombre)}</a>`;
    });
    html += '<div class="menu-grupo">Evaluación</div><a href="#comprobacion" data-id="comprobacion">Comprobación (pruebas)</a>';
    nav.innerHTML = html;
  }

  function mostrar(id) {
    const valido = id === 'inicio' || id === 'comprobacion' || MODULOS.some(m => m.id === id);
    if (!valido) id = 'inicio';
    $$('.pagina').forEach(p => p.hidden = p.id !== 'pag-' + id);
    $$('#menu a').forEach(a => a.classList.toggle('activo', a.dataset.id === id));
    if (id === 'comprobacion') ejecutarPruebas();
    document.body.classList.remove('menu-abierto');
    window.scrollTo(0, 0);
  }

  // ===================== Construcción de cada módulo =====================
  function campoHTML(m, c) {
    const id = `${m.id}-${c.id}`;
    const opc = c.opcional ? ' <span class="opcional">(opcional)</span>' : '';
    const etiqueta = c.etiqueta.replace(' (opcional)', '');
    let control;
    if (c.tipo === 'area') control = `<textarea id="${id}" rows="5" spellcheck="false"></textarea>`;
    else if (c.tipo === 'select') control = `<select id="${id}">${c.opciones.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}</select>`;
    else control = `<input id="${id}" type="text" inputmode="${c.tipo === 'numero' ? 'decimal' : 'text'}" autocomplete="off">`;
    return `<div class="campo"><label for="${id}">${esc(etiqueta)}${opc}</label>${control}<small>${c.ayuda}</small></div>`;
  }

  function teoriaHTML(t) {
    return `<details class="teoria" open><summary>Teoría: definición, parámetros y supuestos</summary>
      <p>${t.definicion}</p>
      <div class="dos-col">
        <div><h4>Parámetros</h4><ul>${t.parametros.map(p => `<li>${p}</li>`).join('')}</ul></div>
        <div><h4>Supuestos</h4><ul>${t.supuestos.map(p => `<li>${p}</li>`).join('')}</ul></div>
      </div>
      <div class="formulas">
        ${t.formula ? `<div><span>Fórmula</span><code>${t.formula}</code></div>` : ''}
        <div><span>${t.etiquetas ? t.etiquetas[0] : 'Media (esperanza)'}</span><code>${t.media}</code></div>
        <div><span>${t.etiquetas ? t.etiquetas[1] : 'Varianza'}</span><code>${t.varianza}</code></div>
      </div>
    </details>`;
  }

  function construirModulo(m) {
    const sec = document.createElement('section');
    sec.className = 'pagina'; sec.id = 'pag-' + m.id; sec.hidden = true;

    // Agrupar campos por "grupo" (fieldset) cuando existe
    let camposHTML = '', grupo = null;
    m.campos.forEach(c => {
      if (c.grupo !== grupo) {
        if (grupo) camposHTML += '</div></fieldset>';
        if (c.grupo) camposHTML += `<fieldset><legend>${esc(c.grupo)}</legend><div class="rejilla">`;
        grupo = c.grupo;
      }
      camposHTML += campoHTML(m, c);
    });
    if (grupo) camposHTML += '</div></fieldset>';
    const envolver = m.campos.some(c => c.grupo) ? camposHTML : `<div class="rejilla">${camposHTML}</div>`;

    sec.innerHTML = `
      <h2>${esc(m.nombre)}</h2>
      ${teoriaHTML(m.teoria)}
      <div class="tarjeta">
        <h3>Datos de entrada</h3>
        <form novalidate>
          ${envolver}
          <div class="botones">
            <button type="submit" class="primario">Calcular</button>
            <button type="button" data-accion="limpiar">Limpiar</button>
            <button type="button" data-accion="ejemplo">Cargar ejemplo</button>
            <label class="boton-archivo">Importar archivo…<input type="file" accept=".txt,.csv" data-accion="importar"></label>
          </div>
          <p class="ayuda-importar">${m.campos.some(c => c.importar)
            ? 'Importar: archivo .txt o .csv con los datos numéricos (uno por línea o separados por comas).'
            : `Importar: archivo .txt con una línea por campo en formato <code>clave=valor</code>. Claves: ${m.campos.map(c => `<code>${c.id}</code>`).join(', ')}.`}</p>
        </form>
      </div>
      <div class="mensaje" role="alert" hidden></div>
      <div class="tarjeta ejemplo" hidden></div>
      <div class="tarjeta resultado" hidden></div>`;
    $('#contenido').appendChild(sec);

    const form = $('form', sec);
    form.addEventListener('submit', e => { e.preventDefault(); calcular(m, sec); });
    $('[data-accion="limpiar"]', sec).addEventListener('click', () => limpiar(m, sec));
    $('[data-accion="ejemplo"]', sec).addEventListener('click', () => cargarEjemplo(m, sec));
    $('[data-accion="importar"]', sec).addEventListener('change', e => importar(m, sec, e.target));
  }

  // ===================== Lectura y validación de campos =====================
  function leerCampos(m, sec) {
    const v = {};
    $$('.campo', sec).forEach(div => div.classList.remove('invalido'));
    for (const c of m.campos) {
      const el = $(`#${m.id}-${c.id}`, sec);
      const texto = el.value.trim();
      if (c.tipo === 'numero') {
        if (texto === '') {
          if (c.opcional) { v[c.id] = ''; continue; }
          marcar(el); throw new Est.ErrorEntrada(`El campo "${c.etiqueta}" está vacío.`);
        }
        if (/^[-+]?\d+,\d+$/.test(texto)) { marcar(el); throw new Est.ErrorEntrada(`En "${c.etiqueta}" use punto decimal (ej.: 0.5), no coma.`); }
        if (!/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(texto)) { marcar(el); throw new Est.ErrorEntrada(`"${c.etiqueta}" debe ser un número; se recibió "${texto}".`); }
        v[c.id] = Number(texto);
      } else {
        if (texto === '' && !c.opcional) { marcar(el); throw new Est.ErrorEntrada(`El campo "${c.etiqueta}" está vacío.`); }
        v[c.id] = texto;
      }
    }
    return v;
  }
  function marcar(el) { el.closest('.campo').classList.add('invalido'); el.focus(); }

  function mostrarMensaje(sec, texto, tipo = 'error') {
    const box = $('.mensaje', sec);
    box.className = 'mensaje ' + tipo;
    box.textContent = (tipo === 'error' ? '⚠ ' : '✓ ') + texto;
    box.hidden = false;
  }
  function ocultarMensaje(sec) { $('.mensaje', sec).hidden = true; }

  // ===================== Acciones =====================
  function calcular(m, sec) {
    ocultarMensaje(sec);
    const out = $('.resultado', sec);
    try {
      const v = leerCampos(m, sec);
      const r = m.calcular(v);
      out.innerHTML = `<h3>Resultado</h3>
        <table class="tabla-resultado"><thead><tr><th>Medida</th><th>Valor</th><th></th></tr></thead><tbody>
        ${r.filas.map(([n, val, nota, resaltar]) => `<tr${resaltar ? ' class="resaltada"' : ''}><td>${n}</td><td class="num">${val}</td><td class="nota">${nota || ''}</td></tr>`).join('')}
        </tbody></table>
        ${r.grafica ? '<canvas class="grafica" width="760" height="280" aria-label="Gráfica del resultado"></canvas><div class="leyenda"></div>' : ''}
        <h4>Procedimiento</h4><ol class="procedimiento">${r.procedimiento.map(p => `<li>${p}</li>`).join('')}</ol>
        <h4>Interpretación</h4><div class="interpretacion">${r.interpretacion}</div>`;
      out.hidden = false;
      if (r.grafica) dibujar($('canvas', out), $('.leyenda', out), r.grafica);
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      out.hidden = true;
      if (e instanceof Est.ErrorEntrada) {
        mostrarMensaje(sec, e.message);
        // Marcar el campo mencionado en el mensaje, si se puede identificar
        const c = m.campos.find(c => e.message.includes(c.etiqueta.replace(' (opcional)', '')));
        if (c && !$('.campo.invalido', sec)) $(`#${m.id}-${c.id}`, sec).closest('.campo').classList.add('invalido');
      }
      else { mostrarMensaje(sec, 'Ocurrió un error inesperado al calcular. Revise los datos e intente de nuevo. (' + e.message + ')'); console.error(e); }
    }
  }

  function limpiar(m, sec) {
    m.campos.forEach(c => {
      const el = $(`#${m.id}-${c.id}`, sec);
      if (c.tipo === 'select') el.selectedIndex = 0; else el.value = '';
    });
    $$('.campo', sec).forEach(d => d.classList.remove('invalido'));
    $('.resultado', sec).hidden = true;
    $('.ejemplo', sec).hidden = true;
    ocultarMensaje(sec);
  }

  function rellenar(m, sec, valores) {
    m.campos.forEach(c => {
      if (valores[c.id] === undefined) return;
      const el = $(`#${m.id}-${c.id}`, sec);
      el.value = String(valores[c.id]);
    });
  }

  function cargarEjemplo(m, sec) {
    limpiar(m, sec);
    const ej = m.ejemplo;
    rellenar(m, sec, ej.valores);
    const entradas = m.campos.filter(c => ej.valores[c.id] !== undefined && ej.valores[c.id] !== '')
      .map(c => {
        let val = ej.valores[c.id];
        if (c.tipo === 'select') val = c.opciones.find(o => o[0] === val)[1];
        return `<li><b>${esc(c.etiqueta.replace(' (opcional)', '').replace(/…$/, ''))}:</b> ${esc(val)}</li>`;
      }).join('');
    const box = $('.ejemplo', sec);
    box.innerHTML = `<h3>Ejemplo resuelto: ${esc(ej.titulo)}</h3>
      <p class="origen">${esc(ej.origen)}</p>
      <p>${esc(ej.contexto)}</p>
      <div class="dos-col">
        <div><h4>Entradas</h4><ul>${entradas}</ul></div>
        <div><h4>Resultado esperado</h4><ul>${ej.esperado.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </div>
      <h4>Interpretación</h4><p>${esc(ej.interpretacion)}</p>
      <p class="nota">Los datos ya están en el formulario. Presione <b>Calcular</b> para comprobar el resultado; luego puede cambiar cualquier dato.</p>`;
    box.hidden = false;
    mostrarMensaje(sec, 'Ejemplo cargado. Presione "Calcular".', 'ok');
  }

  function importar(m, sec, input) {
    const archivo = input.files[0];
    if (!archivo) return;
    ocultarMensaje(sec);
    if (!/\.(txt|csv)$/i.test(archivo.name)) {
      mostrarMensaje(sec, `El archivo "${archivo.name}" no es .txt ni .csv. Use un archivo de texto.`);
      input.value = ''; return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      mostrarMensaje(sec, 'El archivo es demasiado grande (máximo 2 MB).');
      input.value = ''; return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const texto = String(lector.result).replace(/^﻿/, '');
        const campoDatos = m.campos.find(c => c.importar);
        if (campoDatos) {
          // Se ignoran líneas de encabezado que no tengan números (ej. "tiempo_ms")
          const lineas = texto.split(/\r?\n/).filter(l => l.trim() !== '' && !(/^[^\d\-+.]*$/.test(l.trim())));
          const datos = lineas.join('\n');
          Est.leerDatos(datos); // valida antes de rellenar
          $(`#${m.id}-${campoDatos.id}`, sec).value = datos.split(/[\s,;]+/).filter(Boolean).join(', ');
          mostrarMensaje(sec, `Se importaron ${Est.leerDatos(datos).length} datos de "${archivo.name}". Presione "Calcular".`, 'ok');
        } else {
          const valores = {}, ids = m.campos.map(c => c.id);
          texto.split(/\r?\n/).forEach((l, i) => {
            if (l.trim() === '' || l.trim().startsWith('#')) return;
            const pos = l.indexOf('=');
            if (pos < 0) throw new Est.ErrorEntrada(`Línea ${i + 1} del archivo: falta "=". Use el formato clave=valor.`);
            const clave = l.slice(0, pos).trim(), valor = l.slice(pos + 1).trim();
            if (!ids.includes(clave)) throw new Est.ErrorEntrada(`Línea ${i + 1} del archivo: la clave "${clave}" no existe en este módulo. Claves válidas: ${ids.join(', ')}.`);
            valores[clave] = valor;
          });
          if (Object.keys(valores).length === 0) throw new Est.ErrorEntrada('El archivo no contiene ningún valor.');
          limpiar(m, sec);
          rellenar(m, sec, valores);
          mostrarMensaje(sec, `Se importaron ${Object.keys(valores).length} valores de "${archivo.name}". Presione "Calcular".`, 'ok');
        }
      } catch (e) {
        mostrarMensaje(sec, e instanceof Est.ErrorEntrada ? 'Archivo no válido: ' + e.message : 'No se pudo leer el archivo.');
      }
      input.value = '';
    };
    lector.onerror = () => { mostrarMensaje(sec, 'No se pudo leer el archivo.'); input.value = ''; };
    lector.readAsText(archivo, 'utf-8');
  }

  // ===================== Gráficas (canvas, sin bibliotecas) =====================
  const COLORES = { izq: '#d9822b', entre: '#2b7bb9', der: '#8e44ad', base: '#b8c4d0', linea: '#1f3a56', k: '#2b7bb9', eje: '#55606b' };

  function dibujar(canvas, leyenda, g) {
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth || 760, H = 280;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    ctx.font = '12px system-ui, sans-serif';
    const M = { l: 52, r: 16, t: 14, b: 34 };
    const pw = W - M.l - M.r, ph = H - M.t - M.b;

    let items = [];
    if (g.tipo === 'continua') {
      const N = 400, xs = [], ys = [];
      for (let i = 0; i <= N; i++) { const x = g.xmin + (g.xmax - g.xmin) * i / N; xs.push(x); ys.push(g.f(x)); }
      const finitos = ys.filter(y => Number.isFinite(y)).sort((p, q) => p - q);
      const ymax = (finitos[Math.floor(finitos.length * 0.995)] || 1) * 1.1 || 1;
      const X = x => M.l + (x - g.xmin) / (g.xmax - g.xmin) * pw;
      const Y = y => M.t + ph - Math.min(y, ymax) / ymax * ph;
      const region = (desde, hasta, color) => {
        const d = Math.max(desde, g.xmin), h = Math.min(hasta, g.xmax);
        if (h <= d) return;
        ctx.beginPath(); ctx.moveTo(X(d), Y(0));
        for (let i = 0; i <= 200; i++) { const x = d + (h - d) * i / 200; const y = g.f(x); ctx.lineTo(X(x), Y(Number.isFinite(y) ? y : ymax)); }
        ctx.lineTo(X(h), Y(0)); ctx.closePath(); ctx.fillStyle = color; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
      };
      region(-Infinity, g.a, COLORES.izq);
      region(g.a, g.b, COLORES.entre);
      region(g.b, Infinity, COLORES.der);
      ctx.beginPath();
      xs.forEach((x, i) => { const y = Number.isFinite(ys[i]) ? ys[i] : ymax; i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); });
      ctx.strokeStyle = COLORES.linea; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      ejes(ctx, M, pw, ph, g.xmin, g.xmax, X, ymax, 'f(x)');
      [[g.a, 'a'], [g.b, 'b']].forEach(([x, t]) => {
        if (x < g.xmin || x > g.xmax) return;
        ctx.strokeStyle = COLORES.eje; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(X(x), M.t); ctx.lineTo(X(x), M.t + ph); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = COLORES.eje; ctx.fillText(t + ' = ' + fmt(x, 4), X(x) + 4, M.t + 12);
      });
      items = [[COLORES.izq, 'P(X ≤ a) izquierda'], [COLORES.entre, 'P(a ≤ X ≤ b) entre'], [COLORES.der, 'P(X ≥ b) derecha']];
    } else {
      let barras, etiquetaY = 'P(X = x)';
      if (g.tipo === 'datos') {
        const frec = new Map();
        g.datos.forEach(x => frec.set(x, (frec.get(x) || 0) + 1));
        if (frec.size <= 30) barras = [...frec].map(([x, f]) => ({ x, p: f, resaltar: g.moda.includes(x) }));
        else { // histograma con regla de Sturges
          const k = Math.ceil(1 + Math.log2(g.datos.length)), min = g.datos[0], max = g.datos[g.datos.length - 1], w = (max - min) / k || 1;
          barras = Array.from({ length: k }, (_, i) => ({ x: min + w * (i + 0.5), p: 0, etiqueta: `${fmt(min + w * i, 2)}` }));
          g.datos.forEach(x => barras[Math.min(k - 1, Math.floor((x - min) / w))].p++);
        }
        etiquetaY = 'Frecuencia';
        items = [[COLORES.base, 'Frecuencia de cada valor'], [COLORES.k, 'Moda']];
      } else {
        barras = g.barras.map(b => ({ ...b, resaltar: b.x === g.k }));
        items = [[COLORES.base, 'P(X = x)'], [COLORES.k, `x = k = ${g.k}`]];
      }
      const ymax = Math.max(...barras.map(b => b.p)) * 1.12 || 1;
      const n = barras.length, ancho = pw / n;
      const Y = y => M.t + ph - y / ymax * ph;
      barras.forEach((b, i) => {
        ctx.fillStyle = b.resaltar ? COLORES.k : COLORES.base;
        ctx.fillRect(M.l + i * ancho + ancho * 0.12, Y(b.p), ancho * 0.76, M.t + ph - Y(b.p));
      });
      ctx.strokeStyle = COLORES.eje; ctx.beginPath(); ctx.moveTo(M.l, M.t); ctx.lineTo(M.l, M.t + ph); ctx.lineTo(M.l + pw, M.t + ph); ctx.stroke();
      ctx.fillStyle = COLORES.eje; ctx.textAlign = 'center';
      const paso = Math.ceil(n / 16);
      barras.forEach((b, i) => { if (i % paso === 0) ctx.fillText(b.etiqueta || fmt(b.x, 2), M.l + (i + 0.5) * ancho, M.t + ph + 16); });
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) { const y = ymax * i / 4; ctx.fillText(g.tipo === 'datos' ? fmt(Math.round(y * 10) / 10) : y.toFixed(3), M.l - 6, Y(y) + 4); }
      ctx.textAlign = 'left'; ctx.fillText(etiquetaY, M.l + 6, M.t + 10);
    }
    leyenda.innerHTML = items.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('');
  }

  function ejes(ctx, M, pw, ph, xmin, xmax, X, ymax, etiquetaY) {
    ctx.strokeStyle = COLORES.eje; ctx.fillStyle = COLORES.eje;
    ctx.beginPath(); ctx.moveTo(M.l, M.t); ctx.lineTo(M.l, M.t + ph); ctx.lineTo(M.l + pw, M.t + ph); ctx.stroke();
    ctx.textAlign = 'center';
    // Paso "redondo" (1, 2 o 5 × 10ⁿ) para que las marcas del eje sean legibles
    const crudo = (xmax - xmin) / (pw < 400 ? 5 : 8), pot = 10 ** Math.floor(Math.log10(crudo));
    const paso = [1, 2, 5, 10].map(f => f * pot).find(s => s >= crudo);
    for (let x = Math.ceil(xmin / paso) * paso; x <= xmax + 1e-9; x += paso) ctx.fillText(fmt(Math.round(x / paso) * paso, 6), X(x), M.t + ph + 16);
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) { const y = ymax * i / 4; ctx.fillText(y.toPrecision(2), M.l - 6, M.t + ph - ph * i / 4 + 4); }
    ctx.textAlign = 'left'; ctx.fillText(etiquetaY, M.l + 6, M.t + 10);
  }

  // ===================== Comprobación =====================
  function ejecutarPruebas() {
    const res = Pruebas.ejecutarTodas();
    const total = res.length, pasan = res.filter(p => p.pasa).length;
    const valor = x => typeof x === 'number' ? (Number.isInteger(x) ? String(x) : x.toFixed(6)) : esc(x);
    $('#resumen-pruebas').innerHTML = `<b>${pasan} de ${total}</b> pruebas pasan ${pasan === total ? '✓' : '✗'} — ejecutadas ahora mismo en este navegador.`;
    $('#resumen-pruebas').className = 'mensaje ' + (pasan === total ? 'ok' : 'error');
    $('#lista-pruebas').innerHTML = res.map(p => `
      <div class="tarjeta prueba ${p.pasa ? 'pasa' : 'falla'}">
        <h3><span class="insignia">${p.pasa ? 'PASA' : 'FALLA'}</span> ${p.id} · ${esc(p.modulo)}</h3>
        <p><b>${esc(p.titulo)}</b></p>
        <p><b>Entradas:</b> ${esc(p.entradas)}</p>
        <table class="tabla-resultado"><thead><tr><th>Medida</th><th>Esperado</th><th>Obtenido</th><th>Tolerancia</th><th></th></tr></thead><tbody>
        ${p.filas.map(f => `<tr><td>${esc(f.nombre)}</td><td class="num">${valor(f.esperado)}</td><td class="num">${valor(f.obtenido)}</td>
          <td class="num">${typeof f.tolerancia === 'number' ? (f.tolerancia === 0 ? 'exacto' : '± ' + f.tolerancia) : 'mensaje'}</td><td>${f.pasa ? '✓' : '✗'}</td></tr>`).join('')}
        </tbody></table>
        <p class="nota"><b>Referencia:</b> ${esc(p.referencia)}</p>
      </div>`).join('');
  }

  // ===================== Inicio =====================
  document.addEventListener('DOMContentLoaded', () => {
    construirMenu();
    MODULOS.forEach(construirModulo);
    $('#lista-modulos').innerHTML = MODULOS.map(m => `<li><a href="#${m.id}">${esc(m.nombre)}</a> — ${esc(m.ejemplo.titulo)}</li>`).join('');
    window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));
    $('#boton-menu').addEventListener('click', () => document.body.classList.toggle('menu-abierto'));
    mostrar(location.hash.slice(1) || 'inicio');
  });

  // Cualquier error no previsto se muestra sin detener la aplicación
  window.addEventListener('error', e => {
    const sec = $$('.pagina').find(p => !p.hidden);
    if (sec && $('.mensaje', sec)) mostrarMensaje(sec, 'Ocurrió un error inesperado: ' + e.message + '. La aplicación sigue funcionando.');
  });
})();
