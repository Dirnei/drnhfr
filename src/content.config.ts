import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    period: z.string(),
    stack: z.array(z.string()).default([]),
    links: z
      .object({
        repo: z.url().optional(),
        docs: z.url().optional(),
        demo: z.url().optional(),
      })
      .default({}),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    translationKey: z.string(),
  }),
});

export const collections = { projects };
