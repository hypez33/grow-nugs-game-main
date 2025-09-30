import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plant } from '@/hooks/useGameState';
import { usePlantLogic } from '@/hooks/usePlantLogic';
import { PHASES } from '@/data/phases';
import { Droplets, Sprout, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import phase images
import germinationImg from '@/assets/phases/germination.png';
import seedlingImg from '@/assets/phases/seedling.png';
import vegImg from '@/assets/phases/veg.png';
import preflowerImg from '@/assets/phases/preflower.png';
import flowerImg from '@/assets/phases/flower.png';
import harvestImg from '@/assets/phases/harvest.png';

const PHASE_IMAGES = [
  germinationImg,
  seedlingImg,
  vegImg,
  preflowerImg,
  flowerImg,
  harvestImg
];

interface PlantSlotProps {
  plant: Plant | null;
  slotIndex: number;
  nugs: number;
  upgrades: Record<string, number>;
  onPlant: (slotIndex: number) => void;
  onWater: (slotIndex: number) => void;
  onFertilize: (slotIndex: number) => void;
  onHarvest: (slotIndex: number) => void;
  onUpdate: (slotIndex: number, elapsed: number, phaseIndex: number) => void;
}

export const PlantSlot = ({
  plant,
  slotIndex,
  nugs,
  upgrades,
  onPlant,
  onWater,
  onFertilize,
  onHarvest,
  onUpdate
}: PlantSlotProps) => {
  const logic = usePlantLogic(upgrades);
  const [localElapsed, setLocalElapsed] = useState(plant?.elapsedInPhase || 0);

  useEffect(() => {
    if (!plant) return;

    const interval = setInterval(() => {
      const strain = logic.getStrain(plant.strainId);
      if (!strain) return;

      const timeMultiplier = logic.getTimeMultiplier(plant.strainId);
      const soilMultiplier = plant.modifiers.soilType === 'light-mix' ? 0.9 : 1.0;
      const currentPhase = PHASES[plant.phaseIndex];
      const phaseDuration = currentPhase.duration * timeMultiplier * soilMultiplier;

      const newElapsed = localElapsed + 1;
      setLocalElapsed(newElapsed);

      if (newElapsed >= phaseDuration) {
        const nextPhase = plant.phaseIndex + 1;
        if (nextPhase < PHASES.length) {
          onUpdate(slotIndex, 0, nextPhase);
          setLocalElapsed(0);
        }
      } else {
        onUpdate(slotIndex, newElapsed, plant.phaseIndex);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [plant, localElapsed, logic, slotIndex, onUpdate]);

  if (!plant) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all cursor-pointer group">
        <div
          onClick={() => onPlant(slotIndex)}
          className="flex flex-col items-center justify-center h-64 text-muted-foreground group-hover:text-primary transition-colors"
        >
          <Sprout className="w-12 h-12 mb-2" />
          <p className="text-sm">Leerer Slot</p>
          <p className="text-xs mt-1">Klicke zum Pflanzen</p>
        </div>
      </Card>
    );
  }

  const strain = logic.getStrain(plant.strainId);
  if (!strain) return null;

  const currentPhase = PHASES[plant.phaseIndex];
  const timeMultiplier = logic.getTimeMultiplier(plant.strainId);
  const soilMultiplier = plant.modifiers.soilType === 'light-mix' ? 0.9 : 1.0;
  const phaseDuration = currentPhase.duration * timeMultiplier * soilMultiplier;
  const progress = (localElapsed / phaseDuration) * 100;
  
  const isHarvestReady = plant.phaseIndex === PHASES.length - 1 && progress >= 100;
  const waterAction = logic.canWater(plant, nugs);
  const fertAction = logic.canFertilize(plant, nugs);
  const waterTotal = waterAction.cooldownTotalMs ?? 15000;
  const waterRemaining = Math.max(0, waterAction.cooldownRemainingMs ?? 0);
  const waterLevel = Math.max(0, Math.min(100, Math.round((waterRemaining / (waterTotal || 1)) * 100)));
  const waterSecs = Math.ceil(waterRemaining / 1000);

  return (
    <Card className="p-4 bg-card/80 backdrop-blur border-border overflow-hidden">
      {/* Phase Image */}
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-muted/20">
        <img
          src={PHASE_IMAGES[plant.phaseIndex]}
          alt={currentPhase.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <h3 className="font-bold text-foreground">{strain.name}</h3>
          <p className="text-sm text-muted-foreground">{currentPhase.name}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{Math.floor(localElapsed)}s / {Math.floor(phaseDuration)}s</span>
          <span>Phase {plant.phaseIndex + 1}/6</span>
        </div>
        <Progress value={Math.min(100, progress)} className="h-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-muted/30 rounded p-2">
          <p className="text-muted-foreground">Qualität</p>
          <p className="font-semibold text-primary">
            {(plant.modifiers.qualityMultiplier * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-muted/30 rounded p-2">
          <p className="text-muted-foreground">Erde</p>
          <p className="font-semibold capitalize">{plant.modifiers.soilType}</p>
        </div>
      </div>

      {/* Water Level */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4 text-sky-400" />
            <span>Wasser</span>
          </div>
          <span>
            {waterRemaining > 0 ? `braucht in ${waterSecs}s` : 'Wasser benötigt'}
          </span>
        </div>
        <Progress
          value={waterLevel}
          className={cn('h-2 bg-sky-950/40 border border-sky-500/20', waterLevel === 0 && 'ring-2 ring-sky-500/60')}
          indicatorClassName="water-indicator"
        />
      </div>

      {/* Actions */}
      {isHarvestReady ? (
        <Button
          onClick={() => onHarvest(slotIndex)}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Ernten!
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => onWater(slotIndex)}
            disabled={!waterAction.canPerform}
            variant="secondary"
            size="sm"
            className={cn(
              "relative",
              currentPhase.waterRecommended && "ring-2 ring-primary/50"
            )}
          >
            <Droplets className="w-4 h-4 mr-1" />
            Gießen
            <span className="text-xs ml-1">({waterAction.cost})</span>
          </Button>
          <Button
            onClick={() => onFertilize(slotIndex)}
            disabled={!fertAction.canPerform}
            variant="secondary"
            size="sm"
            className={cn(
              "relative",
              currentPhase.fertilizerRecommended && "ring-2 ring-primary/50"
            )}
          >
            <Sprout className="w-4 h-4 mr-1" />
            Düngen
            <span className="text-xs ml-1">({fertAction.cost})</span>
          </Button>
        </div>
      )}

      {/* Tooltips for disabled actions */}
      {(!waterAction.canPerform || !fertAction.canPerform) && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {!waterAction.canPerform && waterAction.reason}
          {!fertAction.canPerform && !waterAction.canPerform && ' | '}
          {!fertAction.canPerform && fertAction.reason}
        </p>
      )}
    </Card>
  );
};



