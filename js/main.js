// POPS & CO — interacción de la página

// Número de WhatsApp que recibe los mensajes del formulario.
// Formato: 52 + 10 dígitos, sin espacios ni signos. Ejemplo: '526391234567'
// PENDIENTE: poner el número real.
const WHATSAPP = '';

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

// Aparecer al hacer scroll
const animables = document.querySelectorAll('.titulo, .sabor, .paso, .negocios__cierre, .nosotros__texto, .datos li, .contacto__texto, .formulario');
if ('IntersectionObserver' in window) {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visible');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });
  animables.forEach((el, i) => {
    el.classList.add('aparece');
    el.style.transitionDelay = `${(i % 5) * 60}ms`;
    observador.observe(el);
  });
}

// Formulario → WhatsApp
const formulario = document.getElementById('formulario');
const aviso = document.getElementById('formulario-aviso');

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

  const lineas = [
    '¡Hola, POPS & CO! Me interesa vender sus palomitas en mi negocio.',
    `Nombre: ${nombre}`,
    `Negocio: ${negocio}`,
  ];
  if (direccion) lineas.push(`Dirección: ${direccion}`);
  if (mensaje) lineas.push(`Mensaje: ${mensaje}`);

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lineas.join('\n'))}`;
  window.open(url, '_blank', 'noopener');
  aviso.textContent = '¡Listo! Se abrió WhatsApp con tu mensaje.';
});
