// Upgrade definitions for the shop
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxLevel: number;
  effectPerLevel: number;
  effectType: 'waterBonus' | 'fertilizerSafety' | 'timeReduction' | 'slot' | 'pestProtection';
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'precision-water',
    name: 'Präzisions-Gießen',
    description: 'Erhöht den Wasser-Bonus',
    basePrice: 150,
    maxLevel: 4,
    effectPerLevel: 0.05, // +5% per level
    effectType: 'waterBonus'
  },
  {
    id: 'premium-nutrients',
    name: 'Premium-Nährstoffe',
    description: 'Reduziert Dünger-Malus-Chance',
    basePrice: 250,
    maxLevel: 2,
    effectPerLevel: 0.5, // -50% chance per level
    effectType: 'fertilizerSafety'
  },
  {
    id: 'led-panel',
    name: 'LED-Panel Pro',
    description: 'Verkürzt Wachstumszeit',
    basePrice: 300,
    maxLevel: 3,
    effectPerLevel: 0.1, // -10% time per level
    effectType: 'timeReduction'
  },
  {
    id: 'tent-slot',
    name: 'Smart-Tent Slot',
    description: 'Fügt einen Pflanzenslot hinzu',
    basePrice: 400,
    maxLevel: 4,
    effectPerLevel: 1, // +1 slot per level
    effectType: 'slot'
  },
  {
    id: 'sticky-traps',
    name: 'Sticky Traps',
    description: 'Schützt vor Schädlingen',
    basePrice: 200,
    maxLevel: 1,
    effectPerLevel: 1.0, // Full protection
    effectType: 'pestProtection'
  },
  {
    id: 'auto-drip',
    name: 'Auto-Drip System',
    description: 'Optimiert die Bewaesserung fuer bessere Qualitaet',
    basePrice: 220,
    maxLevel: 3,
    effectPerLevel: 0.04,
    effectType: 'waterBonus'
  },
  {
    id: 'climate-control',
    name: 'Klima-Kontrolle',
    description: 'Stabile Temperaturen verkuerzen die Wachstumszeit',
    basePrice: 350,
    maxLevel: 3,
    effectPerLevel: 0.08,
    effectType: 'timeReduction'
  },
  {
    id: 'bio-shield',
    name: 'Bio-Schild',
    description: 'Natuerlicher Schutz gegen Schaedlinge',
    basePrice: 280,
    maxLevel: 2,
    effectPerLevel: 1.0,
    effectType: 'pestProtection'
  },
  {
    id: 'smart-nutrients',
    name: 'Smart Nutrients',
    description: 'Praezise Naehrstoffgabe reduziert Risiken',
    basePrice: 300,
    maxLevel: 2,
    effectPerLevel: 0.5,
    effectType: 'fertilizerSafety'
  },
  {
    id: 'oscillating-fan',
    name: 'Oszillierender Ventilator',
    description: 'Bessere Luftzirkulation verkuerzt leicht die Zeit',
    basePrice: 80,
    maxLevel: 2,
    effectPerLevel: 0.03,
    effectType: 'timeReduction'
  },
  {
    id: 'watering-can-pro',
    name: 'Pro-Giesskanne',
    description: 'Sattere Bewaesserung erhoeht Qualitaet minimal',
    basePrice: 90,
    maxLevel: 2,
    effectPerLevel: 0.02,
    effectType: 'waterBonus'
  }
];

export const getUpgradePrice = (basePrice: number, currentLevel: number): number => {
  return Math.floor(basePrice * Math.pow(1.5, currentLevel));
};
