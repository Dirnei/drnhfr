import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import cv from '../src/data/cv.json';
import { skillExtrasFor } from '../src/data/skill-extras';
import {
  buildGraph,
  canonicalTech,
  createSprings,
  layoutGraph,
  LAYOUTS,
  neighbours,
  nodeSize,
  settleHere,
  springStep,
  type GraphSource,
} from '../src/lib/skill-graph';

function realSource(): GraphSource {
  const projects = readdirSync('src/content/projects').map((slug) => {
    const md = readFileSync(`src/content/projects/${slug}/${slug}.en.md`, 'utf8');
    const title = md.match(/^title: '?(.*?)'?\r?$/m)![1];
    const facts = JSON.parse(readFileSync(`src/content/projects/${slug}/${slug}.json`, 'utf8'));
    return { slug, title, href: `/en/projects/${slug}/`, stack: facts.stack as string[] };
  });
  return {
    jobs: cv.experience.map((job) => ({
      field: job.field.en,
      organisation: job.organisation,
      start: job.start,
      end: job.end,
      stack: job.stack,
    })),
    projects,
    ...skillExtrasFor('en'),
    present: 'today',
    projectLabel: 'Own project',
    areaLabel: 'Private',
  };
}

const tiny: GraphSource = {
  jobs: [
    { field: 'Warehouse', organisation: 'Acme SE', start: '2020-04', end: '2025-01', stack: ['C#', '.NET 8', 'MQTT'] },
    { field: 'Lights', organisation: 'Lux GmbH', start: '2017-01', end: null, stack: ['.NET 3.5', 'C#'] },
  ],
  projects: [{ slug: 'dartomat', title: 'Dartomat', href: '/en/projects/dartomat/', stack: ['MQTT'] }],
  present: 'today',
  projectLabel: 'Own project',
};

