// Growth phase definitions with timing and action availability
export interface Phase {
  id: string;
  name: string;
  duration: number; // Base duration in seconds
  waterRecommended: boolean;
  fertilizerRecommended: boolean;
  description: string;
}

export const PHASES: Phase[] = [
  {
    id: 'germination',
    name: 'Keimung',
    duration: 10,
    waterRecommended: false,
    fertilizerRecommended: false,
    description: 'Samen keimt und erste Wurzeln bilden sich'
  },
  {
    id: 'seedling',
    name: 'Sämling',
    duration: 20,
    waterRecommended: true,
    fertilizerRecommended: false,
    description: 'Erste echte Blätter entwickeln sich'
  },
  {
    id: 'veg',
    name: 'Vegetativ',
    duration: 30,
    waterRecommended: true,
    fertilizerRecommended: true,
    description: 'Hauptwachstumsphase, Pflanze baut Struktur auf'
  },
  {
    id: 'preflower',
    name: 'Vorblüte',
    duration: 30,
    waterRecommended: false,
    fertilizerRecommended: true,
    description: 'Übergang zur Blütephase beginnt'
  },
  {
    id: 'flower',
    name: 'Blüte',
    duration: 25,
    waterRecommended: true,
    fertilizerRecommended: true,
    description: 'Buds entwickeln sich, Harz-Produktion'
  },
  {
    id: 'harvest',
    name: 'Erntereif',
    duration: 5,
    waterRecommended: false,
    fertilizerRecommended: false,
    description: 'Bereit zur Ernte!'
  }
];

export const getTotalDuration = (timeMultiplier: number = 1.0): number => {
  return PHASES.reduce((sum, phase) => sum + phase.duration, 0) * timeMultiplier;
};
