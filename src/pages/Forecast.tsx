import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { getCurrentBuyer, logout, type BuyerAccount } from '@/lib/buyerAuth';
import { PRODUCTS } from '@/lib/products';
import { isFormConfigured, submitForecastRow } from '@/lib/forecastSubmit';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Forecast = () => {
  const navigate = useNavigate();
  const { t, direction } = useLanguage();
  const tf = t.forecast;
  const [buyer, setBuyer] = useState<BuyerAccount | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const b = getCurrentBuyer();
    if (!b) navigate('/login');
    else setBuyer(b);
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [query]);

  const toggle = (sku: string, checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[sku] = next[sku] ?? 0;
      else delete next[sku];
      return next;
    });
  };

  const setVolume = (sku: string, v: number) => setSelected((prev) => ({ ...prev, [sku]: v }));

  const handleSubmit = async () => {
    if (!buyer) return;
    const rows = Object.entries(selected);
    if (rows.length === 0) {
      toast({ title: tf.selectOne, variant: 'destructive' });
      return;
    }
    if (rows.some(([, v]) => !v || v <= 0)) {
      toast({ title: tf.enterVolume, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      for (const [sku, volume] of rows) {
        const product = PRODUCTS.find((p) => p.sku === sku)!;
        await submitForecastRow({
          username: buyer.username,
          company: buyer.companyName,
          sku,
          productName: product.name,
          volume,
        });
      }
      toast({
        title: isFormConfigured() ? tf.submitted : tf.savedLocally,
        description: `${rows.length} ${tf.sent}`,
      });
      setSelected({});
    } catch (e: any) {
      toast({ title: tf.failed, description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!buyer) return null;

  return (
    <div dir={direction} className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{tf.title}</h1>
            <p className="text-sm text-muted-foreground">
              {tf.loggedAs} <span className="font-medium">{buyer.companyName}</span> ({buyer.username})
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button variant="outline">{tf.site}</Button></Link>
            <Button variant="ghost" onClick={handleLogout}>{tf.logout}</Button>
          </div>
        </div>

        {!isFormConfigured() && (
          <Card className="p-4 border-dashed border-amber-500/50 bg-amber-500/5 text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">Google Form not configured yet</p>
            <p className="text-muted-foreground mt-1">
              Open <code className="text-xs">src/lib/forecastSubmit.ts</code> and replace <code>FORM_ID</code> and the
              <code> entry.XXX</code> field IDs with values from your Google Form. Submissions will then flow into your linked Sheet.
            </p>
          </Card>
        )}

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tf.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </Card>

        <Card className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {filtered.map((p) => {
            const checked = p.sku in selected;
            return (
              <div key={p.sku} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <Checkbox
                  id={p.sku}
                  checked={checked}
                  onCheckedChange={(c) => toggle(p.sku, Boolean(c))}
                />
                <Label htmlFor={p.sku} className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category} · {p.sku}</div>
                </Label>
                {checked && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder={tf.unitsYear}
                      value={selected[p.sku] || ''}
                      onChange={(e) => setVolume(p.sku, Number(e.target.value))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">{tf.noMatch}</p>
          )}
        </Card>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-muted-foreground">
            {Object.keys(selected).length} {tf.selected}
          </p>
          <Button onClick={handleSubmit} disabled={submitting} size="lg">
            {submitting ? tf.submitting : tf.submit}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
