import type { PageSlice } from '../../../lib/page-routes';
import publicData from '../../../data/ctf/public.json';
import { getCtfHelpPages } from '../../../lib/entries';
import { slugOf } from '../../../lib/ids';
import Ctf from './Ctf.astro';
import DoorPage from './DoorPage.astro';
import HelpPage from './HelpPage.astro';

export default {
  routes: [
    {
      key: 'ctf',
      component: Ctf,
      children: async (locale) => [
        ...publicData.doors.map((door) => ({ slug: door, component: DoorPage, props: { door } })),
        ...(await getCtfHelpPages(locale)).map(({ id }) => ({
          slug: slugOf(id),
          component: HelpPage,
          props: { page: slugOf(id) },
        })),
      ],
    },
  ],
} satisfies PageSlice;
