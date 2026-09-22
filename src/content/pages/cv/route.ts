import type { PageSlice } from '../../../lib/page-routes';
import CvGate from './CvGate.astro';

export default { routes: [{ key: 'cv', component: CvGate }] } satisfies PageSlice;
