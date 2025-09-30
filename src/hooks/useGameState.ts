import { useState, useEffect, useCallback } from 'react';
import { Strain } from '@/data/strains';

export interface PlantModifiers {
  waterStacks: number;
  fertilizerApplied: boolean;
  soilType: 'basic' | 'light-mix' | 'all-mix';
  lastWaterTime: number;
  lastFertilizerTime: number;
  qualityMultiplier: number;
}

export interface Plant {
  id: string;
  strainId: string;
  phaseIndex: number;
  elapsedInPhase: number;
  plantedAt: number;
  modifiers: PlantModifiers;
}

export interface TradeOffer {
  id: string;
  quantity: number;
  pricePerBud: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  endsAt: number;
  effects: {
    priceMultiplier?: number;
    quantityMultiplier?: number;
    growthMultiplier?: number; // <1 faster growth, >1 slower
  };
}

export type QuestType = 'harvest' | 'sell' | 'water';

export interface Quest {
  id: string;
  type: QuestType;
  description: string;
  goal: number;
  progress: number;
  reward: { nugs?: number; buds?: number };
  claimed: boolean;
}

export interface GameState {
  nugs: number;
  buds: number;
  slots: (Plant | null)[];
  upgrades: Record<string, number>;
  trade: {
    offers: TradeOffer[];
    nextRefreshAt: number;
  };
  event?: GameEvent;
  quests: Quest[];
  stats: {
    totalHarvests: number;
    bestHarvest: number; // in buds
    totalNugsEarned: number;
    totalBudsHarvested: number;
    totalBudsSold: number;
    totalTrades: number;
  };
  settings: {
    sfxEnabled: boolean;
    randomEventsEnabled: boolean;
  };
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'q-h-1',
    type: 'harvest',
    description: 'Ernte 3 Pflanzen',
    goal: 3,
    progress: 0,
    reward: { nugs: 75 },
    claimed: false,
  },
  {
    id: 'q-s-1',
    type: 'sell',
    description: 'Verkaufe 100 Buds',
    goal: 100,
    progress: 0,
    reward: { nugs: 150 },
    claimed: false,
  },
  {
    id: 'q-w-1',
    type: 'water',
    description: 'Gieße 10x',
    goal: 10,
    progress: 0,
    reward: { buds: 20 },
    claimed: false,
  },
];

const INITIAL_STATE: GameState = {
  nugs: 100,
  buds: 0,
  slots: [null, null],
  upgrades: {},
  trade: {
    offers: [],
    nextRefreshAt: 0,
  },
  event: undefined,
  quests: DEFAULT_QUESTS,
  stats: {
    totalHarvests: 0,
    bestHarvest: 0,
    totalNugsEarned: 0,
    totalBudsHarvested: 0,
    totalBudsSold: 0,
    totalTrades: 0,
  },
  settings: {
    sfxEnabled: true,
    randomEventsEnabled: true
  }
};

const STORAGE_KEY = 'cannabis-grower-save';
const AUTOSAVE_INTERVAL = 5000; // 5 seconds

