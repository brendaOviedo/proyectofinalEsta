"""Genera la carpeta comprimida de entrega.

Uso (desde la carpeta principal del proyecto):  python herramientas/empaquetar.py

El ABRIR.html del .zip lleva el CSS y el JavaScript incrustados, para que funcione aunque se abra
con doble clic desde dentro del .zip (Windows solo extrae ese archivo a una carpeta temporal).
La carpeta recursos/ se incluye igual como código fuente legible.
"""
import os
import re
import zipfile

NOMBRE = "ProyectoFinal_Estadistica_BrendaOviedo_6691-25-3920"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVOS = ["Guia_de_uso.pdf", "Informe.pdf"]
CARPETAS = ["recursos", "ejemplos"]


def leer(ruta):
    with open(os.path.join(RAIZ, ruta), encoding="utf-8") as f:
        return f.read()


def incrustar(html):
    def estilo(m):
        return "<style>\n" + leer(m.group(1)) + "</style>"

    def script(m):
        codigo = leer(m.group(1))
        if "</script" in codigo.lower():
            raise SystemExit(f"{m.group(1)} contiene '</script' y no se puede incrustar")
        return "<script>\n" + codigo + "</script>"

    html, n_css = re.subn(r'<link rel="stylesheet" href="([^"]+)">', estilo, html)
    html, n_js = re.subn(r'<script src="([^"]+)"></script>', script, html)
    if n_css != 1 or n_js != 4:
        raise SystemExit(f"Se esperaban 1 hoja de estilos y 4 scripts; se encontraron {n_css} y {n_js}")
    return html


def main():
    destino = os.path.join(RAIZ, NOMBRE + ".zip")
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(NOMBRE + "/ABRIR.html", incrustar(leer("ABRIR.html")))
        for archivo in ARCHIVOS:
            z.write(os.path.join(RAIZ, archivo), NOMBRE + "/" + archivo)
        for carpeta in CARPETAS:
            for base, _, nombres in os.walk(os.path.join(RAIZ, carpeta)):
                for nombre in sorted(nombres):
                    ruta = os.path.join(base, nombre)
                    relativa = os.path.relpath(ruta, RAIZ).replace(os.sep, "/")
                    z.write(ruta, NOMBRE + "/" + relativa)
        total = len(z.namelist())
    print(f"Listo: {NOMBRE}.zip ({total} archivos)")


if __name__ == "__main__":
    main()
