import techNames from '../data/tech-names.json';
import techIcons from '../data/tech-icons.json';

export type NodeKind = 'job' | 'project' | 'contribution' | 'area' | 'tech';
export type EdgeKind = 'uses' | 'related';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  detail?: string;
  href?: string;
  /** File name in src/assets/tech, for technologies that have a logo. */
  icon?: string;
}

export interface GraphEdge {
  a: string;
  b: string;
  kind: EdgeKind;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphSource {
  jobs: { field: string; organisation: string; start: string; end: string | null; stack: string[] }[];
  projects: { slug: string; title: string; href: string; stack: string[]; contribution?: boolean }[];
  /** Own projects without a project page, such as this site. */
  extraProjects?: { id: string; label: string; href: string; stack: string[] }[];
  areas?: { id: string; label: string; projects?: string[]; stack: string[] }[];
  /** Project slug to technologies it relates to without using them. */
  related?: Record<string, string[]>;
  /** Technology to technologies it goes together with; always drawn as related. */
  pairs?: Record<string, string[]>;
  /** Technologies linked only through their pairs, such as .NET under C# and VB.NET, never to a job or project directly. */
  platforms?: string[];
  present: string;
  projectLabel: string;
  contributionLabel?: string;
  areaLabel?: string;
}

const canonical = new Map<string, string>(
  Object.entries(techNames as Record<string, string[]>).flatMap(([name, variants]) =>
    variants.map((variant): [string, string] => [variant.toLowerCase(), name]),
  ),
);

export function canonicalTech(name: string): string {
  return canonical.get(name.trim().toLowerCase()) ?? name.trim();
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildGraph(source: GraphSource): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const tech = new Map<string, GraphNode>();

  const techNode = (raw: string) => {
    const label = canonicalTech(raw);
    const id = `tech:${slug(label)}`;
    const icon = (techIcons as Record<string, string>)[label];
    if (!tech.has(id)) tech.set(id, { id, kind: 'tech', label, ...(icon ? { icon } : {}) });
    return id;
  };
  const link = (a: string, b: string, kind: EdgeKind) => {
    const known = edges.some((edge) => (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a));
    if (!known && a !== b) edges.push({ a, b, kind });
  };
  const platforms = new Set((source.platforms ?? []).map(canonicalTech));
  const connect = (owner: string, stack: string[], kind: EdgeKind) => {
    for (const raw of stack) {
      if (!platforms.has(canonicalTech(raw))) link(owner, techNode(raw), kind);
    }
  };

  for (const job of source.jobs) {
    const id = `job:${job.start}`;
    const years = `${job.start.slice(0, 4)}–${job.end ? job.end.slice(0, 4) : source.present}`;
    nodes.push({ id, kind: 'job', label: job.field, detail: `${job.organisation} · ${years}` });
    connect(id, job.stack, 'uses');
  }
  for (const project of source.projects) {
    const id = `project:${project.slug}`;
    nodes.push(
      project.contribution
        ? { id, kind: 'contribution', label: project.title, detail: source.contributionLabel, href: project.href }
        : { id, kind: 'project', label: project.title, detail: source.projectLabel, href: project.href },
    );
    connect(id, project.stack, 'uses');
  }
  for (const project of source.extraProjects ?? []) {
    const id = `project:${project.id}`;
    if (nodes.some((node) => node.id === id)) throw new Error(`skill graph: project "${project.id}" exists twice`);
    nodes.push({ id, kind: 'project', label: project.label, detail: source.projectLabel, href: project.href });
    connect(id, project.stack, 'uses');
  }
  for (const area of source.areas ?? []) {
    const id = `area:${area.id}`;
    nodes.push({ id, kind: 'area', label: area.label, detail: source.areaLabel });
    connect(id, area.stack, 'uses');
    for (const project of area.projects ?? []) {
      const target = `project:${project}`;
      if (!nodes.some((node) => node.id === target)) throw new Error(`skill graph: no project "${project}"`);
      link(id, target, 'uses');
    }
  }
  for (const [project, names] of Object.entries(source.related ?? {})) {
    const id = `project:${project}`;
    if (!nodes.some((node) => node.id === id)) throw new Error(`skill graph: no project "${project}"`);
    connect(id, names, 'related');
  }
  for (const [name, others] of Object.entries(source.pairs ?? {})) {
    const from = techNode(name);
    for (const other of others) link(from, techNode(other), 'related');
  }

  return { nodes: [...nodes, ...[...tech.values()].sort((a, b) => a.label.localeCompare(b.label))], edges };
}

export function neighbours(graph: Graph, id: string): string[] {
  return graph.edges.flatMap((edge) => (edge.a === id ? [edge.b] : edge.b === id ? [edge.a] : []));
}

const CHAR_WIDTH = 0.6;
export const LABEL_GAP = 6;
const PADDING = 12;

const MAX_GROWTH = 10;
const MIN_LOGO = 14;

/** Grows with every line attached, so the hubs stand out whatever their kind. A logo never shrinks below legible. */
export function nodeSize(graph: Graph, node: GraphNode): number {
  const size = 6 + 2 * Math.min(MAX_GROWTH, neighbours(graph, node.id).length);
  return node.icon ? Math.max(MIN_LOGO, size) : size;
}

export function labelWidth(node: GraphNode, fontSize: number): number {
  const longest = Math.max(node.label.length, node.detail?.length ?? 0);
  return longest * fontSize * CHAR_WIDTH;
}

function labelHeight(node: GraphNode, fontSize: number): number {
  return fontSize * (node.detail ? 2.5 : 1.4);
}

/** Positions plus what the forces need; shared by the build layout and the live page. */
export interface Sim {
  xs: number[];
  ys: number[];
  sizes: number[];
  labels: number[];
  heights: number[];
  links: [number, number][];
  k: number;
  cx: number;
  cy: number;
  aspect: number;
}

export function createSim(input: {
  xs: number[];
  ys: number[];
  sizes: number[];
  labels: number[];
  heights: number[];
  links: [number, number][];
  width: number;
  height: number;
}): Sim {
  const count = input.xs.length;
  return {
    ...input,
    k: Math.sqrt((input.width * input.height) / count) * 0.75,
    cx: input.width / 2,
    cy: input.height / 2,
    aspect: input.width / input.height,
  };
}

export function boxOf(sim: Sim, i: number) {
  return {
    left: sim.xs[i] - sim.sizes[i] / 2 - 2,
    right: sim.xs[i] + sim.sizes[i] / 2 + LABEL_GAP + sim.labels[i] + 2,
    top: sim.ys[i] - sim.heights[i] / 2,
    bottom: sim.ys[i] + sim.heights[i] / 2,
  };
}

/** One Fruchterman-Reingold step. */
export function relax(sim: Sim, temperature: number): void {
  const { xs, ys, k } = sim;
  const count = xs.length;
  const dx = new Array<number>(count).fill(0);
  const dy = new Array<number>(count).fill(0);
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const ox = xs[i] - xs[j];
      const oy = ys[i] - ys[j];
      const distance = Math.max(1, Math.hypot(ox, oy));
      const force = (k * k) / distance;
      dx[i] += (ox / distance) * force;
      dy[i] += (oy / distance) * force;
      dx[j] -= (ox / distance) * force;
      dy[j] -= (oy / distance) * force;
    }
  }
  for (const [i, j] of sim.links) {
    const ox = xs[i] - xs[j];
    const oy = ys[i] - ys[j];
    const distance = Math.max(1, Math.hypot(ox, oy));
    const force = (distance * distance) / k;
    dx[i] -= (ox / distance) * force;
    dy[i] -= (oy / distance) * force;
    dx[j] += (ox / distance) * force;
    dy[j] += (oy / distance) * force;
  }
  for (let i = 0; i < count; i += 1) {
    dx[i] += (sim.cx - xs[i]) * 0.02 * k;
    dy[i] += (sim.cy - ys[i]) * 0.02 * k * sim.aspect;
    const length = Math.max(1, Math.hypot(dx[i], dy[i]));
    const step = Math.min(length, temperature);
    xs[i] += (dx[i] / length) * step;
    ys[i] += (dy[i] / length) * step;
  }
}

