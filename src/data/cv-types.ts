export interface Station {
  period: string;
  title: string;
  organisation: string;
  location?: string;
  bullets: string[];
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface LanguageSkill {
  language: string;
  level: string;
}

export interface CV {
  profile: {
    name: string;
    headline: string;
    summary: string;
    email: string;
    location: string;
    linkedin: string;
  };
  experience: Station[];
  skills: SkillGroup[];
  education: Station[];
  languages: LanguageSkill[];
}
