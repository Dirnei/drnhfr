import { ctf, ready } from './client';
import { pick } from './paths';

function render() {
  const lang = document.documentElement.lang;
  const opened = new Map(ctf.opened().map(({ door, payload }) => [door, payload]));

  const menu = document.getElementById('nav-ctf');
  if (menu) menu.hidden = opened.size === 0;
  let here = false;
  document.querySelectorAll<HTMLElement>('[data-ctf-nav]').forEach((item) => {
    const payload = opened.get(item.dataset.ctfNav ?? '');
    const link = item.querySelector('a');
    const locked = item.querySelector<HTMLElement>('.ctf-locked');
    if (!link || !locked) return;
    link.hidden = !payload;
    locked.hidden = Boolean(payload);
    if (!payload) return;
    link.textContent = pick(payload.title, lang);
    const current = window.location.pathname === link.getAttribute('href');
    link.classList.toggle('on', current);
    if (current) link.setAttribute('aria-current', 'page');
    here ||= current;
  });
  document.querySelector('.ctf-toggle')?.classList.toggle('on', here);

  document.querySelectorAll<HTMLElement>('[data-ctf-progress]').forEach((row) => {
    const count = row.querySelector('[data-ctf-count]');
    if (count) count.textContent = String(opened.size);
    row.querySelectorAll<HTMLElement>('[data-ctf-door]').forEach((item) => {
      const payload = opened.get(item.dataset.ctfDoor ?? '');
      const link = item.querySelector('a');
      if (!link) return;
      item.toggleAttribute('data-open', Boolean(payload));
      link.hidden = !payload;
      link.textContent = payload ? pick(payload.title, lang) : '';
    });
  });
}

function setupMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('.ctf-toggle');
  const panel = document.getElementById('ctf-panel');
  if (!toggle || !panel) return;
  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !toggle.parentElement?.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  panel.querySelectorAll<HTMLElement>('.ctf-locked').forEach((button) => {
    button.addEventListener('click', () => {
      const flash = button.nextElementSibling;
      if (!(flash instanceof HTMLElement)) return;
      flash.classList.remove('show');
      void flash.offsetWidth;
      flash.classList.add('show');
    });
  });
  panel.querySelectorAll<HTMLElement>('.ctf-flash').forEach((flash) => {
    flash.addEventListener('animationend', () => flash.classList.remove('show'));
  });
}

setupMenu();
ctf.onChange(render);
void ready.then(render);
