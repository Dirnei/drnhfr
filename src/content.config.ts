import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const localised = (base: string, pattern = "*.{de,en}.md") =>
  glob({
    base,
    pattern,
    generateId: ({ entry }) => entry.split("/").pop()!.replace(/\.md$/, ""),
  });

const projects = defineCollection({
  loader: localised("./src/content/projects", "*/*.{de,en}.md"),
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
  }),
});

const pageCollection = <S extends z.ZodType>(dir: string, schema: S) =>
  defineCollection({
    loader: localised(`./src/content/pages/${dir}`),
    schema,
  });

const meta = z.object({
  title: z.string(),
  description: z.string(),
});

const listed = meta.extend({
  search: z.object({ title: z.string(), description: z.string() }),
});

const home = pageCollection(
  "home",
  listed.extend({
    kicker: z.string(),
    headline: z.array(z.string()).min(1),
    headlineDelay: z.number().default(0),
    sub: z.array(z.string()).min(1),
  }),
);

const contact = pageCollection(
  "contact",
  listed.extend({
    heading: z.string(),
    aboutHeading: z.string(),
    labels: z.object({
      email: z.string(),
      linkedin: z.string(),
      github: z.string(),
    }),
  }),
);

const legal = pageCollection(
  "legal",
  listed.extend({
    heading: z.string(),
    notice: z
      .object({ before: z.string(), after: z.string() })
      .optional(),
  }),
);

const cvGate = pageCollection(
  "cv",
  meta.extend({
    command: z.string(),
    error: z.string(),
  }),
);

const projectsIndex = pageCollection(
  "projects",
  listed.extend({
    heading: z.string(),
    empty: z.string(),
  }),
);

const notFound = pageCollection(
  "notfound",
  z.object({
    description: z.string(),
    heading: z.string(),
    line: z.string(),
    linkText: z.string(),
  }),
);

export const collections = {
  projects,
  home,
  contact,
  legal,
  cvGate,
  projectsIndex,
  notFound,
};
