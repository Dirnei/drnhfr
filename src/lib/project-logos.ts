import type { ImageMetadata } from 'astro';
import edict from '../assets/projects/edict.png';
import gaudiballz from '../assets/projects/gaudiballz.png';
import homeracker from '../assets/projects/homeracker.png';
import servus from '../assets/projects/servus.png';

interface ProjectLogo {
  src: ImageMetadata;
  tile: 'light' | 'dark';
}

export const projectLogos: Record<string, ProjectLogo> = {
  edict: { src: edict, tile: 'light' },
  gaudiballz: { src: gaudiballz, tile: 'dark' },
  homeracker: { src: homeracker, tile: 'light' },
  servus: { src: servus, tile: 'light' },
};