/** Pushes overlapping label boxes apart. Returns whether anything moved. */
export function separate(sim: Sim): boolean {
  let moved = false;
  const count = sim.xs.length;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const a = boxOf(sim, i);
      const b = boxOf(sim, j);
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapX <= 0 || overlapY <= 0) continue;
      moved = true;
      if (overlapY < overlapX) {
        const push = overlapY / 2 + 0.5;
        const sign = sim.ys[i] < sim.ys[j] || (sim.ys[i] === sim.ys[j] && i < j) ? -1 : 1;
        sim.ys[i] += sign * push;
        sim.ys[j] -= sign * push;
      } else {
        const push = overlapX / 2 + 0.5;
        const sign = (a.left + a.right) / 2 < (b.left + b.right) / 2 ? -1 : 1;
        sim.xs[i] += sign * push;
        sim.xs[j] -= sign * push;
      }
    }
  }
  return moved;
}

/** The two canvases the page draws: one for desktop, one tall one for phones. */
export const LAYOUTS = [
  { name: 'wide', width: 1000, height: 640 },
  { name: 'tall', width: 420, height: 1100 },
] as const;

export interface LayoutOptions {
  width: number;
  height: number;
  fontSize: number;
  seed?: number;
  iterations?: number;
}

export interface PlacedNode {
  id: string;
  x: number;
  y: number;
  size: number;
  labelWidth: number;
  height: number;
  /** The node square plus its label, which sits to the right of it. */
  box: { left: number; right: number; top: number; bottom: number };
}

