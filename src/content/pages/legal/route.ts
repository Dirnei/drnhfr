import type { PageSlice } from '../../../lib/page-routes';
import Legal from './Legal.astro';

export default {
  routes: [
    { key: 'imprint', component: Legal, props: { page: 'imprint' } },
    { key: 'privacy', component: Legal, props: { page: 'privacy' } },
  ],
} satisfies PageSlice;
