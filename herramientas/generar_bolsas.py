"""Genera las imágenes de las bolsas de POPS & CO a partir de las etiquetas.

Bolsa de celofán transparente de 18 x 40 cm, sello acanalado arriba,
etiqueta de 8 x 12 cm al centro y palomitas visibles dentro.

Uso (desde la carpeta del proyecto):
    python herramientas/generar_bolsas.py      (Mac: python3)
Requiere Pillow:  python -m pip install pillow

Salida: assets/img/bolsas/<sabor>.webp, assets/img/etiquetas/<sabor>.webp
y assets/img/palomitas/palomita-N.webp
"""
import math
import os
import random

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
        base=(250, 241, 218), sombra=(214, 190, 142), luz=(255, 253, 244),
        casco=(200, 140, 55), polvo=[(255, 255, 255)], polvo_n=0.4),
    'queso': dict(
        base=(255, 203, 102), sombra=(226, 146, 38), luz=(255, 232, 158),
        casco=(190, 110, 30), polvo=[(244, 140, 22), (255, 170, 40)], polvo_n=1.0),
    'queso-jalapeno': dict(
        base=(255, 206, 110), sombra=(224, 150, 48), luz=(255, 234, 166),
        casco=(190, 110, 30), polvo=[(66, 120, 40), (244, 150, 30)], polvo_n=1.0),
    'habanero-limon': dict(
        base=(255, 178, 92), sombra=(222, 112, 40), luz=(255, 214, 152),
        casco=(180, 90, 30), polvo=[(214, 58, 28), (150, 192, 60)], polvo_n=1.0),
    'adobado': dict(
        base=(214, 104, 66), sombra=(158, 52, 34), luz=(240, 154, 108),
        casco=(110, 40, 20), polvo=[(120, 24, 20), (170, 50, 30)], polvo_n=1.0),
}


def mezclar(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def palomita(draw, cx, cy, tam, pal, rng, oscuro=0.0):
    """Dibuja una palomita: varios lóbulos con sombra, color base y brillo."""
    sombra = mezclar(pal['sombra'], (60, 40, 30), oscuro * 0.5)
    base = mezclar(pal['base'], pal['sombra'], oscuro)
    luz = mezclar(pal['luz'], pal['base'], oscuro)
    n = rng.randint(5, 7)
    giro = rng.uniform(0, math.tau)
    lobulos = []
    for i in range(n):
        ang = giro + i * math.tau / n + rng.uniform(-.3, .3)
        dist = tam * rng.uniform(.18, .34)
        r = tam * rng.uniform(.26, .38)
        lobulos.append((cx + math.cos(ang) * dist, cy + math.sin(ang) * dist, r))
    lobulos.append((cx, cy, tam * .3))
    for x, y, r in lobulos:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=sombra + (255,))
    for x, y, r in lobulos:
        r2 = r * .86
        draw.ellipse((x - r2 - r * .06, y - r2 - r * .08, x + r2 - r * .06, y + r2 - r * .08), fill=base + (255,))
    for x, y, r in lobulos:
        r3 = r * .42
        ox, oy = x - r * .28, y - r * .3
        draw.ellipse((ox - r3, oy - r3, ox + r3, oy + r3), fill=luz + (255,))
    if rng.random() < .45:  # pedacito de cascarita
        ang = rng.uniform(0, math.tau)
        x, y = cx + math.cos(ang) * tam * .25, cy + math.sin(ang) * tam * .25
        r = tam * .09
        draw.ellipse((x - r, y - r * .7, x + r, y + r * .7), fill=pal['casco'] + (255,))
    for _ in range(int(rng.randint(3, 9) * pal['polvo_n'])):  # sazonador
        x = cx + rng.uniform(-.45, .45) * tam
        y = cy + rng.uniform(-.45, .45) * tam
        r = tam * rng.uniform(.015, .035)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=rng.choice(pal['polvo']) + (255,))


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

    # --- Palomitas dentro ---
    relleno = Image.new('RGBA', (ANCHO, ALTO), (0, 0, 0, 0))
    d = ImageDraw.Draw(relleno)
    tope = SELLO + int(2.6 * CM)
    capas = [(.55, 260), (.25, 260), (0.0, 300)]   # (oscuridad, cantidad): de atrás hacia adelante
    for oscuro, cantidad in capas:
        for _ in range(cantidad):
            x = rng.uniform(-CM, ANCHO + CM)
            ondula = math.sin(x / ANCHO * math.pi * 3 + semilla) * CM * .6
            y = rng.uniform(tope + ondula, ALTO + CM)
            palomita(d, x, y, rng.uniform(1.7, 2.4) * CM, pal, rng, oscuro)
    relleno = relleno.filter(ImageFilter.GaussianBlur(2))
    relleno.putalpha(ImageChops.multiply(relleno.getchannel('A'), cuerpo))
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
        rng = random.Random(100 + i)
        tam = 600
        im = Image.new('RGBA', (tam, tam), (0, 0, 0, 0))
        palomita(ImageDraw.Draw(im), tam / 2, tam / 2, tam * .62, pal, rng)
        im = im.filter(ImageFilter.GaussianBlur(1.2)).resize((160, 160), Image.LANCZOS)
        ruta = os.path.join(SALIDA, 'palomitas', f'palomita-{i + 1}.webp')
        im.save(ruta, 'WEBP', quality=88, method=6)
        print('listo:', ruta)


if __name__ == '__main__':
    for carpeta in ('bolsas', 'etiquetas', 'palomitas'):
        os.makedirs(os.path.join(SALIDA, carpeta), exist_ok=True)
    for n, (sabor, pal) in enumerate(SABORES.items()):
        generar_bolsa(sabor, pal, os.path.join(ETIQUETAS, f'{sabor}.png'), semilla=7 + n)
    generar_palomitas()
