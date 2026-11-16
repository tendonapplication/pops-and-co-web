// POPS & CO — interacción de la página

// Número de WhatsApp que recibe los mensajes del formulario.
// Formato: 52 + 10 dígitos, sin espacios ni signos.
const WHATSAPP = '526695059646'; // 669 505 9646

// Año en el pie de página
document.getElementById('anio').textContent = new Date().getFullYear();

// Sombra del encabezado al bajar
const encabezado = document.getElementById('encabezado');
const revisarSombra = () => encabezado.classList.toggle('con-sombra', window.scrollY > 8);
window.addEventListener('scroll', revisarSombra, { passive: true });
revisarSombra();

// Menú en celular
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

// Aparecer al hacer scroll (con distintas entradas según el elemento)
const sinMovimientoTemprano = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Títulos: se parten en palabras que suben una por una
document.querySelectorAll('main h2').forEach((h) => {
  const palabras = h.textContent.trim().split(' ');
  h.setAttribute('aria-label', h.textContent.trim());
  h.innerHTML = palabras.map((p, i) =>
    `<span class="palabra" aria-hidden="true"><span style="transition-delay:${i * 70}ms">${p}</span></span>`).join(' ');
  h.classList.add('titulo-anim');
});

const variantes = [
  ['main h2', null],
  ['.vitrina__escenario', 'zoom'],
  ['.paso', 'cortina'],
  ['.ventajas li', 'cortina'],
  ['.datos li', 'desde-izq'],
  ['.formulario', 'desde-der'],
  ['.caja', null],
  ['.titulo > p, .vitrina__tabs, .vitrina__detalle, .estante, .negocios__cierre, .nosotros__texto p, .contacto__texto p, .distribuidores__intro', ''],
];
if ('IntersectionObserver' in window && !sinMovimientoTemprano) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  variantes.forEach(([selector, tipo]) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      if (tipo !== null) {
        el.classList.add('aparece');
        if (tipo) el.classList.add(tipo);
        el.style.transitionDelay = `${(i % 5) * 90}ms`;
      }
      observador.observe(el);
    });
  });
} else {
  document.querySelectorAll('.titulo-anim, .caja').forEach((el) => el.classList.add('visible'));
}

// Números que cuentan hacia arriba (5 sabores, 140 g)
document.querySelectorAll('.datos strong').forEach((el) => {
  const m = el.textContent.match(/^(\d+)(.*)$/s);
  if (!m || sinMovimientoTemprano || !('IntersectionObserver' in window)) return;
  const final = parseInt(m[1], 10);
  const resto = m[2];
  el.textContent = `0${resto}`;
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    const inicio = performance.now();
    const paso = (t) => {
      const k = Math.min((t - inicio) / 1200, 1);
      el.textContent = `${Math.round(final * (1 - Math.pow(1 - k, 3)))}${resto}`;
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }, { threshold: 0.6 }).observe(el);
});

// Barra de progreso al bajar
const progreso = document.getElementById('progreso');
const medirAvance = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progreso.style.setProperty('--avance', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
};
window.addEventListener('scroll', medirAvance, { passive: true });
window.addEventListener('resize', medirAvance);
medirAvance();

const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Portada: las bolsas caen al cargar y todo se mueve un poco con el ratón
const portada = document.getElementById('inicio');
if (!sinMovimiento) {
  requestAnimationFrame(() => portada.classList.add('cargada'));
  if (conRaton) {
    const capas = portada.querySelectorAll('[data-prof]');
    let pendiente = false;
    portada.addEventListener('pointermove', (e) => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        const r = portada.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        capas.forEach((c) => {
          const p = parseFloat(c.dataset.prof);
          c.style.transform = `translate(${x * p * -24}px, ${y * p * -18}px)`;
        });
        pendiente = false;
      });
    });
    portada.addEventListener('pointerleave', () => capas.forEach((c) => { c.style.transform = ''; }));
  }
}

// Vitrina de sabores
const vitrina = document.getElementById('vitrina');
const bolsa = document.getElementById('vitrina-bolsa');
const giro = document.getElementById('giro');
const escenario = document.getElementById('escenario');
const estallido = document.getElementById('estallido');
const detalle = document.getElementById('detalle');
const tabs = [...document.querySelectorAll('.sabor-tab')];
let actual = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
let cambiando = false;

tabs.forEach((t) => {
  t.style.setProperty('--c', t.dataset.color);
  const img = new Image();            // precargar todas las bolsas
  img.src = `assets/img/bolsas/${t.dataset.sabor}.webp`;
});

