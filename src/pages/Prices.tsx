import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Heart, ShoppingCart, X, ListOrdered } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
};

type CartLine = { product: Product; quantity: number; date_needed: string };

const Prices = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [showCart, setShowCart] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: prods } = await supabase.from('products').select('*').eq('active', true).order('sku');
      setProducts((prods as Product[]) ?? []);
      if (user) {
        const { data: favs } = await supabase.from('favorites').select('product_id').eq('user_id', user.id);
        setFavorites(new Set((favs ?? []).map((f: any) => f.product_id)));
        const { data: profile } = await supabase.from('profiles').select('phone, shipping_address').eq('id', user.id).maybeSingle();
        if (profile) {
          setPhone(profile.phone ?? '');
          setAddress(profile.shipping_address ?? '');
        }
      }
    };
    load();
  }, [user]);

  const toggleFavorite = async (p: Product) => {
    if (!user) return;
    if (favorites.has(p.id)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', p.id);
      const next = new Set(favorites); next.delete(p.id); setFavorites(next);
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: p.id });
      if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setFavorites(new Set(favorites).add(p.id));
    }
  };

  const addToCart = (p: Product) => {
    setCart((c) => ({
      ...c,
      [p.id]: c[p.id]
        ? { ...c[p.id], quantity: c[p.id].quantity + 1 }
        : { product: p, quantity: 1, date_needed: '' },
    }));
    toast({ title: `${p.name} added` });
  };

  const updateLine = (id: string, patch: Partial<CartLine>) => {
    setCart((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
  };

  const removeLine = (id: string) => {
    setCart((c) => { const next = { ...c }; delete next[id]; return next; });
  };

  const cartItems = Object.values(cart);
  const cartTotal = useMemo(
    () => cartItems.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0),
    [cartItems]
  );

  const submitOrder = async () => {
    if (!user || cartItems.length === 0) return;
    setSubmitting(true);
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        shipping_address: address || null,
        phone: phone || null,
        notes: notes || null,
        total: cartTotal,
      })
      .select()
      .single();
    if (orderErr || !order) {
      setSubmitting(false);
      return toast({ title: 'Could not create order', description: orderErr?.message, variant: 'destructive' });
    }
    const items = cartItems.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      quantity: l.quantity,
      date_needed: l.date_needed || null,
      unit_price: l.product.price,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(items);
    setSubmitting(false);
    if (itemsErr) return toast({ title: 'Could not save items', description: itemsErr.message, variant: 'destructive' });

    // persist profile defaults
    await supabase.from('profiles').upsert({ id: user.id, phone, shipping_address: address });

    toast({ title: 'Order placed!', description: `Total: ${cartTotal.toFixed(2)} MAD` });
    setCart({});
    setShowCart(false);
    setNotes('');
    navigate('/orders');
  };

  const handleLogout = async () => { await signOut(); navigate('/login', { replace: true }); };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const af = favorites.has(a.id) ? 0 : 1;
      const bf = favorites.has(b.id) ? 0 : 1;
      return af - bf || a.sku.localeCompare(b.sku);
    });
  }, [products, favorites]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Wholesale Prices</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/orders')}>
                <ListOrdered className="h-4 w-4 mr-2" /> My orders
              </Button>
              <Button onClick={() => setShowCart((s) => !s)}>
                <ShoppingCart className="h-4 w-4 mr-2" /> Cart ({cartItems.length})
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            </div>
          </div>

          {showCart && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Your order</h2>
              {cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cart is empty.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Date needed</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((l) => (
                        <TableRow key={l.product.id}>
                          <TableCell>{l.product.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={l.quantity}
                              onChange={(e) => updateLine(l.product.id, { quantity: Math.max(1, Number(e.target.value)) })}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={l.date_needed}
                              onChange={(e) => updateLine(l.product.id, { date_needed: e.target.value })}
                              className="w-44"
                            />
                          </TableCell>
                          <TableCell className="text-right">{(Number(l.product.price) * l.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeLine(l.product.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Shipping address</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold">Total: {cartTotal.toFixed(2)} MAD</div>
                    <Button onClick={submitOrder} disabled={submitting}>
                      {submitting ? 'Placing…' : 'Place order'}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}

          <Card className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price (MAD)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleFavorite(p)}>
                        <Heart className={`h-4 w-4 ${favorites.has(p.id) ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(p.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => addToCart(p)}>Add</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Prices;
