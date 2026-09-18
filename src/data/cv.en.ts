import type { CV } from './cv-types';

export const cvEn: CV = {
  profile: {
    name: 'Christian Dirnhofer',
    headline: 'Software Architect & Tinkerer',
    summary:
      'PLACEHOLDER: Three to four sentences on focus, working style, and what you are looking for.',
    email: 'christian@dirnhofer.net',
    location: 'Unterwössen, Bavaria, Germany',
    linkedin: 'https://www.linkedin.com/in/christian-dirnhofer-a89b4a229/',
  },
  experience: [
    {
      period: 'PLACEHOLDER: 2022 – present',
      title: 'PLACEHOLDER: Position',
      organisation: 'PLACEHOLDER: Employer',
      location: 'PLACEHOLDER: Location',
      bullets: [
        'PLACEHOLDER: Outcome, not task — what measurably improved?',
        'PLACEHOLDER: Scope of responsibility, team size, technologies.',
      ],
    },
  ],
  skills: [
    { label: 'Languages', items: ['C#', 'TypeScript', 'SQL'] },
    { label: 'Platform', items: ['.NET', 'Akka.NET', 'PostgreSQL'] },
    { label: 'Operations', items: ['Docker', 'Kubernetes', 'GitHub Actions'] },
  ],
  education: [
    {
      period: 'PLACEHOLDER: Period',
      title: 'PLACEHOLDER: Degree',
      organisation: 'PLACEHOLDER: Institution',
      bullets: [],
    },
  ],
  languages: [
    { language: 'German', level: 'Native' },
    { language: 'English', level: 'PLACEHOLDER: Proficiency level' },
  ],
};
