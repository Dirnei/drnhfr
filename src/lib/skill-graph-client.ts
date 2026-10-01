import { createSprings, LABEL_GAP, settleHere, springStep } from './skill-graph';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const TAP_SLOP = 4;

interface GraphHandlers {
  onTap(id: string): void;
  onBackground(): void;
  /** A plain wheel turn over the graph: the page scrolls, and the visitor may not know how to zoom. */
  onPlainWheel(): void;
}

export interface GraphControls {
  zoom(factor: number): void;
  /** Zoom and pan only, like the browser's own Ctrl+0; dragged nodes stay put. */
  resetView(): void;
  reset(): void;
}

interface Pointer {
  x: number;
  y: number;
}

export function attachGraph(svg: SVGSVGElement, handlers: GraphHandlers): GraphControls {
  const viewport = svg.querySelector<SVGGElement>('.viewport')!;
  const nodeEls = [...svg.querySelectorAll<SVGGElement>('[data-node]')];
  const edgeEls = [...svg.querySelectorAll<SVGLineElement>('.edges line')];
  const font = Number(svg.dataset.font);
  const [, , width, height] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  const index = new Map(nodeEls.map((el, i) => [el.dataset.node!, i]));
  const num = (el: SVGGElement, key: string) => Number(el.dataset[key]);

  const home = () => ({ xs: nodeEls.map((el) => num(el, 'x')), ys: nodeEls.map((el) => num(el, 'y')) });
  const sim = createSprings({
    ...home(),
    sizes: nodeEls.map((el) => num(el, 'size')),
    labels: nodeEls.map((el) => num(el, 'w')),
    heights: nodeEls.map((el) => num(el, 'h')),
    links: edgeEls.map((el): [number, number] => [index.get(el.dataset.a!)!, index.get(el.dataset.b!)!]),
  });
  const edgeEnds = edgeEls.map((el) => [index.get(el.dataset.a!)!, index.get(el.dataset.b!)!]);

  const parts = nodeEls.map((el) => ({
    rect: el.querySelector('rect')!,
    logo: el.querySelector('use'),
    label: el.querySelector<SVGTextElement>('text.label')!,
    detail: el.querySelector<SVGTextElement>('text.detail'),
  }));

  const render = () => {
    parts.forEach(({ rect, logo, label, detail }, i) => {
      const x = sim.xs[i];
      const y = sim.ys[i];
      const size = sim.sizes[i];
      for (const square of logo ? [rect, logo] : [rect]) {
        square.setAttribute('x', String(x - size / 2));
        square.setAttribute('y', String(y - size / 2));
      }
      const textX = String(x + size / 2 + LABEL_GAP);
      label.setAttribute('x', textX);
      label.setAttribute('y', String(detail ? y - font * 0.6 : y));
      if (detail) {
        detail.setAttribute('x', textX);
        detail.setAttribute('y', String(y + font * 0.65));
      }
    });
    edgeEls.forEach((el, e) => {
      const [a, b] = edgeEnds[e];
      el.setAttribute('x1', String(sim.xs[a]));
      el.setAttribute('y1', String(sim.ys[a]));
      el.setAttribute('x2', String(sim.xs[b]));
      el.setAttribute('y2', String(sim.ys[b]));
    });
  };

  const view = { k: 1, x: 0, y: 0 };
  const applyView = () => {
    viewport.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.k})`);
    svg.classList.toggle('zoomed', view.k > 1.001);
  };

  const toSvg = (clientX: number, clientY: number) => {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const toGraph = (clientX: number, clientY: number) => {
    const p = toSvg(clientX, clientY);
    return { x: (p.x - view.x) / view.k, y: (p.y - view.y) / view.k };
  };
  const zoomAt = (p: { x: number; y: number }, factor: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    view.x = p.x - (p.x - view.x) * (next / view.k);
    view.y = p.y - (p.y - view.y) * (next / view.k);
    view.k = next;
    applyView();
  };

  let running = false;

  const tick = () => {
    const fastest = springStep(sim);
    render();
    if (sim.held !== -1 || fastest > 0.05) {
      requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };
  const wake = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  const pointers = new Map<number, Pointer>();
  let gesture:
    | { type: 'node'; node: number; start: Pointer; moved: boolean }
    | { type: 'pan'; start: Pointer; last: Pointer; moved: boolean }
    | { type: 'pinch'; distance: number }
    | null = null;

  const pinchDistance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  svg.addEventListener('pointerdown', (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      if (sim.held !== -1) release(sim.held);
      gesture = { type: 'pinch', distance: pinchDistance() };
      return;
    }
    const nodeEl = (event.target as Element).closest<SVGGElement>('[data-node]');
    const start = { x: event.clientX, y: event.clientY };
    if (nodeEl) {
      gesture = { type: 'node', node: index.get(nodeEl.dataset.node!)!, start, moved: false };
    } else if (event.pointerType === 'mouse' || view.k > 1.001) {
      gesture = { type: 'pan', start, last: start, moved: false };
    } else {
      gesture = null;
      return;
    }
    svg.setPointerCapture(event.pointerId);
  });

  svg.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (!gesture) return;
    if (gesture.type === 'pinch') {
      if (pointers.size < 2) return;
      const distance = pinchDistance();
      const [a, b] = [...pointers.values()];
      zoomAt(toSvg((a.x + b.x) / 2, (a.y + b.y) / 2), distance / gesture.distance);
      gesture.distance = distance;
      return;
    }
    const travelled = Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y);
    if (!gesture.moved && travelled < TAP_SLOP) return;
    if (gesture.type === 'node') {
      if (!gesture.moved) {
        gesture.moved = true;
        settleHere(sim);
        sim.held = gesture.node;
      }
      const p = toGraph(event.clientX, event.clientY);
      sim.xs[gesture.node] = p.x;
      sim.ys[gesture.node] = p.y;
      wake();
    } else {
      gesture.moved = true;
      const from = toSvg(gesture.last.x, gesture.last.y);
      const to = toSvg(event.clientX, event.clientY);
      view.x += to.x - from.x;
      view.y += to.y - from.y;
      gesture.last = { x: event.clientX, y: event.clientY };
      applyView();
    }
  });

  /** The dropped node stays where it was let go; the rest eases out around it. */
  const release = (node: number) => {
    sim.anchorX[node] = sim.xs[node];
    sim.anchorY[node] = sim.ys[node];
    sim.held = -1;
    wake();
  };

  const finish = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (!gesture) return;
    if (gesture.type === 'pinch') {
      if (pointers.size === 0) gesture = null;
      return;
    }
    if (event.type === 'pointerup' && !gesture.moved) {
      if (gesture.type === 'node') handlers.onTap(nodeEls[gesture.node].dataset.node!);
      else handlers.onBackground();
    }
    if (gesture.type === 'node' && sim.held === gesture.node) release(gesture.node);
    gesture = null;
  };
  svg.addEventListener('pointerup', finish);
  svg.addEventListener('pointercancel', finish);

  svg.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        handlers.onPlainWheel();
        return;
      }
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 30 : 1;
      zoomAt(toSvg(event.clientX, event.clientY), Math.exp((-event.deltaY * scale) / 300));
    },
    { passive: false },
  );

  return {
    zoom(factor) {
      zoomAt({ x: width / 2, y: height / 2 }, factor);
    },
    resetView() {
      view.k = 1;
      view.x = 0;
      view.y = 0;
      applyView();
    },
    reset() {
      const { xs, ys } = home();
      sim.xs.splice(0, xs.length, ...xs);
      sim.ys.splice(0, ys.length, ...ys);
      sim.held = -1;
      settleHere(sim);
      view.k = 1;
      view.x = 0;
      view.y = 0;
      render();
      applyView();
    },
  };
}
