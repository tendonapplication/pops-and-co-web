// POPS & CO — interacción de la página (v4)

// Número de WhatsApp que recibe los mensajes del formulario.
// Formato: 52 + 10 dígitos, sin espacios ni signos.
const WHATSAPP = '526695059646'; // 669 505 9646

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (!sinMovimiento) document.documentElement.classList.add('js-mov');

document.getElementById('anio').textContent = new Date().getFullYear();

/* ---------- Encabezado: oscuro sobre la portada, claro después ---------- */
const encabezado = document.getElementById('encabezado');
const portada = document.getElementById('inicio');
const revisarEncabezado = () => {
  const limite = portada.offsetTop + portada.offsetHeight - 70;
  encabezado.classList.toggle('claro', window.scrollY > limite);
};
window.addEventListener('scroll', revisarEncabezado, { passive: true });
revisarEncabezado();

/* ---------- Menú en celular ---------- */
const menuBoton = document.getElementById('menu-boton');
const menu = document.getElementById('menu');
const cerrarMenu = () => {
  menu.classList.remove('abierto');
  menuBoton.setAttribute('aria-expanded', 'false');
  menuBoton.setAttribute('aria-label', 'Abrir menú');
};
menuBoton.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  menuBoton.setAttribute('aria-expanded', String(abierto));
  menuBoton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
});
menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrarMenu));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarMenu(); });

