# Calculadora Estadística — Proyecto final Estadística I

Aplicación estadística que se abre en el navegador con **doble clic en `ABRIR.html`**.
Funciona sin internet, sin instalaciones, sin cuentas y sin comandos.

**Integrante:** Brenda Maribel Oviedo Catalan — Carné 6691-25-3920

## Módulos

| Grupo | Módulos |
|---|---|
| Descriptiva | n, media, mediana, moda, mínimo, máximo, rango, varianza y desviación (poblacional y muestral) |
| Probabilidad | Combinaciones, unión, probabilidad condicional y regla de Bayes |
| Discretas | Binomial, Hipergeométrica, Poisson (con ajuste de λ al intervalo) |
| Continuas | Uniforme, Normal, Gamma (α, θ), Exponencial (λ o 1/λ), Ji cuadrada (ν), Lognormal |
| Muestrales | Teorema del límite central (media muestral y suma) |
| Evaluación | Comprobación: 15 pruebas documentadas que se ejecutan en el navegador |

Cada módulo incluye definición, parámetros, supuestos, media y varianza; botones **Calcular**, **Limpiar**,
**Cargar ejemplo** e **Importar archivo**; y muestra tabla de resultados, procedimiento, gráfica e interpretación.

## Estructura

```
ABRIR.html              Archivo principal (doble clic)
recursos/estilos.css    Estilos
recursos/js/            estadistica.js (cálculos), modulos.js (teoría y ejemplos),
                        app.js (interfaz), pruebas.js (pruebas documentadas)
ejemplos/               Archivos .txt/.csv para probar la importación
Guia_de_uso.pdf         Guía de una página
Informe.pdf             Informe con situaciones aplicadas, cálculos a mano y pruebas
docs/fuentes/           HTML de la guía y el informe + generar-pdf.bat para regenerar los PDF
pruebas/                Ejecutor de pruebas por consola (opcional): node pruebas/ejecutar-pruebas.js
```

No se usan bibliotecas externas: todas las funciones numéricas (ln Γ de Lanczos, gamma incompleta
regularizada, Φ normal) están en `recursos/js/estadistica.js`.

## Entrega

Ejecute `python herramientas/empaquetar.py`. Genera `ProyectoFinal_Estadistica_BrendaOviedo_6691-25-3920.zip`
con `ABRIR.html`, `recursos/`, `ejemplos/`, `Guia_de_uso.pdf` e `Informe.pdf`. El `ABRIR.html` del .zip lleva el CSS
y el JavaScript incrustados, para que funcione aunque se abra con doble clic desde dentro del .zip
(Windows solo extrae ese archivo a una carpeta temporal).
Si edita `docs/fuentes/informe.html` o `docs/fuentes/guia-de-uso.html`, ejecute
`docs/fuentes/generar-pdf.bat` para regenerar los PDF.
