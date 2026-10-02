import publicData from '../../data/ctf/public.json';
import type { Sealed } from './crypto';
import { createCtf, type PublicCtf } from './doors';
import { sessionStore } from './session';

const modules = import.meta.glob<{ default: Sealed }>('../../data/ctf/*.sealed.json', { eager: true });
const sealed = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [path.split('/').pop()!.replace('.sealed.json', ''), module.default]),
);

export const ctf = createCtf(publicData as PublicCtf, sealed, sessionStore());
export const ready = ctf.restore();
