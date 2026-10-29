import { CARS, STOPS, usd } from './stops.js';

// Builds every overlay from data/cars.js with createElement/textContent only (never innerHTML),
// so nothing in the data can turn into markup or script.
const D = window.CARS;
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('data-')) n.setAttribute(k, v);
    else n[k] = v;
  }
  kids.flat().filter(Boolean).forEach((k) => n.append(k));
  return n;
};
const two = (n) => String(n).padStart(2, '0');
const name = (c) => `${c.year} Volkswagen ${c.model} ${c.trim}`;
const fine = (c) => {
  const q = c.ifQualify.length ? ` ${c.ifQualify.map((x) => x.label).join(' and ')} savings are shown separately and require program eligibility.` : '';
  return `Savings are off MSRP as listed on midlandsvw.com as of ${D.asOf} for stock #${c.stock} (VIN ${c.vin}). `
    + `Total savings = ${c.discounts.map((d) => `${d.label} ${usd(d.amount)}`).join(' + ')}.${q} `
    + `Retail Customer Bonus ends ${D.bonusEnds}. Excludes tax, tag, title and dealer fees. Subject to prior sale. See dealer for complete details.`;
};

export function buildChapters() {
  const max = Math.max(...CARS.map((c) => c.total));
  document.getElementById('home-lede').textContent =
    `${CARS.length} new Volkswagens on the lot right now, with up to ${usd(max)} off MSRP. Every number comes from the car's own listing. Drive the lot and meet them.`;
  document.getElementById('visit-note').textContent =
    `Savings shown are off MSRP as listed on midlandsvw.com on ${D.asOf} and can change. Retail Customer Bonus ends ${D.bonusEnds}. Excludes tax, tag, title and fees. Subject to prior sale.`;

  const lot = document.getElementById('lot');
  CARS.forEach((c, i) => {
    const chips = c.highlights.slice(0, 4).map((h) => el('li', { text: h }));
    if (c.allNew) chips.unshift(el('li', { class: 'new', text: `All-new ${c.year}` }));
    lot.append(el('section', { class: 'chapter', id: c.id, 'data-stop': c.id, ariaLabel: name(c) },
      el('p', { class: 'eyebrow', text: `${two(i + 1)} / ${c.year} ${c.model.toUpperCase()}` }),
      el('img', { class: 'still', src: c.photos[c.hero], alt: name(c), loading: 'lazy', width: 640, height: 480 }),
      el('h2', {}, el('span', { class: 'line' }, 'Save ', el('span', { class: 'save', text: usd(c.total) })), el('span', { class: 'line', text: 'off MSRP.' })),
      el('p', { class: 'lede', text: `${name(c)} in ${c.exterior}. ${usd(c.discounts[0].amount)} dealer discount plus a ${usd(c.discounts[1].amount)} Retail Customer Bonus.` }),
      el('ul', { class: 'chips' }, chips),
      el('div', { class: 'actions' },
        el('button', { class: 'btn', type: 'button', 'data-detail': c.id, text: c.video ? 'Video & highlights' : 'Photos & highlights' }),
        el('a', { class: 'btn ghost', href: c.url, target: '_blank', rel: 'noopener noreferrer', text: 'See the listing' })),
      el('p', { class: 'note', text: `STOCK ${c.stock} · AS LISTED ${D.asOf} · BONUS ENDS ${D.bonusEnds}` })));
  });
}