/** Mulberry32: the same seed gives the same layout on every build. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutGraph(graph: Graph, options: LayoutOptions): PlacedNode[] {
  const { width, height, fontSize, seed = 7, iterations = 600 } = options;
  const rand = random(seed);
  const count = graph.nodes.length;
  const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
  const sizes = graph.nodes.map((node) => nodeSize(graph, node));
  const sim = createSim({
    xs: graph.nodes.map((_, i) => width / 2 + Math.cos(i * 2.39996) * (width / 3) * Math.sqrt((i + 1) / count) + rand() * 4),
    ys: graph.nodes.map((_, i) => height / 2 + Math.sin(i * 2.39996) * (height / 3) * Math.sqrt((i + 1) / count) + rand() * 4),
    sizes,
    labels: graph.nodes.map((node) => labelWidth(node, fontSize)),
    heights: graph.nodes.map((node, i) => Math.max(labelHeight(node, fontSize), sizes[i])),
    links: graph.edges.map((edge): [number, number] => [index.get(edge.a)!, index.get(edge.b)!]),
    width,
    height,
  });

  const clampAll = () => {
    for (let i = 0; i < count; i += 1) {
      sim.xs[i] = Math.min(width - PADDING - sim.labels[i] - LABEL_GAP - sim.sizes[i] / 2, Math.max(PADDING + sim.sizes[i] / 2, sim.xs[i]));
      sim.ys[i] = Math.min(height - PADDING - sim.heights[i] / 2, Math.max(PADDING + sim.heights[i] / 2, sim.ys[i]));
    }
  };

  for (let step = 0; step < iterations; step += 1) {
    relax(sim, (Math.min(width, height) / 8) * (1 - step / iterations));
    clampAll();
  }
  for (let pass = 0; pass < 400; pass += 1) {
    const moved = separate(sim);
    clampAll();
    if (!moved) break;
  }

  return graph.nodes.map((node, i) => ({
    id: node.id,
    x: Math.round(sim.xs[i] * 10) / 10,
    y: Math.round(sim.ys[i] * 10) / 10,
    size: sim.sizes[i],
    labelWidth: sim.labels[i],
    height: sim.heights[i],
    box: boxOf(sim, i),
  }));
}

/** Live dragging: springs at their current length plus a weak pull home, damped so nothing jitters. */
export interface SpringState {
  xs: number[];
  ys: number[];
  vx: number[];
  vy: number[];
  anchorX: number[];
  anchorY: number[];
  sizes: number[];
  labels: number[];
  heights: number[];
  springs: { a: number; b: number; rest: number }[];
  /** Number of lines per node: a hub is heavier, so a dozen springs cannot whip it around. */
  mass: number[];
  held: number;
}

const EDGE_STIFFNESS = 0.06;
const ANCHOR_STIFFNESS = 0.015;
const DAMPING = 0.72;
const COLLISION_SHARE = 0.2;
/**
 * Positions are rounded for the HTML, so the last fraction of a pixel never counts as a collision.
 * The push is measured from this edge, so it starts at zero instead of jumping in and chattering.
 */
