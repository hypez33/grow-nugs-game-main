import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useMemo, useState } from 'react';
import { Coins, Leaf, RefreshCcw, BadgeDollarSign } from 'lucide-react';

export interface TradeOfferView {
  id: string;
  quantity: number;
  pricePerBud: number;
}

interface TradePanelProps {
  buds: number;
  nugs: number;
  offers: TradeOfferView[];
  nextRefreshAt: number;
  onRefresh: () => void;
  onAccept: (offerId: string) => void;
  onHaggle?: (offerId: string) => void;
}

export const TradePanel = ({ buds, nugs, offers, nextRefreshAt, onRefresh, onAccept, onHaggle }: TradePanelProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const refreshCooldownMs = Math.max(0, nextRefreshAt - now);
  const refreshSeconds = Math.ceil(refreshCooldownMs / 1000);
  const canRefresh = refreshCooldownMs === 0;

  const totalValue = useMemo(() => {
    return offers.reduce((sum, o) => sum + Math.floor(o.quantity * o.pricePerBud), 0);
  }, [offers]);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between bg-card/80 backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Buds</p>
              <p className="text-xl font-bold">{buds}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Nugs</p>
              <p className="text-xl font-bold">{nugs}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 text-primary" />
          <div className="text-sm">
            Gesamtwert Angebote: <span className="font-semibold">{totalValue}</span>
          </div>
        </div>
        <div>
          <Button onClick={onRefresh} disabled={!canRefresh} variant="outline">
            <RefreshCcw className="w-4 h-4 mr-2" />
            {canRefresh ? 'Neue Angebote' : `Warte ${refreshSeconds}s`}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => {
          const revenue = Math.floor(offer.quantity * offer.pricePerBud);
          const canSell = buds >= offer.quantity;
          return (
            <Card key={offer.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Anfrage</h3>
                  <div className="text-sm text-muted-foreground">Kaufe Buds</div>
                </div>
                <Badge variant="secondary">{offer.pricePerBud} / Bud</Badge>
              </div>
              <div className="mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  <span className="font-medium">Menge:</span> {offer.quantity}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Coins className="w-4 h-4 text-accent" />
                  <span className="font-medium">Ertrag:</span> {revenue} Nugs
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => onAccept(offer.id)} disabled={!canSell}>
                  {canSell ? 'Verkaufen' : 'Zu wenig Buds'}
                </Button>
                <Button variant="outline" onClick={() => onHaggle?.(offer.id)}>
                  Verhandeln
                </Button>
              </div>
            </Card>
          );
        })}
        {offers.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">Keine Angebote verfügbar.</Card>
        )}
      </div>
    </div>
  );
};

export default TradePanel;
