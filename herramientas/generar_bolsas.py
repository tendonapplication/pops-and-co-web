"""Genera las imágenes de las bolsas de POPS & CO a partir de las etiquetas.

Bolsa de celofán transparente de 18 x 40 cm, sello acanalado arriba,
etiqueta de 8 x 12 cm al centro y palomitas visibles dentro.

Uso (desde la carpeta del proyecto):
    python herramientas/generar_bolsas.py      (Mac: python3)
Requiere Pillow y NumPy:  python -m pip install pillow numpy

Salida: assets/img/bolsas/<sabor>.webp, assets/img/etiquetas/<sabor>.webp
y assets/img/palomitas/palomita-N.webp
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ETIQUETAS = os.path.join(RAIZ, 'assets', 'original', 'etiquetas')
SALIDA = os.path.join(RAIZ, 'assets', 'img')

CM = 90                      # píxeles por centímetro al dibujar (se reduce al final)
ANCHO, ALTO = 18 * CM, 40 * CM
FINAL = (540, 1200)          # tamaño final de cada bolsa
SELLO = int(3.2 * CM)        # alto del sello acanalado

SABORES = {
    'tradicional': dict(
        base=(255, 250, 236), sombra=(190, 160, 110), luz=(255, 255, 250),
        casco=(196, 128, 44), polvo=[(255, 255, 255)], polvo_n=0),
    'queso': dict(
        base=(255, 203, 102), sombra=(226, 146, 38), luz=(255, 232, 158),
        casco=(190, 110, 30), polvo=[(244, 140, 22), (255, 170, 40)], polvo_n=1.0),
    'queso-jalapeno': dict(
        base=(255, 206, 110), sombra=(224, 150, 48), luz=(255, 234, 166),
        casco=(190, 110, 30), polvo=[(244, 150, 30), (66, 120, 40), (66, 120, 40)], polvo_n=1.0),
    'habanero-limon': dict(
        base=(255, 178, 92), sombra=(222, 112, 40), luz=(255, 214, 152),
        casco=(180, 90, 30), polvo=[(214, 58, 28), (150, 192, 60)], polvo_n=1.0),
    'adobado': dict(
        base=(214, 104, 66), sombra=(158, 52, 34), luz=(240, 154, 108),
        casco=(110, 40, 20), polvo=[(120, 24, 20), (170, 50, 30)], polvo_n=1.0),
}


def _desenfocar(arr, radio):
    """Desenfoque gaussiano de una matriz 0..1 (vía Pillow)."""
    im = Image.fromarray(np.clip(arr * 255, 0, 255).astype('uint8'))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(radio)), dtype='float32') / 255


def palomita(pal, rng, tam=220):
    """Devuelve la imagen de una palomita con volumen.

    Se modela como un relieve (lóbulos esféricos grandes con bultos encima),
    se ilumina desde arriba a la izquierda y se oscurecen los pliegues.
    """
    n = tam * 2                                   # se dibuja al doble y se reduce
    yy, xx = np.mgrid[0:n, 0:n].astype('float32')
    alto = np.zeros((n, n), 'float32')

    def esfera(cx, cy, cz, r):
        d2 = (xx - cx) ** 2 + (yy - cy) ** 2
        z = cz + np.sqrt(np.clip(r * r - d2, 0, None))
        np.maximum(alto, np.where(d2 < r * r, z, 0), out=alto)

    c = n / 2
    lobulos = [(c, c, n * rng.uniform(.17, .21))]
    giro = rng.uniform(0, math.tau)
    cuantos = rng.randint(3, 5)
    for i in range(cuantos):
        ang = giro + i * math.tau / cuantos + rng.uniform(-.45, .45)
        dist = n * rng.uniform(.13, .23)
        lobulos.append((c + math.cos(ang) * dist, c + math.sin(ang) * dist, n * rng.uniform(.15, .23)))
    for x, y, r in lobulos:
        esfera(x, y, 0, r)
    for _ in range(rng.randint(12, 18)):          # bultos sobre los lóbulos
        x0, y0, r0 = rng.choice(lobulos)
        ang = rng.uniform(0, math.tau)
        d = r0 * rng.uniform(.35, .85)
        r = r0 * rng.uniform(.28, .5)
        x, y = x0 + math.cos(ang) * d, y0 + math.sin(ang) * d
        base = math.sqrt(max(r0 * r0 - d * d, 0))
        esfera(x, y, base * .75, r)

    mascara = alto > 0
    alto_s = _desenfocar(alto / alto.max(), n * .012) * alto.max()
    gy, gx = np.gradient(alto_s)
    norma = np.sqrt(gx * gx + gy * gy + 1)
    luz_dir = np.array([-.45, -.6, .66]); luz_dir /= np.linalg.norm(luz_dir)
    difusa = np.clip((-gx * luz_dir[0] - gy * luz_dir[1] + luz_dir[2]) / norma, 0, 1)

    rel = alto / alto.max()
    pliegue = np.clip((_desenfocar(rel, n * .05) - rel) * 7, 0, 1)      # zonas hundidas
    sombra_amb = np.clip(1 - pliegue * .85, 0, 1)
    tono = (.30 + .70 * difusa) * sombra_amb
    grano = np.asarray(Image.effect_noise((n, n), 40).filter(ImageFilter.GaussianBlur(1.5)), 'float32') / 255 - .5
    tono = np.clip(tono * (1 + grano * .5), 0, 1)

    base = np.array(pal['base'], 'float32')
    sombra = np.array(pal['sombra'], 'float32')
    luz = np.array(pal['luz'], 'float32')
    casco = np.array(pal['casco'], 'float32')
    color = sombra + (base - sombra) * tono[..., None]
    color += (luz - color) * (np.clip(difusa, 0, 1) ** 5 * .55)[..., None]
    color += (casco - color) * (pliegue ** 1.5 * .55)[..., None]          # pliegues tostados

    # sazonador en manchas irregulares
    if pal['polvo_n'] > 0:
        chico = Image.fromarray((np.array([[rng.random() for _ in range(7)] for _ in range(7)]) * 255).astype('uint8'))
        manchas = np.asarray(chico.resize((n, n), Image.BICUBIC), 'float32') / 255
        manchas = np.clip((manchas - .35) * 1.8, 0, 1) * .5 * pal['polvo_n']
        polvo = np.array(pal['polvo'][0], 'float32')
        color += (polvo * (.55 + .45 * tono[..., None]) - color) * manchas[..., None]

    im = Image.fromarray(np.dstack([np.clip(color, 0, 255), mascara * 255.0]).astype('uint8'), 'RGBA')

    # cascarita y granitos de sazonador
    extra = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(extra)
    if rng.random() < .6:
        x, y = c + rng.uniform(-.08, .08) * n, c + rng.uniform(-.08, .08) * n
        rx, ry = n * rng.uniform(.05, .08), n * rng.uniform(.03, .05)
        d.ellipse((x - rx, y - ry, x + rx, y + ry), fill=tuple(int(v * .8) for v in pal['casco']) + (230,))
        d.ellipse((x - rx * .5, y - ry * .7, x + rx * .1, y - ry * .1), fill=pal['casco'] + (255,))
    for _ in range(int(rng.randint(14, 30) * pal['polvo_n'])):
        x, y = rng.uniform(.15, .85) * n, rng.uniform(.15, .85) * n
        r = n * rng.uniform(.004, .011)
        d.ellipse((x - r, y - r, x + r, y + r), fill=rng.choice(pal['polvo']) + (220,))
    extra = extra.filter(ImageFilter.GaussianBlur(n * .004))
    extra.putalpha(ImageChops.multiply(extra.getchannel('A'), im.getchannel('A')))
    im.alpha_composite(extra)
    return im.resize((tam, tam), Image.LANCZOS)


def sombra_de(im):
    """Sombra suave de una palomita, para dar profundidad al apilarlas."""
    s = Image.new('RGBA', im.size, (30, 12, 0, 0))
    s.putalpha(im.getchannel('A').filter(ImageFilter.GaussianBlur(im.width * .05)).point(lambda v: int(v * .55)))
    return s


def contorno_bolsa():
    """Polígono del cuerpo de la bolsa (debajo del sello)."""
    pts = []
    arriba = SELLO - 10
    # lado izquierdo, de arriba a abajo, con un ligero pellizco bajo el sello
    for i in range(0, 101):
        t = i / 100
        y = arriba + t * (ALTO - 40 - arriba)
        pellizco = math.exp(-((t - .02) / .05) ** 2) * CM * .5
        panza = math.sin(t * math.pi) * CM * .15
        pts.append((22 + pellizco - panza, y))
    # fondo redondeado
    for i in range(1, 30):
        a = math.pi * i / 30
        pts.append((ANCHO / 2 - math.cos(a) * (ANCHO / 2 - 22), ALTO - 40 + math.sin(a) * 30))
    for x, y in reversed(pts[:101]):
        pts.append((ANCHO - x, y))
    return pts


def generar_bolsa(sabor, pal, etiqueta_path, semilla):
    rng = random.Random(semilla)
    lienzo = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))

    cuerpo = Image.new('L', (ANCHO, ALTO), 0)
    ImageDraw.Draw(cuerpo).polygon(contorno_bolsa(), fill=255)

    # --- Palomitas dentro: tres capas, de atrás (más oscura) hacia adelante ---
    moldes = [palomita(pal, rng) for _ in range(14)]
    sombras = [sombra_de(m) for m in moldes]
    relleno = Image.new('RGBA', (ANCHO, ALTO), tuple(int(v * .45) for v in pal['sombra']) + (255,))
    tope = SELLO + int(2.4 * CM)
    for brillo, cantidad in [(.62, 190), (.82, 190), (1.0, 210)]:
        for _ in range(cantidad):
            k = rng.randrange(len(moldes))
            lado = int(rng.uniform(2.5, 3.4) * CM)
            ang = rng.uniform(0, 360)
            m = moldes[k].resize((lado, lado), Image.LANCZOS).rotate(ang, Image.BICUBIC)
            sm = sombras[k].resize((lado, lado), Image.LANCZOS).rotate(ang, Image.BICUBIC)
            if brillo < 1:
                r, g, b, a = m.split()
                m = Image.merge('RGBA', [c.point(lambda v, f=brillo: int(v * f)) for c in (r, g, b)] + [a])
            x = int(rng.uniform(-CM, ANCHO) - lado / 2 + CM / 2)
            ondula = math.sin(x / ANCHO * math.pi * 3 + semilla) * CM * .5
            y = int(rng.uniform(tope + ondula, ALTO) - lado / 2)
            relleno.alpha_composite(sm, (max(x + 10, 0), max(y + 16, 0)), (max(-x - 10, 0), max(-y - 16, 0)))
            relleno.alpha_composite(m, (max(x, 0), max(y, 0)), (max(-x, 0), max(-y, 0)))
    # arriba de las palomitas la bolsa está vacía (transparente)
    vacio = Image.new('L', (ANCHO, ALTO), 0)
    borde_sup = [(x, tope + CM * .9 + math.sin(x / ANCHO * math.pi * 3 + semilla) * CM * .5 + math.sin(x / 55 + semilla) * CM * .28)
                 for x in range(0, ANCHO + 30, 30)]
    ImageDraw.Draw(vacio).polygon([(0, ALTO)] + borde_sup + [(ANCHO, ALTO)], fill=255)
    vacio = vacio.filter(ImageFilter.GaussianBlur(6))
    relleno.putalpha(ImageChops.multiply(vacio, cuerpo))
    lienzo.alpha_composite(relleno)

    # --- Celofán: velo, brillos y arrugas ---
    velo = Image.new('RGBA', (ANCHO, ALTO), (255, 255, 255, 0))
    vd = ImageDraw.Draw(velo)
    vd.rectangle((0, 0, ANCHO, ALTO), fill=(255, 255, 255, 26))
    for x0, w, a in [(.10, .05, 110), (.17, .015, 90), (.83, .03, 80), (.90, .012, 120)]:
        vd.rectangle((ANCHO * x0, SELLO, ANCHO * (x0 + w), ALTO), fill=(255, 255, 255, a))
    for _ in range(14):  # arrugas cerca del sello y del fondo
        y = rng.choice([rng.uniform(SELLO, SELLO + 2.5 * CM), rng.uniform(ALTO - 3 * CM, ALTO)])
        x = rng.uniform(.05, .95) * ANCHO
        largo = rng.uniform(1, 3) * CM
        ang = rng.uniform(-.6, .6) + (math.pi / 2 if rng.random() < .5 else 0)
        vd.line((x, y, x + math.cos(ang) * largo, y + math.sin(ang) * largo), fill=(255, 255, 255, 120), width=6)
    velo = velo.filter(ImageFilter.GaussianBlur(14))
    velo.putalpha(ImageChops.multiply(velo.getchannel('A'), cuerpo))
    lienzo.alpha_composite(velo)

    # borde del celofán
    borde = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    ImageDraw.Draw(borde).line(contorno_bolsa() + [contorno_bolsa()[0]], fill=(255, 255, 255, 170), width=10)
    borde = borde.filter(ImageFilter.GaussianBlur(3))
    lienzo.alpha_composite(borde)

    # --- Sello acanalado ---
    sello = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sello)
    dientes = 36
    paso = ANCHO / dientes
    pts = [(0, SELLO)]
    for i in range(dientes + 1):
        pts.append((i * paso, 22 if i % 2 == 0 else 0))
    pts.append((ANCHO, SELLO))
    sd.polygon(pts, fill=(235, 238, 245, 150))
    for x in range(0, ANCHO, 24):
        sd.rectangle((x, 30, x + 10, SELLO - 30), fill=(255, 255, 255, 120))
        sd.rectangle((x + 12, 30, x + 16, SELLO - 30), fill=(170, 175, 190, 90))
    sd.rectangle((0, SELLO - 22, ANCHO, SELLO - 8), fill=(255, 255, 255, 160))
    sello = sello.filter(ImageFilter.GaussianBlur(1.5))
    lienzo.alpha_composite(sello)

    # --- Etiqueta al centro (8 x 12 cm) ---
    et = Image.open(etiqueta_path).convert('RGBA').resize((8 * CM, 12 * CM), Image.LANCZOS)
    ex = (ANCHO - et.width) // 2
    ey = int(ALTO * .5 - et.height / 2 + CM * .8)
    sombra = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rectangle((ex + 10, ey + 18, ex + et.width + 10, ey + et.height + 18), fill=(0, 0, 0, 90))
    lienzo.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(18)))
    lienzo.alpha_composite(et, (ex, ey))
    brillo = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    ImageDraw.Draw(brillo).polygon(
        [(ex, ey), (ex + et.width * .55, ey), (ex, ey + et.height * .45)], fill=(255, 255, 255, 38))
    lienzo.alpha_composite(brillo.filter(ImageFilter.GaussianBlur(30)))

    final = lienzo.resize(FINAL, Image.LANCZOS)
    ruta = os.path.join(SALIDA, 'bolsas', f'{sabor}.webp')
    final.save(ruta, 'WEBP', quality=86, method=6)

    et_web = Image.open(etiqueta_path).convert('RGB')
    et_web.thumbnail((600, 900), Image.LANCZOS)
    et_web.save(os.path.join(SALIDA, 'etiquetas', f'{sabor}.webp'), 'WEBP', quality=86, method=6)
    print('listo:', ruta)


def generar_palomitas():
    pal = SABORES['tradicional']
    for i in range(4):
        im = palomita(pal, random.Random(100 + i), tam=320).resize((180, 180), Image.LANCZOS)
        ruta = os.path.join(SALIDA, 'palomitas', f'palomita-{i + 1}.webp')
        im.save(ruta, 'WEBP', quality=90, method=6)
        print('listo:', ruta)


if __name__ == '__main__':
    for carpeta in ('bolsas', 'etiquetas', 'palomitas'):
        os.makedirs(os.path.join(SALIDA, carpeta), exist_ok=True)
    for n, (sabor, pal) in enumerate(SABORES.items()):
        generar_bolsa(sabor, pal, os.path.join(ETIQUETAS, f'{sabor}.png'), semilla=7 + n)
    generar_palomitas()
