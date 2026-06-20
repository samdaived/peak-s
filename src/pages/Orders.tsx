import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  order_items: OrderItem[];
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*, products(name, sku))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
            <Link to="/prices"><Button variant="outline">Back to prices</Button></Link>
          </div>

          {orders.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No orders yet.</Card>
          ) : (
            orders.map((o) => (
              <Card key={o.id} className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</div>
                    <div className="text-sm">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{o.status}</Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Needed by</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {o.order_items.map((it) => (
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
                    {o.phone && <div>Phone: {o.phone}</div>}
                    {o.shipping_address && <div>Ship to: {o.shipping_address}</div>}
                  </div>
                  <div className="font-bold text-lg">Total: {Number(o.total).toFixed(2)} MAD</div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
