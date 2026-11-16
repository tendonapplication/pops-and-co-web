# POPS & CO — página web

Sitio web de POPS & CO (palomitas, Delicias, Chihuahua) para el dominio **popsandco.com.mx**.

Página estática: no necesita instalar nada ni compilar.

## Archivos
- `index.html`: todo el contenido (textos, sabores, secciones).
- `css/estilos.css`: diseño y colores (amarillo `#FFC72C`, morado `#4C1D7A`).
- `js/main.js`: menú del celular, animaciones y formulario → WhatsApp
  (el número está en la constante `WHATSAPP`).
- `assets/img/`: logo en versiones morado, blanco y negro, con y sin lema.
- `assets/img/bolsas/`: bolsas de celofán con la etiqueta de cada sabor (generadas).
- `assets/original/`: logo y etiquetas originales tal como los entregó el cliente.
- `herramientas/generar_bolsas.py`: vuelve a dibujar las bolsas si cambia una etiqueta.
  Reemplazar la etiqueta en `assets/original/etiquetas/` y correr `python herramientas/generar_bolsas.py` (requiere `pip install pillow`).

## Verla en la computadora
Dentro de esta carpeta:

```
python -m http.server 8090
```

y abrir http://127.0.0.1:8090 (en Mac usar `python3`).