describe('the skill graph', () => {
  it('merges name variants into one technology', () => {
    expect(canonicalTech('.NET 8')).toBe('.NET');
    expect(canonicalTech('java (vaadin)')).toBe('Java');
    expect(canonicalTech('MQTT')).toBe('MQTT');
  });

  it('links every job and project to its technologies, once', () => {
    const graph = buildGraph(tiny);
    expect(graph.nodes.filter((node) => node.kind === 'tech').map((node) => node.label)).toEqual([
      '.NET',
      'C#',
      'MQTT',
    ]);
    expect(neighbours(graph, 'tech:mqtt').sort()).toEqual(['job:2020-04', 'project:dartomat']);
    expect(neighbours(graph, 'job:2020-04')).toHaveLength(3);
  });

  it('adds private areas and marks related-but-unused links', () => {
    const graph = buildGraph(realSource());
    expect(graph.nodes.find((node) => node.id === 'area:homelab')?.detail).toBe('Private');
    expect(neighbours(graph, 'area:homelab')).toContain('tech:ansible');
    const printing = graph.edges.find((edge) => edge.a === 'project:homeracker' && edge.b === 'tech:3d-printing');
    expect(printing?.kind).toBe('related');
    const extras = skillExtrasFor('en');
    const declared = Object.values(extras.related).flat().length;
    const viaPlatforms = extras.platforms.flatMap((platform) => extras.pairs[platform] ?? []).length;
    expect(graph.edges.filter((edge) => edge.kind === 'related')).toHaveLength(declared + viaPlatforms);
  });

  it('links technologies that are used together', () => {
    const graph = buildGraph(realSource());
    const pi = neighbours(graph, 'tech:raspberry-pi').sort();
    expect(pi).toEqual(
      ['area:homelab', 'area:workshop', 'project:dartomat', 'tech:ansible', 'tech:docker', 'tech:mqtt'].sort(),
    );
    const piEdges = graph.edges.filter((edge) => edge.a === 'tech:raspberry-pi' || edge.b === 'tech:raspberry-pi');
    expect(piEdges).toHaveLength(pi.length);
    expect(neighbours(graph, 'tech:co2-laser')).toEqual(expect.arrayContaining(['tech:svg', 'tech:cad']));
    const german = buildGraph({ ...realSource(), ...skillExtrasFor('de') });
    expect(neighbours(german, 'tech:co2-laser')).toEqual(expect.arrayContaining(['tech:svg', 'tech:cad']));
  });

  it('links a project to the area it belongs to', () => {
    const graph = buildGraph(realSource());
    expect(neighbours(graph, 'project:e3dc')).toEqual(expect.arrayContaining(['area:homelab', 'tech:nuget']));
    expect(() =>
      buildGraph({ ...tiny, areas: [{ id: 'lab', label: 'Lab', projects: ['nope'], stack: ['MQTT'] }] }),
    ).toThrow(/nope/);
  });

  it('includes own projects that have no page, linked per language', () => {
    const english = buildGraph(realSource());
    const site = english.nodes.find((node) => node.id === 'project:website')!;
    expect(site.label).toBe('dirnhofer.net');
    expect(site.href).toBe('/en/');
    expect(neighbours(english, 'project:website')).toEqual(expect.arrayContaining(['tech:astro', 'tech:typescript']));
    const german = buildGraph({ ...realSource(), ...skillExtrasFor('de') });
    expect(german.nodes.find((node) => node.id === 'project:website')!.href).toBe('/de/');
    expect(() =>
      buildGraph({ ...tiny, extraProjects: [{ id: 'dartomat', label: 'Twin', href: '/', stack: ['MQTT'] }] }),
    ).toThrow(/twice/);
  });

  it('links a platform only to the languages on it', () => {
    const graph = buildGraph(realSource());
    expect(neighbours(graph, 'tech:net').sort()).toEqual(['tech:asp-net', 'tech:c', 'tech:uwp', 'tech:vb-net', 'tech:winforms', 'tech:wpf']);
    const platformLines = graph.edges.filter((edge) => edge.a === 'tech:net' || edge.b === 'tech:net');
    expect(platformLines.every((edge) => edge.kind === 'related')).toBe(true);
    expect(neighbours(graph, 'tech:uwp')).toContain('project:dartomat');
    expect(neighbours(graph, 'tech:wpf')).toContain('job:2018-01');
    const tinyGraph = buildGraph({ ...tiny, platforms: ['.NET'], pairs: { '.NET': ['C#'] } });
    expect(neighbours(tinyGraph, 'tech:net')).toEqual(['tech:c']);
    expect(neighbours(tinyGraph, 'job:2020-04')).not.toContain('tech:net');
  });

  it('refuses a related link to a project that does not exist', () => {
    expect(() => buildGraph({ ...tiny, related: { nope: ['MQTT'] } })).toThrow(/nope/);
  });

  it('labels jobs by field, with the company and years underneath', () => {
    const graph = buildGraph(tiny);
    const jobs = graph.nodes.filter((node) => node.kind === 'job');
    expect(jobs.map((job) => [job.label, job.detail])).toEqual([
      ['Warehouse', 'Acme SE · 2020–2025'],
      ['Lights', 'Lux GmbH · 2017–today'],
    ]);
  });

  it('sizes every node by how many lines it has', () => {
    const graph = buildGraph(realSource());
    const size = (id: string) => nodeSize(graph, graph.nodes.find((node) => node.id === id)!);
    const degree = (id: string) => neighbours(graph, id).length;
    const byId = (id: string) => graph.nodes.find((node) => node.id === id)!;
    const ids = graph.nodes.map((node) => node.id);
    for (const a of ids) {
      for (const b of ids) {
        const sameKind = Boolean(byId(a).icon) === Boolean(byId(b).icon);
        if (sameKind && degree(a) > degree(b)) expect(size(a), `${a} vs ${b}`).toBeGreaterThanOrEqual(size(b));
      }
    }
    expect(size('job:2020-04')).toBeGreaterThan(size('project:edict'));
  });

  it('gives technologies with a logo their file, and keeps logos legible', () => {
    const graph = buildGraph(realSource());
    const node = (id: string) => graph.nodes.find((each) => each.id === id)!;
    expect(node('tech:docker').icon).toBe('docker');
    expect(node('tech:c').icon).toBe('csharp');
    expect(node('tech:asyncapi').icon).toBeUndefined();
    for (const each of graph.nodes.filter((n) => n.icon)) {
      expect(nodeSize(graph, each), each.id).toBeGreaterThanOrEqual(14);
      expect(existsSync(`src/assets/tech/${each.icon}.svg`), each.icon).toBe(true);
    }
  });

  for (const { width, height } of LAYOUTS) {
    it(`lays the real data out in ${width}x${height} without overlaps or spill`, () => {
      const graph = buildGraph(realSource());
      const placed = layoutGraph(graph, { width, height, fontSize: 13 });
      expect(placed).toHaveLength(graph.nodes.length);
      for (const node of placed) {
        expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
        expect(node.box.left).toBeGreaterThanOrEqual(0);
        expect(node.box.top).toBeGreaterThanOrEqual(0);
        expect(node.box.right).toBeLessThanOrEqual(width);
        expect(node.box.bottom).toBeLessThanOrEqual(height);
      }
      for (let i = 0; i < placed.length; i += 1) {
        for (let j = i + 1; j < placed.length; j += 1) {
          const a = placed[i].box;
          const b = placed[j].box;
          const overlap =
            Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
            Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
          expect(overlap, `${placed[i].id} / ${placed[j].id}`).toBe(false);
        }
      }
    });
  }

  it('gives the same layout on every build', () => {
    const graph = buildGraph(realSource());
    const first = layoutGraph(graph, { width: 1000, height: 640, fontSize: 13 });
    const second = layoutGraph(graph, { width: 1000, height: 640, fontSize: 13 });
    expect(second).toEqual(first);
  });
});

