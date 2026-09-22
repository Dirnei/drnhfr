import type { ImageMetadata } from 'astro';

interface ProjectLogo {
  src: ImageMetadata;
  tile: 'light' | 'dark';
}

type LogoModules = Record<string, { default: ImageMetadata }>;

const light: LogoModules = import.meta.glob('../content/projects/*/*.light.png', {
  eager: true,
});
const dark: LogoModules = import.meta.glob('../content/projects/*/*.dark.png', {
  eager: true,
});

function collect(modules: LogoModules, tile: 'light' | 'dark'): [string, ProjectLogo][] {
  return Object.entries(modules).map(([path, module]) => {
    const slug = path.split('/').at(-2);
    if (!slug) throw new Error(`Unexpected project logo path: ${path}`);
    return [slug, { src: module.default, tile }];
  });
}

export const projectLogos: Record<string, ProjectLogo> = Object.fromEntries([
  ...collect(light, 'light'),
  ...collect(dark, 'dark'),
]);