export const useGameState = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Shallow merge to keep compatibility with older saves
        return {
          ...INITIAL_STATE,
          ...parsed,
          stats: { ...INITIAL_STATE.stats, ...(parsed?.stats || {}) },
          trade: { ...INITIAL_STATE.trade, ...(parsed?.trade || {}) },
          quests: parsed?.quests || DEFAULT_QUESTS,
        } as GameState;
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
    return INITIAL_STATE;
  });

  // Autosave
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [state]);

  const manualSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const resetGame = useCallback(() => {
    setState(INITIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addNugs = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      nugs: prev.nugs + amount,
      stats: {
        ...prev.stats,
        totalNugsEarned: prev.stats.totalNugsEarned + Math.max(0, amount)
      }
    }));
  }, []);

  const spendNugs = useCallback((amount: number): boolean => {
    if (state.nugs >= amount) {
      setState(prev => ({ ...prev, nugs: prev.nugs - amount }));
      return true;
    }
    return false;
  }, [state.nugs]);

  const plantSeed = useCallback((slotIndex: number, strainId: string, soilType: PlantModifiers['soilType']) => {
    setState(prev => {
      const newSlots = [...prev.slots];
      newSlots[slotIndex] = {
        id: `plant-${Date.now()}-${slotIndex}`,
        strainId,
        phaseIndex: 0,
        elapsedInPhase: 0,
        plantedAt: Date.now(),
        modifiers: {
          waterStacks: 0,
          fertilizerApplied: false,
          soilType,
          lastWaterTime: 0,
          lastFertilizerTime: 0,
          qualityMultiplier: 1.0
        }
      };
      return { ...prev, slots: newSlots };
    });
  }, []);

  const removePlant = useCallback((slotIndex: number) => {
    setState(prev => {
      const newSlots = [...prev.slots];
      newSlots[slotIndex] = null;
      return { ...prev, slots: newSlots };
    });
  }, []);

  const updatePlant = useCallback((slotIndex: number, updates: Partial<Plant>) => {
    setState(prev => {
      const newSlots = [...prev.slots];
      const plant = newSlots[slotIndex];
      if (plant) {
        newSlots[slotIndex] = { ...plant, ...updates };
      }
      return { ...prev, slots: newSlots };
    });
  }, []);

  const addBuds = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      buds: Math.max(0, prev.buds + amount)
    }));
  }, []);

  const spendBuds = useCallback((amount: number): boolean => {
    if (state.buds >= amount) {
      setState(prev => ({ ...prev, buds: prev.buds - amount }));
      return true;
    }
    return false;
  }, [state.buds]);

  const recordHarvest = useCallback((budsHarvested: number) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalHarvests: prev.stats.totalHarvests + 1,
        bestHarvest: Math.max(prev.stats.bestHarvest, budsHarvested),
        totalBudsHarvested: prev.stats.totalBudsHarvested + budsHarvested,
      },
      quests: prev.quests.map(q =>
        q.type === 'harvest' && !q.claimed
          ? { ...q, progress: Math.min(q.goal, q.progress + 1) }
          : q
      ),
    }));
  }, []);

  const generateTradeOffers = useCallback(() => {
    setState(prev => {
      const stage = Math.floor(prev.stats.totalHarvests / 5);
      const minQtyBase = Math.min(200, 5 + stage * 10);
      const maxQtyBase = Math.min(400, 20 + stage * 20);
      const qMult = prev.event?.effects.quantityMultiplier ?? 1;
      const pMult = prev.event?.effects.priceMultiplier ?? 1;
      const now = Date.now();
      const offers: TradeOffer[] = Array.from({ length: 3 }).map((_, i) => {
        const minQty = Math.floor(minQtyBase * qMult);
        const maxQty = Math.floor(maxQtyBase * qMult);
        const qty = Math.max(minQty, Math.floor(minQty + Math.random() * (Math.max(1, maxQty - minQty + 1))));
        const basePrice = 1 + Math.random() * 2; // 1.0 - 3.0
        const price = Math.min(4, Math.max(1, (basePrice + stage * 0.1) * pMult));
        return {
          id: `offer-${now}-${i}`,
          quantity: qty,
          pricePerBud: Math.round(price * 10) / 10,
        };
      });
      return {
        ...prev,
        trade: {
          offers,
          nextRefreshAt: now + 30000,
        },
      };
    });
  }, []);

  const acceptTradeOffer = useCallback((offerId: string): boolean => {
    let accepted = false;
    setState(prev => {
      const offer = prev.trade.offers.find(o => o.id === offerId);
      if (!offer) return prev;
      if (prev.buds < offer.quantity) return prev;
      accepted = true;
      const revenue = Math.floor(offer.quantity * offer.pricePerBud);
      return {
        ...prev,
        buds: prev.buds - offer.quantity,
        nugs: prev.nugs + revenue,
        stats: {
          ...prev.stats,
          totalNugsEarned: prev.stats.totalNugsEarned + revenue,
          totalBudsSold: prev.stats.totalBudsSold + offer.quantity,
          totalTrades: prev.stats.totalTrades + 1,
        },
        trade: {
          ...prev.trade,
          offers: prev.trade.offers.filter(o => o.id !== offerId),
        },
        quests: prev.quests.map(q =>
          q.type === 'sell' && !q.claimed
            ? { ...q, progress: Math.min(q.goal, q.progress + offer.quantity) }
            : q
        ),
      } as GameState;
    });
    return accepted;
  }, []);

  const haggleTradeOffer = useCallback((offerId: string): boolean => {
    let success = false;
    setState(prev => {
      const idx = prev.trade.offers.findIndex(o => o.id === offerId);
      if (idx === -1) return prev;
      const offers = [...prev.trade.offers];
      const current = offers[idx];
      success = Math.random() < 0.4;
      if (success) {
        const newPrice = Math.round(current.pricePerBud * 1.2 * 10) / 10;
        offers[idx] = { ...current, pricePerBud: Math.min(5, newPrice) };
      } else {
        // Buyer walks away
        offers.splice(idx, 1);
      }
      return {
        ...prev,
        trade: { ...prev.trade, offers },
      };
    });
    return success;
  }, []);

  const claimQuestReward = useCallback((questId: string): boolean => {
    let claimed = false;
    setState(prev => {
      const idx = prev.quests.findIndex(q => q.id === questId);
      if (idx === -1) return prev;
      const quest = prev.quests[idx];
      if (quest.claimed || quest.progress < quest.goal) return prev;
      claimed = true;
      const quests = [...prev.quests];
      quests[idx] = { ...quest, claimed: true };
      return {
        ...prev,
        quests,
        buds: prev.buds + (quest.reward.buds || 0),
        nugs: prev.nugs + (quest.reward.nugs || 0),
      };
    });
    return claimed;
  }, []);

  const recordWaterAction = useCallback((count: number = 1) => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q =>
        q.type === 'water' && !q.claimed
          ? { ...q, progress: Math.min(q.goal, q.progress + count) }
          : q
      ),
    }));
  }, []);

  const triggerRandomEvent = useCallback(() => {
    const presets: Omit<GameEvent, 'endsAt'>[] = [
      {
        id: 'festival',
        name: 'Psychedelic Festival',
        description: 'Euphorische Kundschaft zahlt mehr und kauft mehr.',
        effects: { priceMultiplier: 1.5, quantityMultiplier: 1.2 },
      },
      {
        id: 'mystic-fog',
        name: 'Mystischer Nebel',
        description: 'Wachstum verlangsamt sich etwas.',
        effects: { growthMultiplier: 1.2 },
      },
      {
        id: 'cosmic-alignment',
        name: 'Kosmische Ausrichtung',
        description: 'Kosmische Energien beschleunigen das Wachstum!',
        effects: { growthMultiplier: 0.8 },
      },
      {
        id: 'market-rush',
        name: 'Marktrun',
        description: 'Kurzzeitig höhere Preise.',
        effects: { priceMultiplier: 1.3 },
      },
    ];
    setState(prev => {
      if (!prev.settings.randomEventsEnabled) return prev;
      const pick = presets[Math.floor(Math.random() * presets.length)];
      const now = Date.now();
      return { ...prev, event: { ...pick, endsAt: now + 60000 } };
    });
  }, []);

  const tickEvent = useCallback(() => {
    setState(prev => {
      if (!prev.event) return prev;
      if (Date.now() < prev.event.endsAt) return prev;
      return { ...prev, event: undefined };
    });
  }, []);

  const upgradeLevel = useCallback((upgradeId: string) => {
    setState(prev => ({
      ...prev,
      upgrades: {
        ...prev.upgrades,
        [upgradeId]: (prev.upgrades[upgradeId] || 0) + 1
      }
    }));
  }, []);

  const addSlot = useCallback(() => {
    setState(prev => ({
      ...prev,
      slots: [...prev.slots, null]
    }));
  }, []);

  return {
    state,
    manualSave,
    resetGame,
    addNugs,
    spendNugs,
    addBuds,
    spendBuds,
    plantSeed,
    removePlant,
    updatePlant,
    recordHarvest,
    upgradeLevel,
    addSlot,
    generateTradeOffers,
    acceptTradeOffer,
    haggleTradeOffer,
    claimQuestReward,
    recordWaterAction,
    triggerRandomEvent,
    tickEvent
  };
};