describe('dragging a node', () => {
  const springsFromLayout = () => {
    const graph = buildGraph(realSource());
    const placed = layoutGraph(graph, { width: 1000, height: 640, fontSize: 13 });
    const index = new Map(graph.nodes.map((node, i) => [node.id, i]));
    const state = createSprings({
      xs: placed.map((node) => node.x),
      ys: placed.map((node) => node.y),
      sizes: placed.map((node) => node.size),
      labels: placed.map((node) => node.labelWidth),
      heights: placed.map((node) => node.height),
      links: graph.edges.map((edge): [number, number] => [index.get(edge.a)!, index.get(edge.b)!]),
    });
    return { graph, state, index };
  };

  it('leaves the built layout perfectly still', () => {
    const { state } = springsFromLayout();
    const before = [...state.xs, ...state.ys];
    let fastest = 0;
    for (let frame = 0; frame < 300; frame += 1) fastest = Math.max(fastest, springStep(state));
    expect(fastest).toBe(0);
    expect([...state.xs, ...state.ys]).toEqual(before);
  });

  it('pulls neighbours along smoothly instead of jittering', () => {
    const { graph, state, index } = springsFromLayout();
    const held = index.get('area:homelab')!;
    settleHere(state);
    state.held = held;
    const watched = graph.nodes.map((_, i) => i).filter((i) => i !== held);
    const paths = watched.map(() => 0);
    const starts = watched.map((i) => [state.xs[i], state.ys[i]]);
    const reversals = watched.map(() => 0);
    const lastStep = watched.map(() => [0, 0]);
    for (let frame = 0; frame < 120; frame += 1) {
      if (frame < 30) state.xs[held] += 4;
      const before = watched.map((i) => [state.xs[i], state.ys[i]]);
      springStep(state);
      watched.forEach((i, w) => {
        const dx = state.xs[i] - before[w][0];
        const dy = state.ys[i] - before[w][1];
        paths[w] += Math.hypot(dx, dy);
        const [px, py] = lastStep[w];
        if (Math.hypot(dx, dy) > 0.05 && Math.hypot(px, py) > 0.05 && dx * px + dy * py < 0) reversals[w] += 1;
        lastStep[w] = [dx, dy];
      });
    }
    const ansible = watched.indexOf(index.get('tech:ansible')!);
    const moved = Math.hypot(state.xs[index.get('tech:ansible')!] - starts[ansible][0], state.ys[index.get('tech:ansible')!] - starts[ansible][1]);
    expect(moved).toBeGreaterThan(20);
    watched.forEach((i, w) => {
      expect(reversals[w], graph.nodes[i].id).toBeLessThanOrEqual(2);
    });
  });
});
