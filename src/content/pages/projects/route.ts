import type { PageSlice } from '../../../lib/page-routes';
import { getProjects } from '../../../lib/entries';
import { slugOf } from '../../../lib/ids';
import ProjectsIndex from './ProjectsIndex.astro';
import ProjectDetail from './ProjectDetail.astro';

export default {
  routes: [
    {
      key: 'projects',
      component: ProjectsIndex,
      children: async (locale) => {
        const projects = await getProjects(locale);
        return projects.map((project) => ({
          slug: slugOf(project.id),
          component: ProjectDetail,
          props: { project },
        }));
      },
    },
  ],
} satisfies PageSlice;
