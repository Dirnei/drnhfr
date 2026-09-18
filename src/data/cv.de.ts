import type { CV } from './cv-types';

export const cvDe: CV = {
  profile: {
    name: 'Christian Dirnhofer',
    headline: 'Softwarearchitekt & Tinkerer',
    summary:
      'PLATZHALTER: Drei bis vier Sätze über Schwerpunkt, Arbeitsweise und was du suchst.',
    email: 'christian@dirnhofer.net',
    location: 'Unterwössen, Bayern',
    linkedin: 'https://www.linkedin.com/in/christian-dirnhofer-a89b4a229/',
  },
  experience: [
    {
      period: 'PLATZHALTER: 2022 – heute',
      title: 'PLATZHALTER: Position',
      organisation: 'PLATZHALTER: Arbeitgeber',
      location: 'PLATZHALTER: Ort',
      bullets: [
        'PLATZHALTER: Ergebnis statt Aufgabe — was wurde messbar besser?',
        'PLATZHALTER: Verantwortungsbereich, Teamgröße, Technologien.',
      ],
    },
  ],
  skills: [
    { label: 'Sprachen', items: ['C#', 'TypeScript', 'SQL'] },
    { label: 'Plattform', items: ['.NET', 'Akka.NET', 'PostgreSQL'] },
    { label: 'Betrieb', items: ['Docker', 'Kubernetes', 'GitHub Actions'] },
  ],
  education: [
    {
      period: 'PLATZHALTER: Zeitraum',
      title: 'PLATZHALTER: Abschluss',
      organisation: 'PLATZHALTER: Einrichtung',
      bullets: [],
    },
  ],
  languages: [
    { language: 'Deutsch', level: 'Muttersprache' },
    { language: 'Englisch', level: 'PLATZHALTER: Niveau' },
  ],
};