// Marcar en el menú la sección visible
if ('IntersectionObserver' in window) {
  const enlaces = [...menu.querySelectorAll('a:not(.boton)')];
  const vigia = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      enlaces.forEach((a) => a.classList.toggle('activo', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'sabores', 'negocios', 'distribuidores', 'nosotros', 'contacto']
    .forEach((id) => vigia.observe(document.getElementById(id)));
}

/* ---------- Portada: puñitos de palomitas con física ---------- */
const lienzo = document.getElementById('lienzo');
const ctx = lienzo.getContext('2d');
const fotos = [1, 2, 3, 4].map((n) => { const i = new Image(); i.src = `assets/img/palomitas/palomita-${n}.webp`; return i; });
const piezas = [];
let ancho = 0, alto = 0, radioBase = 20, maxPiezas = 120, andando = false, quietos = 0, visible = true;

function medirLienzo() {
  const r = portada.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ancho = r.width; alto = r.height;
  lienzo.width = Math.round(ancho * dpr); lienzo.height = Math.round(alto * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  radioBase = Math.max(15, Math.min(27, ancho / 48));
  maxPiezas = Math.round((ancho / (radioBase * 2)) * (ancho < 760 ? 4.6 : 3.6));
  while (piezas.length > maxPiezas) piezas.shift();
  piezas.forEach((p) => { p.x = Math.min(Math.max(p.x, p.r), ancho - p.r); p.px = p.x; });
}

function puñito(x, y, cuantas = 8, fuerza = 1) {
  for (let i = 0; i < cuantas; i++) {
    const r = radioBase * (0.8 + Math.random() * 0.45);
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = (3 + Math.random() * 5) * fuerza;
    const px = x + (Math.random() - 0.5) * 30;
    const py = y + (Math.random() - 0.5) * 20;
    piezas.push({
      x: px, y: py, px: px - Math.cos(ang) * v, py: py - Math.sin(ang) * v, r,
      img: fotos[(Math.random() * 4) | 0], rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, nace: performance.now(),
    });
  }
  while (piezas.length > maxPiezas) piezas.shift();
  quietos = 0;
  arrancar();
}

function paso() {
  const g = 0.42;
  for (const p of piezas) {
    const vx = (p.x - p.px) * 0.985;
    const vy = (p.y - p.py) * 0.985;
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy + g;
    p.rot += p.vr; p.vr *= 0.97;
  }
  for (let it = 0; it < 4; it++) {
    for (let i = 0; i < piezas.length; i++) {
      const a = piezas[i];
      for (let j = i + 1; j < piezas.length; j++) {
        const b = piezas[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = (a.r + b.r) * 0.86;
        if (Math.abs(dx) > min || Math.abs(dy) > min) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 === 0) continue;
        const d = Math.sqrt(d2);
        const empuje = (min - d) / d * 0.5;
        a.x -= dx * empuje; a.y -= dy * empuje;
        b.x += dx * empuje; b.y += dy * empuje;
      }
      if (a.y > alto - a.r * 0.7) { a.y = alto - a.r * 0.7; a.px += (a.x - a.px) * 0.3; }
      if (a.x < a.r) a.x = a.r;
      if (a.x > ancho - a.r) a.x = ancho - a.r;
    }
  }
}

function dibujar() {
  ctx.clearRect(0, 0, ancho, alto);
  for (const p of piezas) {
    if (!p.img.complete) continue;
    const t = p.r * 2.5;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.drawImage(p.img, -t / 2, -t / 2, t, t);
    ctx.restore();
  }
}

function bucle() {
  if (!visible) { andando = false; return; }
  paso();
  dibujar();
  let mov = 0;
  for (const p of piezas) mov = Math.max(mov, Math.abs(p.x - p.px) + Math.abs(p.y - p.py));
  quietos = mov < 0.15 ? quietos + 1 : 0;
  if (quietos > 40) { andando = false; return; }
  requestAnimationFrame(bucle);
}
function arrancar() { if (!andando && visible) { andando = true; requestAnimationFrame(bucle); } }

medirLienzo();
let reloj = null;
window.addEventListener('resize', () => { clearTimeout(reloj); reloj = setTimeout(() => { medirLienzo(); quietos = 0; arrancar(); revisarEncabezado(); }, 150); });

if (sinMovimiento) {
  // Montón ya formado, sin animar
  Promise.all(fotos.map((f) => f.decode().catch(() => {}))).then(() => {
    for (let k = 0; k < maxPiezas * 0.7; k += 8) puñito(Math.random() * ancho, alto - 200 - Math.random() * 200, 8, 0.2);
    andando = true;
    for (let i = 0; i < 500; i++) paso();
    andando = false;
    dibujar();
  });
  portada.classList.add('lista');
} else {
  requestAnimationFrame(() => portada.classList.add('lista'));
  Promise.all(fotos.map((f) => f.decode().catch(() => {}))).then(() => {
    // Lluvia inicial: puñitos que caen desde arriba durante el primer segundo y medio
    const total = Math.round(maxPiezas * 0.62);
    let echadas = 0;
    const lluvia = setInterval(() => {
      const x = ancho * (0.08 + Math.random() * 0.84);
      puñito(x, -40, 6, 0.6);
      echadas += 6;
      if (echadas >= total) clearInterval(lluvia);
    }, 90);
  });

  // Tocar la portada echa un puñito donde tocas (no sobre botones ni enlaces)
  portada.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    const r = portada.getBoundingClientRect();
    puñito(e.clientX - r.left, e.clientY - r.top, 9, 1.2);
    portada.classList.add('tocada');
  });

  // Mover el ratón empuja suavemente las palomitas cercanas
  if (conRaton) {
    portada.addEventListener('pointermove', (e) => {
      const r = portada.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let movio = false;
      for (const p of piezas) {
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, rad = 70;
        if (d2 < rad * rad && d2 > 1) {
          const d = Math.sqrt(d2), f = (rad - d) / rad * 2.2;
          p.x += dx / d * f; p.y += dy / d * f - f * 0.4; p.vr += (Math.random() - 0.5) * 0.05;
          movio = true;
        }
      }
      if (movio) { quietos = 0; arrancar(); }
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { quietos = 0; arrancar(); } }).observe(portada);
  }
}

/* ---------- Sabores ---------- */
const seccionSabores = document.getElementById('sabores');
const bolsa = document.getElementById('vitrina-bolsa');
const giro = document.getElementById('giro');
const escenario = document.getElementById('escenario');
const estallido = document.getElementById('estallido');
const detalle = document.getElementById('detalle');
const nombreGigante = document.getElementById('nombre-gigante');
const cuenta = document.getElementById('cuenta');
const tabs = [...document.querySelectorAll('.sabor-tab')];
let actual = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
let cambiando = false;

tabs.forEach((t) => { const img = new Image(); img.src = `assets/img/bolsas/${t.dataset.sabor}.webp`; });

