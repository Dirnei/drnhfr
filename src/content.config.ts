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
  }),
});

const yearOrMonth = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "expected YYYY or YYYY-MM");

const projectFacts = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "*/*.json",
    generateId: ({ entry }) => entry.split("/").pop()!.replace(/\.json$/, ""),
  }),
  schema: z.object({
    begin: yearOrMonth,
    end: yearOrMonth.optional(),
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
  meta.extend({
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

const skills = pageCollection(
  "skills",
  listed.extend({
    heading: z.string(),
    intro: z.string(),
    connected: z.string(),
    present: z.string(),
    legend: z.object({
      job: z.string(),
      project: z.string(),
      area: z.string(),
      tech: z.string(),
      related: z.string(),
    }),
    controls: z.object({
      zoomIn: z.string(),
      zoomOut: z.string(),
      reset: z.string(),
      wheelHint: z.string(),
      wheelHintMac: z.string(),
    }),
  }),
);

const ctf = pageCollection(
  "ctf",
  meta.extend({
    heading: z.string(),
    doorTitle: z.string(),
    locked: z.object({
      command: z.string(),
      error: z.string(),
      line: z.string(),
    }),
    mobile: z.string(),
    progress: z.object({
      label: z.string(),
      unknown: z.string(),
    }),
    download: z.string(),
    finishedIn: z.string(),
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
  projectFacts,
  home,
  contact,
  legal,
  cvGate,
  projectsIndex,
  skills,
  ctf,
  notFound,
};
