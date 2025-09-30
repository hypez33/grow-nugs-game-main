import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { STRAINS, getRarityColor } from '@/data/strains';
import { Sprout, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UPGRADES, getUpgradePrice } from '@/data/upgrades';
import { Button } from '@/components/ui/button';
import nugIcon from '@/assets/ui/nug-icon.png';

interface ShopContentProps {
  nugs: number;
  upgrades: Record<string, number>;
  onBuySeed: (strainId: string) => void;
  onBuyUpgrade: (upgradeId: string) => void;
}

export const ShopContent = ({
  nugs,
  upgrades,
  onBuySeed,
  onBuyUpgrade,
}: ShopContentProps) => {
  const [selectedSoil, setSelectedSoil] = useState<'basic' | 'light-mix' | 'all-mix'>('basic');

  const soilPrices = {
    basic: 0,
    'light-mix': 25,
    'all-mix': 50,
  } as const;

  const soilDescriptions = {
    basic: 'Standard-Erde, keine Boni',
    'light-mix': '-10% Wachstumszeit',
    'all-mix': '+15% Ertrag',
  } as const;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <img src={nugIcon} alt="Nugs" className="w-6 h-6" />
        <span className="text-2xl font-bold text-accent">{nugs}</span>
        <span className="text-muted-foreground">Nugs</span>
      </div>

      <Tabs defaultValue="seeds" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seeds">Samen & Erde</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
        </TabsList>

        <TabsContent value="seeds" className="space-y-4">
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              Erde auswählen
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(soilPrices) as Array<keyof typeof soilPrices>).map((soil) => (
                <Button
                  key={soil}
                  variant={selectedSoil === soil ? 'default' : 'outline'}
                  onClick={() => setSelectedSoil(soil)}
                  className="flex flex-col h-auto py-3"
                >
                  <span className="capitalize font-semibold">{soil}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {soilDescriptions[soil]}
                  </span>
                  <span className="text-xs font-bold mt-2">
                    {soilPrices[soil] === 0 ? 'Gratis' : `+${soilPrices[soil]} Nugs`}
                  </span>
                </Button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STRAINS.map((strain) => {
              const totalCost = strain.seedPrice + soilPrices[selectedSoil];
              const canAfford = nugs >= totalCost;

              return (
                <Card key={strain.id} className="p-4 hover:border-primary/50 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{strain.name}</h3>
                      <Badge variant="outline" className={getRarityColor(strain.rarity)}>
                        {strain.rarity}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <img src={nugIcon} alt="Nugs" className="w-4 h-4" />
                        <span className="font-bold">{totalCost}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        ({strain.seedPrice} + {soilPrices[selectedSoil]})
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{strain.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">Basis-Ertrag:</span>
                      <span className="ml-1 font-semibold">{strain.baseYield}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wachstum:</span>
                      <span className="ml-1 font-semibold">{(strain.baseTimeMultiplier * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => onBuySeed(strain.id)}
                    disabled={!canAfford}
                    className="w-full"
                    variant={canAfford ? 'default' : 'outline'}
                  >
                    {canAfford ? 'Kaufen & Pflanzen' : 'Zu wenig Nugs'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {UPGRADES.map((upgrade) => {
              const currentLevel = upgrades[upgrade.id] || 0;
              const isMaxed = currentLevel >= upgrade.maxLevel;
              const price = isMaxed ? 0 : getUpgradePrice(upgrade.basePrice, currentLevel);
              const canAfford = nugs >= price;

              return (
                <Card key={upgrade.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{upgrade.name}</h3>
                        <Badge variant="secondary">Level {currentLevel}/{upgrade.maxLevel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{upgrade.description}</p>

                      {!isMaxed && (
                        <p className="text-xs text-primary mt-2">
                          Nächster Bonus: +{(upgrade.effectPerLevel * 100).toFixed(0)}
                          {upgrade.effectType === 'slot' ? ' Slot' : '%'}
                        </p>
                      )}
                    </div>

                    <div className="ml-4">
                      <Button onClick={() => onBuyUpgrade(upgrade.id)} disabled={isMaxed || !canAfford} size="sm">
                        {isMaxed ? (
                          'Max'
                        ) : (
                          <>
                            <ArrowUp className="w-4 h-4 mr-1" />
                            {price}
                            <img src={nugIcon} alt="Nugs" className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopContent;