function reventar() {
  if (sinMovimiento) return;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('img');
    p.src = `assets/img/palomitas/palomita-${(i % 4) + 1}.webp`;
    p.alt = '';
    estallido.appendChild(p);
    const ang = (-90 + (Math.random() - 0.5) * 170) * Math.PI / 180;
    const dist = 140 + Math.random() * 160;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
    const tam = 0.6 + Math.random() * 0.8;
    p.animate([
      { transform: `translate(0, 40px) scale(${tam * 0.3}) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${dx * 0.6}px, ${dy * 0.8}px) scale(${tam}) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy + 260}px) scale(${tam}) rotate(${Math.random() * 360}deg)`, opacity: 0 },
    ], { duration: 1200 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
  }
}

async function elegir(i) {
  if (i === actual || cambiando) return;
  cambiando = true;
  const tab = tabs[i];
  tabs.forEach((t, n) => { t.setAttribute('aria-selected', String(n === i)); t.tabIndex = n === i ? 0 : -1; });
  seccionSabores.style.setProperty('--color', tab.dataset.color);
  seccionSabores.style.setProperty('--tinta-sabor', tab.dataset.tinta);
  cuenta.textContent = `${i + 1} de ${tabs.length}`;

  const dir = i > actual ? 1 : -1;
  let salida = null;
  if (!sinMovimiento) {
    salida = bolsa.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-90 * dir}px) rotate(${-14 * dir}deg) scale(.85)`, opacity: 0 }],
      { duration: 240, easing: 'ease-in', fill: 'forwards' });
    nombreGigante.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-12 * dir}%)`, opacity: 0 }],
      { duration: 240, easing: 'ease-in', fill: 'forwards' });
    await salida.finished;
  }
  bolsa.src = `assets/img/bolsas/${tab.dataset.sabor}.webp`;
  bolsa.alt = `Bolsa de palomitas POPS & CO sabor ${tab.dataset.nombre}, 140 g`;
  nombreGigante.textContent = tab.dataset.nombre;
  document.getElementById('detalle-nombre').textContent = tab.dataset.nombre;
  document.getElementById('detalle-desc').textContent = tab.dataset.desc;
  detalle.classList.remove('cambia'); void detalle.offsetWidth; detalle.classList.add('cambia');

  if (!sinMovimiento) {
    salida.cancel();
    nombreGigante.getAnimations().forEach((a) => a.cancel());
    nombreGigante.animate([{ transform: `translateX(${14 * dir}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
    bolsa.animate(
      [{ transform: `translateX(${90 * dir}px) translateY(-40px) rotate(${14 * dir}deg) scale(.85)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 700, easing: 'cubic-bezier(.2,1.5,.4,1)' });
    setTimeout(reventar, 200);
  }
  actual = i;
  cambiando = false;
}

const mover = (n) => elegir((actual + n + tabs.length) % tabs.length);
tabs.forEach((t, i) => {
  t.tabIndex = i === actual ? 0 : -1;
  t.addEventListener('click', () => elegir(i));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (actual + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    elegir(n);
    tabs[n].focus();
  });
});
document.getElementById('anterior').addEventListener('click', (e) => { e.stopPropagation(); mover(-1); });
document.getElementById('siguiente').addEventListener('click', (e) => { e.stopPropagation(); mover(1); });
escenario.addEventListener('click', reventar);

// Deslizar el dedo sobre la bolsa cambia de sabor
let inicioX = null;
escenario.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
escenario.addEventListener('touchend', (e) => {
  if (inicioX === null) return;
  const d = e.changedTouches[0].clientX - inicioX;
  if (Math.abs(d) > 50) mover(d < 0 ? 1 : -1);
  inicioX = null;
});

if (conRaton && !sinMovimiento) {
  escenario.addEventListener('pointermove', (e) => {
    const r = escenario.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    giro.style.transform = `rotateY(${x * 24}deg) rotateX(${y * -12}deg)`;
  });
  escenario.addEventListener('pointerleave', () => { giro.style.transform = ''; });
}

/* ---------- Para tu negocio: la camioneta avanza al bajar ---------- */
const ruta = document.getElementById('ruta');
const camioneta = document.getElementById('camioneta');
const ruedas = camioneta.querySelectorAll('.rueda');
const pasos = [...document.querySelectorAll('.paso')];
let ultimoX = 0, paradaRuta = null;

