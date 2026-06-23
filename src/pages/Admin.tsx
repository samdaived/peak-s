import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Pencil, ChevronDown, ChevronRight, X } from 'lucide-react';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  active: boolean;
};

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
  user_id: string;
  phone: string | null;
  shipping_address: string | null;
  notes: string | null;
  email?: string | null;
  company_name?: string | null;
  order_items?: OrderItem[];
};

const empty = { sku: '', name: '', category: '', price: '0', description: '' };

type FavoriteRow = {
  product_id: string;
  product_name: string;
  product_sku: string;
  buyers: { user_id: string; company_name: string | null; email: string | null; created_at: string }[];
};

const ARCHIVED_STATUSES = new Set(['approved', 'cancelled', 'canceled', 'archived', 'completed', 'rejected']);

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: p }, { data: o }, { data: f }] = await Promise.all([
      supabase.from('products').select('*').order('sku'),
      supabase
        .from('orders')
        .select('*, order_items(*, products(name, sku)), profiles(company_name)')
        .order('created_at', { ascending: false }),
      supabase.from('favorites').select('user_id, product_id, created_at, products(name, sku), profiles(company_name)'),
    ]);
    setProducts((p as Product[]) ?? []);

    const orderRows = ((o as any[]) ?? []) as Order[];
    const favRows = (f as any[]) ?? [];

    const userIds = Array.from(new Set([
      ...orderRows.map((r) => r.user_id),
      ...favRows.map((r) => r.user_id),
    ].filter(Boolean)));

    const emailMap = new Map<string, string>();
    if (userIds.length) {
      const { data: emails } = await supabase.rpc('get_user_emails', { _user_ids: userIds });
      ((emails as any[]) ?? []).forEach((e) => emailMap.set(e.user_id, e.email));
    }

    setOrders(orderRows.map((row: any) => ({
      ...row,
      email: emailMap.get(row.user_id) ?? null,
      company_name: row.profiles?.company_name ?? null,
    })));

    const grouped = new Map<string, FavoriteRow>();
    favRows.forEach((row) => {
      const key = row.product_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          product_id: key,
          product_name: row.products?.name ?? '—',
          product_sku: row.products?.sku ?? '',
          buyers: [],
        });
      }
      grouped.get(key)!.buyers.push({
        user_id: row.user_id,
        company_name: row.profiles?.company_name ?? null,
        email: emailMap.get(row.user_id) ?? null,
        created_at: row.created_at,
      });
    });
    setFavorites([...grouped.values()].sort((a, b) => b.buyers.length - a.buyers.length));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
    };
    const { error } = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: editingId ? 'Product updated' : 'Product added' });
    setForm(empty);
    setEditingId(null);
    load();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ sku: p.sku, name: p.name, category: p.category ?? '', price: String(p.price), description: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    load();
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm('Cancel this order?')) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Order cancelled' });
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const activeOrders = useMemo(() => orders.filter((o) => !ARCHIVED_STATUSES.has(o.status.toLowerCase())), [orders]);
  const archivedOrders = useMemo(() => orders.filter((o) => ARCHIVED_STATUSES.has(o.status.toLowerCase())), [orders]);

  const renderOrdersTable = (rows: Order[], allowCancel: boolean) => {
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">No orders.</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Order #</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => {
            const isOpen = expanded.has(o.id);
            const canCancel = allowCancel && o.status.toLowerCase() === 'pending';
            return (
              <>
                <TableRow key={o.id} className="cursor-pointer" onClick={() => toggleExpand(o.id)}>
                  <TableCell>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{new Date(o.updated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{o.email ?? '—'}</TableCell>
                  <TableCell>{o.phone ?? '—'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{o.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{Number(o.total).toFixed(2)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    {canCancel && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancelOrder(o.id)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow key={o.id + '-details'} className="bg-muted/30 hover:bg-muted/30">
                    <TableCell></TableCell>
                    <TableCell colSpan={8}>
                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-semibold mb-1">Company</h4>
                            <div className="text-muted-foreground space-y-0.5">
                              <div>{o.company_name ?? '—'}</div>
                              <div>{o.email ?? '—'}</div>
                              <div>Phone: {o.phone ?? '—'}</div>
                              <div>Ship to: {o.shipping_address ?? '—'}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Order</h4>
                            <div className="text-muted-foreground space-y-0.5">
                              <div>ID: <span className="font-mono">{o.id}</span></div>
                              <div>Created: {new Date(o.created_at).toLocaleString()}</div>
                              <div>Updated: {new Date(o.updated_at).toLocaleString()}</div>
                              <div>Status: <span className="capitalize">{o.status}</span></div>
                              {o.notes && <div>Notes: {o.notes}</div>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Items</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Needed by</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(o.order_items ?? []).map((it) => (
                                <TableRow key={it.id}>
                                  <TableCell className="font-mono text-xs">{it.products?.sku ?? '—'}</TableCell>
                                  <TableCell>{it.products?.name ?? '—'}</TableCell>
                                  <TableCell>{it.quantity}</TableCell>
                                  <TableCell>{it.date_needed ? new Date(it.date_needed).toLocaleDateString() : '—'}</TableCell>
                                  <TableCell className="text-right">{Number(it.unit_price).toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-medium">{(Number(it.unit_price) * it.quantity).toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="text-right font-bold">Total: {Number(o.total).toFixed(2)} MAD</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">Manage products and view orders</p>
          </div>
          <div className="flex gap-2">
            <Link to="/"><Button variant="outline">Site</Button></Link>
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="orders">Orders ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="archive">Archive ({archivedOrders.length})</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit product' : 'Add product'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div className="space-y-2"><Label>Price (MAD)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="md:col-span-2 flex gap-2">
                  <Button type="submit">{editingId ? 'Save' : 'Add'}</Button>
                  {editingId && <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</Button>}
                </div>
              </form>
            </Card>

            <Card className="p-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="p-6 overflow-x-auto">
              {renderOrdersTable(activeOrders, true)}
            </Card>
          </TabsContent>

          <TabsContent value="archive">
            <Card className="p-6 overflow-x-auto">
              {renderOrdersTable(archivedOrders, false)}
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card className="p-6 overflow-x-auto">
              {favorites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No favorites yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Favorited by</TableHead>
                      <TableHead>Buyers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {favorites.map((f) => (
                      <TableRow key={f.product_id}>
                        <TableCell className="font-mono text-xs">{f.product_sku}</TableCell>
                        <TableCell className="font-medium">{f.product_name}</TableCell>
                        <TableCell className="text-right font-semibold">{f.buyers.length}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {f.buyers.map((b) => b.email || b.company_name || b.user_id.slice(0, 8)).join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
