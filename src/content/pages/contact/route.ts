import type { PageSlice } from '../../../lib/page-routes';
import Contact from './Contact.astro';

export default { routes: [{ key: 'contact', component: Contact }] } satisfies PageSlice;