const COLLISION_SLOP = 0.5;

export function createSprings(sim: Pick<Sim, 'xs' | 'ys' | 'sizes' | 'labels' | 'heights' | 'links'>): SpringState {
  const xs = [...sim.xs];
  const ys = [...sim.ys];
  return {
    xs,
    ys,
    vx: xs.map(() => 0),
    vy: ys.map(() => 0),
    anchorX: [...xs],
    anchorY: [...ys],
    sizes: sim.sizes,
    labels: sim.labels,
    heights: sim.heights,
    springs: sim.links.map(([a, b]) => ({ a, b, rest: Math.hypot(xs[a] - xs[b], ys[a] - ys[b]) })),
    mass: xs.map((_, i) => Math.max(1, sim.links.filter(([a, b]) => a === i || b === i).length)),
    held: -1,
  };
}

/** Makes the current positions the resting state, so a fresh drag starts from calm. */
export function settleHere(state: SpringState): void {
  state.anchorX = [...state.xs];
  state.anchorY = [...state.ys];
  for (const spring of state.springs) {
    spring.rest = Math.hypot(state.xs[spring.a] - state.xs[spring.b], state.ys[spring.a] - state.ys[spring.b]);
  }
  state.vx.fill(0);
  state.vy.fill(0);
}

/** One frame. Returns the fastest node's speed, so the caller knows when to stop. */
export function springStep(state: SpringState): number {
  const { xs, ys, vx, vy } = state;
  const count = xs.length;
  const fx = new Array<number>(count).fill(0);
  const fy = new Array<number>(count).fill(0);

  for (const { a, b, rest } of state.springs) {
    const ox = xs[b] - xs[a];
    const oy = ys[b] - ys[a];
    const distance = Math.max(0.01, Math.hypot(ox, oy));
    const pull = (distance - rest) * EDGE_STIFFNESS;
    fx[a] += (ox / distance) * pull;
    fy[a] += (oy / distance) * pull;
    fx[b] -= (ox / distance) * pull;
    fy[b] -= (oy / distance) * pull;
  }
  for (let i = 0; i < count; i += 1) {
    fx[i] += (state.anchorX[i] - xs[i]) * ANCHOR_STIFFNESS;
    fy[i] += (state.anchorY[i] - ys[i]) * ANCHOR_STIFFNESS;
  }
  const box = (i: number) => ({
    left: xs[i] - state.sizes[i] / 2 - 2,
    right: xs[i] + state.sizes[i] / 2 + LABEL_GAP + state.labels[i] + 2,
    top: ys[i] - state.heights[i] / 2,
    bottom: ys[i] + state.heights[i] / 2,
  });
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const p = box(i);
      const q = box(j);
      const overlapX = Math.min(p.right, q.right) - Math.max(p.left, q.left);
      const overlapY = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
      if (overlapX <= COLLISION_SLOP || overlapY <= COLLISION_SLOP) continue;
      if (overlapY < overlapX) {
        const push = (overlapY - COLLISION_SLOP) * COLLISION_SHARE * (ys[i] < ys[j] ? -1 : 1);
        fy[i] += push;
        fy[j] -= push;
      } else {
        const push = (overlapX - COLLISION_SLOP) * COLLISION_SHARE * ((p.left + p.right) / 2 < (q.left + q.right) / 2 ? -1 : 1);
        fx[i] += push;
        fx[j] -= push;
      }
    }
  }

  let fastest = 0;
  for (let i = 0; i < count; i += 1) {
    if (i === state.held) {
      vx[i] = 0;
      vy[i] = 0;
      continue;
    }
    vx[i] = (vx[i] + fx[i] / state.mass[i]) * DAMPING;
    vy[i] = (vy[i] + fy[i] / state.mass[i]) * DAMPING;
    if (Math.abs(vx[i]) < 0.005) vx[i] = 0;
    if (Math.abs(vy[i]) < 0.005) vy[i] = 0;
    xs[i] += vx[i];
    ys[i] += vy[i];
    fastest = Math.max(fastest, Math.hypot(vx[i], vy[i]));
  }
  return fastest;
}