function moverCamioneta() {
  const r = ruta.getBoundingClientRect();
  const vh = window.innerHeight;
  const k = sinMovimiento ? 1 : Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.15), 0), 1);
  const w = camioneta.getBoundingClientRect().width;
  const x = -w + k * (ruta.clientWidth + w * 0.2 - w * 0.15);
  camioneta.style.transform = `translateX(${x}px)`;
  const ang = x / 0.9;
  ruedas.forEach((g) => { g.style.transform = `rotate(${ang}deg)`; });
  if (Math.abs(x - ultimoX) > 0.5) {
    ruta.classList.add('andando');
    clearTimeout(paradaRuta);
    paradaRuta = setTimeout(() => ruta.classList.remove('andando'), 160);
  }
  ultimoX = x;
  const frente = x + w;
  const enColumna = pasos.length > 1 && pasos[0].offsetLeft === pasos[1].offsetLeft;
  pasos.forEach((p) => {
    const pr = p.getBoundingClientRect();
    const llego = enColumna
      ? pr.top < vh * 0.72
      : frente > pr.left - r.left + pr.width * 0.35;
    p.classList.toggle('llego', sinMovimiento || llego);
  });
}
let pendienteRuta = false;
window.addEventListener('scroll', () => {
  if (pendienteRuta) return;
  pendienteRuta = true;
  requestAnimationFrame(() => { moverCamioneta(); pendienteRuta = false; });
}, { passive: true });
window.addEventListener('resize', moverCamioneta);
moverCamioneta();

/* ---------- Nosotros: números que cuentan ---------- */
document.querySelectorAll('.datos strong').forEach((el) => {
  const nodo = el.firstChild;
  if (!nodo || nodo.nodeType !== 3 || sinMovimiento || !('IntersectionObserver' in window)) return;
  const final = parseInt(nodo.textContent, 10);
  if (Number.isNaN(final)) return;
  const desde = final > 1000 ? final - 25 : 0;
  nodo.textContent = String(desde);
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    const inicio = performance.now();
    const avanzar = (t) => {
      const k = Math.min((t - inicio) / 1300, 1);
      nodo.textContent = String(Math.round(desde + (final - desde) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(avanzar);
    };
    requestAnimationFrame(avanzar);
  }, { threshold: 0.6 }).observe(el);
});

/* ---------- Formulario → WhatsApp ---------- */
const formulario = document.getElementById('formulario');
const aviso = document.getElementById('formulario-aviso');

const textosInteres = {
  tienda: { negocio: 'Nombre de tu negocio', direccion: 'Colonia o dirección',
    saludo: '¡Hola, POPS & CO! Me interesa vender sus palomitas en mi negocio.' },
  distribuidor: { negocio: 'Nombre de tu negocio o empresa', direccion: 'Zona donde vendes',
    saludo: '¡Hola, POPS & CO! Me interesa ser distribuidor y conocer sus precios de mayoreo y pedido mínimo.' },
};
const interesActual = () => formulario.elements.interes.value || 'tienda';
const actualizarInteres = () => {
  const t = textosInteres[interesActual()];
  document.getElementById('etiqueta-negocio').textContent = t.negocio;
  document.getElementById('etiqueta-direccion').textContent = t.direccion;
};
formulario.querySelectorAll('input[name="interes"]').forEach((r) => r.addEventListener('change', actualizarInteres));
document.querySelectorAll('[data-interes]').forEach((b) => b.addEventListener('click', () => {
  const radio = formulario.querySelector(`input[name="interes"][value="${b.dataset.interes}"]`);
  if (radio) { radio.checked = true; actualizarInteres(); }
}));
document.querySelectorAll('a[href="#contacto"]:not([data-interes])').forEach((b) => b.addEventListener('click', () => {
  formulario.querySelector('input[name="interes"][value="tienda"]').checked = true;
  actualizarInteres();
}));

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  aviso.classList.remove('error');

  const datos = new FormData(formulario);
  const nombre = (datos.get('nombre') || '').trim();
  const negocio = (datos.get('negocio') || '').trim();
  const direccion = (datos.get('direccion') || '').trim();
  const mensaje = (datos.get('mensaje') || '').trim();

  let valido = true;
  for (const campo of ['nombre', 'negocio']) {
    const input = formulario.elements[campo];
    const vacio = !input.value.trim();
    input.classList.toggle('invalido', vacio);
    if (vacio) valido = false;
  }
  if (!valido) {
    aviso.textContent = 'Escribe tu nombre y el de tu negocio para enviar la nota.';
    aviso.classList.add('error');
    return;
  }

  const t = textosInteres[interesActual()];
  const lineas = [t.saludo, `Nombre: ${nombre}`, `Negocio: ${negocio}`];
  if (direccion) lineas.push(`${t.direccion}: ${direccion}`);
  if (mensaje) lineas.push(`Mensaje: ${mensaje}`);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
  aviso.textContent = '¡Listo! Se abrió WhatsApp con tu mensaje.';
});
