import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Pencil } from 'lucide-react';

type Product = {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  price: number;
  active: boolean;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string;
  phone: string | null;
  shipping_address: string | null;
};

const empty = { sku: '', name: '', category: '', price: '0', description: '' };

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: o }] = await Promise.all([
      supabase.from('products').select('*').order('sku'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);
    setProducts((p as Product[]) ?? []);
    setOrders((o as Order[]) ?? []);
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

  const handleSignOut = async () => { await signOut(); navigate('/'); };

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
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
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
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                        <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{o.phone}</TableCell>
                        <TableCell className="capitalize">{o.status}</TableCell>
                        <TableCell className="text-right font-semibold">{Number(o.total).toFixed(2)}</TableCell>
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