function reventar() {
  if (sinMovimiento) return;
  for (let i = 0; i < 9; i++) {
    const p = document.createElement('img');
    p.src = `assets/img/palomitas/palomita-${(i % 4) + 1}.webp`;
    p.alt = '';
    estallido.appendChild(p);
    const ang = (-90 + (Math.random() - 0.5) * 150) * Math.PI / 180;
    const dist = 120 + Math.random() * 120;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist;
    const tam = 0.6 + Math.random() * 0.7;
    p.animate([
      { transform: `translate(0, 40px) scale(${tam * 0.3}) rotate(0deg)`, opacity: 0 },
      { transform: `translate(${dx * 0.6}px, ${dy * 0.8}px) scale(${tam}) rotate(${Math.random() * 180}deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy + 160}px) scale(${tam}) rotate(${Math.random() * 360}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
  }
}

async function elegir(i, desdeUsuario = false) {
  if (i === actual || cambiando) return;
  cambiando = true;
  if (desdeUsuario) detenerAuto();
  const tab = tabs[i];
  tabs.forEach((t, n) => {
    t.setAttribute('aria-selected', String(n === i));
    t.tabIndex = n === i ? 0 : -1;
  });
  vitrina.style.setProperty('--color', tab.dataset.color);

  const direccion = i > actual ? 1 : -1;
  let salida = null;
  if (!sinMovimiento) {
    salida = bolsa.animate(
      [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-60 * direccion}px) rotate(${-10 * direccion}deg) scale(.9)`, opacity: 0 }],
      { duration: 220, easing: 'ease-in', fill: 'forwards' });
    await salida.finished;
  }
  bolsa.src = `assets/img/bolsas/${tab.dataset.sabor}.webp`;
  bolsa.alt = `Bolsa de palomitas POPS & CO sabor ${tab.dataset.nombre}, 140 g`;
  document.getElementById('detalle-nombre').textContent = tab.dataset.nombre;
  document.getElementById('detalle-desc').textContent = tab.dataset.desc;
  detalle.classList.remove('cambia'); void detalle.offsetWidth; detalle.classList.add('cambia');

  if (!sinMovimiento) {
    salida.cancel();
    bolsa.animate(
      [{ transform: `translateX(${70 * direccion}px) translateY(-30px) rotate(${12 * direccion}deg) scale(.9)`, opacity: 0 },
       { transform: 'none', opacity: 1 }],
      { duration: 650, easing: 'cubic-bezier(.2,1.5,.4,1)' });
    setTimeout(reventar, 220);
  }
  actual = i;
  cambiando = false;
}

tabs.forEach((t, i) => {
  t.tabIndex = i === actual ? 0 : -1;
  t.addEventListener('click', () => elegir(i, true));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (actual + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    elegir(n, true);
    tabs[n].focus();
  });
});
escenario.addEventListener('click', () => { detenerAuto(); reventar(); });

// Inclinar la bolsa siguiendo el ratón
if (conRaton && !sinMovimiento) {
  escenario.addEventListener('pointermove', (e) => {
    const r = escenario.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    giro.style.transform = `rotateY(${x * 22}deg) rotateX(${y * -12}deg)`;
  });
  escenario.addEventListener('pointerleave', () => { giro.style.transform = ''; });
}

// Cambio automático de sabor mientras la vitrina está a la vista
let reloj = null;
let autoActivo = !sinMovimiento;
function detenerAuto() { autoActivo = false; clearInterval(reloj); }
if (autoActivo && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entrada]) => {
    clearInterval(reloj);
    if (entrada.isIntersecting && autoActivo) {
      reloj = setInterval(() => elegir((actual + 1) % tabs.length), 4500);
    }
  }, { threshold: 0.4 }).observe(vitrina);
}

// Formulario → WhatsApp
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
    aviso.textContent = 'Por favor escribe tu nombre y el de tu negocio.';
    aviso.classList.add('error');
    return;
  }

  if (!WHATSAPP) {
    aviso.textContent = 'Muy pronto podrás escribirnos desde aquí.';
    aviso.classList.add('error');
    return;
  }

  const t = textosInteres[interesActual()];
  const lineas = [
    t.saludo,
    `Nombre: ${nombre}`,
    `Negocio: ${negocio}`,
  ];
  if (direccion) lineas.push(`${t.direccion}: ${direccion}`);
  if (mensaje) lineas.push(`Mensaje: ${mensaje}`);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
  aviso.textContent = '¡Listo! Se abrió WhatsApp con tu mensaje.';
});
