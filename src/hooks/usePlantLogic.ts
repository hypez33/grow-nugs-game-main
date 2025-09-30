import { useCallback } from 'react';
import { Plant, PlantModifiers } from './useGameState';
import { PHASES } from '@/data/phases';
import { STRAINS, getRarityMultiplier } from '@/data/strains';

const WATER_COST = 5;
const FERTILIZER_COST = 15;
const WATER_COOLDOWN = 15000; // 15 seconds
const FERTILIZER_COOLDOWN = 20000; // 20 seconds

export interface PlantAction {
  canPerform: boolean;
  reason?: string;
  cost: number;
  cooldownRemainingMs?: number;
  cooldownTotalMs?: number;
}

export const usePlantLogic = (upgrades: Record<string, number>, growthMultiplier: number = 1) => {
  const getStrain = useCallback((strainId: string) => {
    return STRAINS.find(s => s.id === strainId);
  }, []);

  const getCurrentPhase = useCallback((plant: Plant) => {
    return PHASES[plant.phaseIndex];
  }, []);

  const canWater = useCallback((plant: Plant, nugs: number): PlantAction => {
    const now = Date.now();
    const total = WATER_COOLDOWN;
    const cooldownRemaining = plant.modifiers.lastWaterTime + total - now;
    
    if (cooldownRemaining > 0) {
      return {
        canPerform: false,
        reason: `Cooldown: ${Math.ceil(cooldownRemaining / 1000)}s`,
        cost: WATER_COST,
        cooldownRemainingMs: cooldownRemaining,
        cooldownTotalMs: total,
      };
    }
    
    if (nugs < WATER_COST) {
      return {
        canPerform: false,
        reason: 'Nicht genug Nugs',
        cost: WATER_COST,
        cooldownRemainingMs: 0,
        cooldownTotalMs: total,
      };
    }

    if (plant.modifiers.waterStacks >= 5) {
      return {
        canPerform: false,
        reason: 'Max. Wasser erreicht',
        cost: WATER_COST,
        cooldownRemainingMs: 0,
        cooldownTotalMs: total,
      };
    }

    return { canPerform: true, cost: WATER_COST, cooldownRemainingMs: 0, cooldownTotalMs: total };
  }, []);

  const canFertilize = useCallback((plant: Plant, nugs: number): PlantAction => {
    const now = Date.now();
    const cooldownRemaining = plant.modifiers.lastFertilizerTime + FERTILIZER_COOLDOWN - now;
    
    if (cooldownRemaining > 0) {
      return {
        canPerform: false,
        reason: `Cooldown: ${Math.ceil(cooldownRemaining / 1000)}s`,
        cost: FERTILIZER_COST
      };
    }
    
    if (nugs < FERTILIZER_COST) {
      return {
        canPerform: false,
        reason: 'Nicht genug Nugs',
        cost: FERTILIZER_COST
      };
    }

    if (plant.modifiers.fertilizerApplied) {
      return {
        canPerform: false,
        reason: 'Bereits gedüngt',
        cost: FERTILIZER_COST
      };
    }

    return { canPerform: true, cost: FERTILIZER_COST };
  }, []);

  const applyWater = useCallback((plant: Plant, isPerfect?: boolean): PlantModifiers => {
    const phase = PHASES[plant.phaseIndex];
    const waterBonusLevels =
      (upgrades['precision-water'] || 0) * 0.05 +
      (upgrades['auto-drip'] || 0) * 0.04 +
      (upgrades['watering-can-pro'] || 0) * 0.02;
    const waterBonus = 1 + waterBonusLevels;
    let qualityChange = 0;

    if (phase.waterRecommended) {
      // Positive effect in recommended phases
      qualityChange = 0.1 * waterBonus + (isPerfect ? 0.05 : 0);
    } else {
      // Negative effect (overwatering)
      qualityChange = -0.05 + (isPerfect ? 0.02 : 0);
    }

    return {
      ...plant.modifiers,
      waterStacks: Math.min(5, plant.modifiers.waterStacks + 1),
      lastWaterTime: Date.now(),
      qualityMultiplier: Math.max(0.5, plant.modifiers.qualityMultiplier + qualityChange)
    };
  }, [upgrades]);

  const applyFertilizer = useCallback((plant: Plant): PlantModifiers => {
    const phase = PHASES[plant.phaseIndex];
    const strain = getStrain(plant.strainId);
    if (!strain) return plant.modifiers;

    const safetyBonus = ((upgrades['premium-nutrients'] || 0) * 0.5) + ((upgrades['smart-nutrients'] || 0) * 0.5);
    let qualityChange = 0;

    if (phase.fertilizerRecommended) {
      // Positive effect
      qualityChange = 0.15;
      
      // Check for negative effect based on sensitivity
      const malusChance = Math.max(0, Math.min(1, strain.nutrientSensitivity * (1 - safetyBonus)));
      if (Math.random() < malusChance) {
        qualityChange = -0.1;
      }
    } else {
      // Wrong phase
      qualityChange = -0.05;
    }

    return {
      ...plant.modifiers,
      fertilizerApplied: true,
      lastFertilizerTime: Date.now(),
      qualityMultiplier: Math.max(0.5, plant.modifiers.qualityMultiplier + qualityChange)
    };
  }, [getStrain, upgrades]);

  const calculateHarvest = useCallback((plant: Plant): number => {
    const strain = getStrain(plant.strainId);
    if (!strain) return 0;

    // Base yield
    let yield_ = strain.baseYield;

    // Rarity multiplier
    yield_ *= getRarityMultiplier(strain.rarity);

    // Quality from actions
    yield_ *= plant.modifiers.qualityMultiplier;

    // Soil bonus
    switch (plant.modifiers.soilType) {
      case 'light-mix':
        yield_ *= 1.05;
        break;
      case 'all-mix':
        yield_ *= 1.15;
        break;
    }

    // Water stacks bonus (capped)
    const waterBonus = Math.min(0.25, plant.modifiers.waterStacks * 0.05);
    yield_ *= (1 + waterBonus);

    // Random variance ±10%
    yield_ *= 0.9 + Math.random() * 0.2;

    return Math.floor(yield_);
  }, [getStrain]);

  const getTimeMultiplier = useCallback((strainId: string): number => {
    const strain = getStrain(strainId);
    if (!strain) return 1.0;

    let multiplier = strain.baseTimeMultiplier;

    // LED upgrade reduces time
    const ledLevel = upgrades['led-panel'] || 0;
    const climateLevel = upgrades['climate-control'] || 0;
    const fanLevel = upgrades['oscillating-fan'] || 0;
    const reduction = (ledLevel * 0.1) + (climateLevel * 0.08) + (fanLevel * 0.03);
    multiplier *= (1 - reduction);

    // Global growth multiplier from events
    multiplier *= growthMultiplier;

    return Math.max(0.5, multiplier); // Min 50% of base time
  }, [getStrain, upgrades, growthMultiplier]);

  return {
    canWater,
    canFertilize,
    applyWater,
    applyFertilizer,
    calculateHarvest,
    getCurrentPhase,
    getTimeMultiplier,
    getStrain
  };
};