export function buildCarousel(go) {
  const strip = document.getElementById('car-strip');
  const cards = CARS.map((c, i) => {
    const b = el('button', { class: 'car-card', type: 'button', ariaLabel: `${name(c)}, save ${usd(c.total)}` },
      el('img', { src: c.photos[c.hero], alt: '', loading: 'lazy', width: 640, height: 480 }),
      el('b', {}, el('small', { text: `SAVE ${usd(c.total)}` }), `${c.model} ${c.trim}`));
    b.addEventListener('click', () => go(c.id));
    strip.append(el('li', {}, b));
    return b;
  });
  const carousel = document.getElementById('carousel');
  carousel.querySelector('.prev').addEventListener('click', () => go(-1));
  carousel.querySelector('.next').addEventListener('click', () => go(1));
  let current = null;
  return (id) => {
    if (id === current) return;
    current = id;
    cards.forEach((b, i) => {
      const on = CARS[i].id === id;
      b.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) b.parentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  };
}

export function createDetail({ onOpen, onClose }) {
  const panel = document.getElementById('detail');
  const media = document.getElementById('detail-media');
  const viewer = document.getElementById('viewer');
  const viewerImg = document.getElementById('viewer-img');
  let openId = null;

  const showPhoto = (src, alt) => { viewerImg.src = src; viewerImg.alt = alt; viewer.showModal(); };
  document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => viewerImg.removeAttribute('src'));

  function fill(c) {
    document.getElementById('detail-eyebrow').textContent = `${c.year} VOLKSWAGEN · STOCK ${c.stock}`;
    document.getElementById('detail-h').textContent = `${c.model} ${c.trim}`;
    media.replaceChildren();
    media.classList.toggle('photo', !c.video);
    if (c.video) {
      media.append(el('video', { src: c.video, poster: c.poster || c.photos[c.hero], controls: true, playsInline: true, preload: 'metadata' }));
    } else {
      media.append(el('img', { src: c.photos[c.hero], alt: name(c) }), el('span', { class: 'soon', text: 'VIDEO COMING SOON' }));
    }
    document.getElementById('detail-gallery').replaceChildren(...c.photos.map((src, i) => {
      const b = el('button', { type: 'button', ariaLabel: `Photo ${i + 1} of ${c.photos.length}` }, el('img', { src, alt: '', loading: 'lazy' }));
      b.addEventListener('click', () => showPhoto(src, `${name(c)}, photo ${i + 1}`));
      return b;
    }));
    const max = Math.max(...c.discounts.map((d) => d.amount));
    document.getElementById('detail-stack').replaceChildren(
      ...c.discounts.map((d) => {
        const bar = el('i');
        bar.style.setProperty('--w', String(d.amount / max));
        return el('div', { class: 'row' }, el('div', {}, d.label, el('b', { text: usd(d.amount) })), el('div', { class: 'bar' }, bar));
      }),
      el('div', { class: 'total' }, el('span', { text: 'TOTAL SAVINGS' }), el('div', {}, el('b', { text: usd(c.total) }), el('small', { text: 'OFF MSRP' }))));
    const q = document.getElementById('detail-qualify');
    q.replaceChildren(...(c.ifQualify.length
      ? [el('h3', { text: 'Even more if you qualify' }), el('div', { class: 'qualify' }, c.ifQualify.map((x) => el('div', {}, el('b', { text: `+${usd(x.amount)}` }), el('span', { text: x.label }))))]
      : [el('h3', { text: 'Ask about current offers' })]));
    document.getElementById('detail-spec').replaceChildren(...[`${c.exterior} exterior`, ...c.highlights].map((h) => el('li', { text: h })));
    document.getElementById('detail-listing').href = c.url;
    document.getElementById('detail-fine').textContent = fine(c);
  }

  function open(id) {
    const c = CARS.find((x) => x.id === id);
    if (!c) return;
    if (openId !== id) fill(c);
    openId = id;
    panel.hidden = false;
    panel.scrollTop = 0;
    requestAnimationFrame(() => panel.classList.add('open'));
    document.body.classList.add('detail-open');
    onOpen(c);
  }
  function close() {
    if (!openId) return;
    const v = media.querySelector('video');
    if (v) v.pause();
    panel.classList.remove('open');
    document.body.classList.remove('detail-open');
    openId = null;
    setTimeout(() => { if (!openId) panel.hidden = true; }, 450);
    onClose();
  }
  document.getElementById('detail-close').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && openId && !viewer.open) close(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-detail]');
    if (b) open(b.getAttribute('data-detail'));
  });
  return { open, close, isOpen: () => !!openId, openId: () => openId };
}

export { STOPS };
