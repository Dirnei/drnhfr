import type { PageSlice } from '../../../lib/page-routes';
import Home from './Home.astro';

export default { routes: [{ key: 'home', component: Home }] } satisfies PageSlice;
