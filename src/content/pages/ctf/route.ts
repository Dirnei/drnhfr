import type { PageSlice } from '../../../lib/page-routes';
import publicData from '../../../data/ctf/public.json';
import Ctf from './Ctf.astro';
import DoorPage from './DoorPage.astro';

export default {
  routes: [
    {
      key: 'ctf',
      component: Ctf,
      children: async () =>
        publicData.doors.map((door) => ({ slug: door, component: DoorPage, props: { door } })),
    },
  ],
} satisfies PageSlice;
