import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ARCHIVED_ORDER_STATUSES } from '@/lib/translations';
import { X } from 'lucide-react';

type OrderItem = {
  id: string;
  quantity: number;
  date_needed: string | null;
  unit_price: number;
  products: { name: string; sku: string } | null;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  order_items: OrderItem[];
};

const Orders = () => {
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const o = t.orders;
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*, products(name, sku))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const activeOrders = useMemo(() => orders.filter((x) => !ARCHIVED_ORDER_STATUSES.has(x.status.toLowerCase())), [orders]);
  const archivedOrders = useMemo(() => orders.filter((x) => ARCHIVED_ORDER_STATUSES.has(x.status.toLowerCase())), [orders]);

  const statusLabel = (s: string) => (t.status as any)[s.toLowerCase()] ?? s;

  const handleCancel = async (id: string) => {
    if (!confirm(o.confirmCancel)) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) return toast({ title: o.error, description: error.message, variant: 'destructive' });
    toast({ title: o.cancelled });
    load();
  };

  const renderOrders = (list: Order[], allowCancel: boolean) => {
    if (list.length === 0) {
      return <Card className="p-8 text-center text-muted-foreground">{o.empty}</Card>;
    }
    return list.map((row) => {
      const canCancel = allowCancel && !ARCHIVED_ORDER_STATUSES.has(row.status.toLowerCase());
      return (
        <Card key={row.id} className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{row.id.slice(0, 8)}</div>
              <div className="text-sm">{o.created}: {new Date(row.created_at).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{o.updated}: {new Date(row.updated_at).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{statusLabel(row.status)}</Badge>
              {canCancel && (
                <Button variant="outline" size="sm" onClick={() => handleCancel(row.id)}>
                  <X className="h-4 w-4 mr-1" /> {o.cancel}
                </Button>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{o.product}</TableHead>
                <TableHead>{o.qty}</TableHead>
                <TableHead>{o.neededBy}</TableHead>
                <TableHead className="text-right">{o.unitPrice}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {row.order_items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.products?.name ?? '—'}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{it.date_needed ? new Date(it.date_needed).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">{Number(it.unit_price).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between text-sm">
            <div className="text-muted-foreground">
              {row.phone && <div>{o.phone}: {row.phone}</div>}
              {row.shipping_address && <div>{o.shipTo}: {row.shipping_address}</div>}
            </div>
            <div className="font-bold text-lg">{o.total}: {Number(row.total).toFixed(2)} MAD</div>
          </div>
        </Card>
      );
    });
  };

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">{o.title}</h1>
            <Link to="/prices"><Button variant="outline">{o.back}</Button></Link>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">{o.active} ({activeOrders.length})</TabsTrigger>
              <TabsTrigger value="archive">{o.archive} ({archivedOrders.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              {renderOrders(activeOrders, true)}
            </TabsContent>
            <TabsContent value="archive" className="space-y-4">
              {renderOrders(archivedOrders, false)}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
