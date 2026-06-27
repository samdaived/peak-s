import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/customSupabase";
import { ARCHIVED_ORDER_STATUSES, ORDER_STATUSES } from "@/lib/translations";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

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

const empty = { sku: "", name: "", category: "", price: "0", description: "" };

type FavoriteRow = {
  product_id: string;
  product_name: string;
  product_sku: string;
  buyers: {
    user_id: string;
    company_name: string | null;
    email: string | null;
    created_at: string;
  }[];
};

const Admin = () => {
  const { t, direction } = useLanguage();
  const ta = t.admin;

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: p }, { data: o }, { data: f }] = await Promise.all([
      supabase.from("products").select("*").order("sku"),
      supabase
        .from("orders")
        .select(
          "*, order_items(*, products(name, sku)), profiles(company_name,email)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("favorites")
        .select(
          "user_id, product_id, created_at, products(name, sku), profiles(company_name, email)",
        ),
    ]);
    setProducts((p as Product[]) ?? []);

    const orderRows = ((o as any[]) ?? []) as Order[];
    const favRows = (f as any[]) ?? [];

    const userIds = Array.from(
      new Set(
        [
          ...orderRows.map((r) => r.user_id),
          ...favRows.map((r) => r.user_id),
        ].filter(Boolean),
      ),
    );

    setOrders(
      orderRows.map((row: any) => ({
        ...row,
        email: row.profiles?.email ?? null,
        company_name: row.profiles?.company_name ?? null,
      })),
    );

    const grouped = new Map<string, FavoriteRow>();
    favRows.forEach((row) => {
      const key = row.product_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          product_id: key,
          product_name: row.products?.name ?? "—",
          product_sku: row.products?.sku ?? "",
          buyers: [],
        });
      }
      grouped.get(key)!.buyers.push({
        user_id: row.user_id,
        company_name: row.profiles?.company_name ?? null,
        email: row.profiles?.email ?? null,
        created_at: row.created_at,
      });
    });
    setFavorites(
      [...grouped.values()].sort((a, b) => b.buyers.length - a.buyers.length),
    );
  };

  useEffect(() => {
    load();
  }, []);

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
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: editingId ? ta.productUpdated : ta.productAdded });
    setForm(empty);
    setEditingId(null);
    load();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category ?? "",
      price: String(p.price),
      description: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(ta.confirmDelete)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: ta.statusUpdated });
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const statusLabel = (s: string) => (t.status as any)[s.toLowerCase()] ?? s;

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => !ARCHIVED_ORDER_STATUSES.has(o.status.toLowerCase()),
      ),
    [orders],
  );
  const archivedOrders = useMemo(
    () =>
      orders.filter((o) => ARCHIVED_ORDER_STATUSES.has(o.status.toLowerCase())),
    [orders],
  );

  const renderOrdersTable = (rows: Order[]) => {
    if (rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{ta.noOrders}</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>{ta.orderNo}</TableHead>
            <TableHead>{ta.created}</TableHead>
            <TableHead>{ta.updated}</TableHead>
            <TableHead>{ta.email}</TableHead>
            <TableHead>{ta.phone}</TableHead>
            <TableHead>{ta.status}</TableHead>
            <TableHead className="text-right">{ta.total}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => {
            const isOpen = expanded.has(o.id);
            return (
              <Fragment key={o.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => toggleExpand(o.id)}
                >
                  <TableCell>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {o.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(o.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(o.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{o.email ?? "—"}</TableCell>
                  <TableCell>{o.phone ?? "—"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={o.status.toLowerCase()}
                      onValueChange={(v) => handleStatusChange(o.id, v)}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {statusLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(o.total).toFixed(2)}
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell></TableCell>
                    <TableCell colSpan={7}>
                      <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-semibold mb-1">{ta.company}</h4>
                            <div className="text-muted-foreground space-y-0.5">
                              <div>{o.company_name ?? "—"}</div>
                              <div>{o.email ?? "—"}</div>
                              <div>
                                {ta.phone}: {o.phone ?? "—"}
                              </div>
                              <div>
                                {ta.shipTo}: {o.shipping_address ?? "—"}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">{ta.order}</h4>
                            <div className="text-muted-foreground space-y-0.5">
                              <div>
                                ID: <span className="font-mono">{o.id}</span>
                              </div>
                              <div>
                                {ta.created}:{" "}
                                {new Date(o.created_at).toLocaleString()}
                              </div>
                              <div>
                                {ta.updated}:{" "}
                                {new Date(o.updated_at).toLocaleString()}
                              </div>
                              <div>
                                {ta.status}:{" "}
                                <span className="capitalize">
                                  {statusLabel(o.status)}
                                </span>
                              </div>
                              {o.notes && (
                                <div>
                                  {ta.notes}: {o.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">
                            {ta.items}
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{ta.sku}</TableHead>
                                <TableHead>{ta.product}</TableHead>
                                <TableHead>{ta.qty}</TableHead>
                                <TableHead>{ta.neededBy}</TableHead>
                                <TableHead className="text-right">
                                  {ta.unitPrice}
                                </TableHead>
                                <TableHead className="text-right">
                                  {ta.subtotal}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(o.order_items ?? []).map((it) => (
                                <TableRow key={it.id}>
                                  <TableCell className="font-mono text-xs">
                                    {it.products?.sku ?? "—"}
                                  </TableCell>
                                  <TableCell>
                                    {it.products?.name ?? "—"}
                                  </TableCell>
                                  <TableCell>{it.quantity}</TableCell>
                                  <TableCell>
                                    {it.date_needed
                                      ? new Date(
                                          it.date_needed,
                                        ).toLocaleDateString()
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {Number(it.unit_price).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {(
                                      Number(it.unit_price) * it.quantity
                                    ).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="text-right font-bold">
                          {ta.total}: {Number(o.total).toFixed(2)} MAD
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{ta.title}</h1>
            <p className="text-sm text-muted-foreground">{ta.subtitle}</p>
          </div>

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">
                {ta.products} ({products.length})
              </TabsTrigger>
              <TabsTrigger value="orders">
                {ta.orders} ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="archive">
                {ta.archive} ({archivedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="favorites">
                {ta.favorites} ({favorites.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  {editingId ? ta.editProduct : ta.addProduct}
                </h2>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <Label>{ta.sku}</Label>
                    <Input
                      value={form.sku}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{ta.name}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{ta.category}</Label>
                    <Input
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{ta.pricemad}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{ta.description}</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button type="submit">
                      {editingId ? ta.save : ta.add}
                    </Button>
                    {editingId && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setForm(empty);
                        }}
                      >
                        {ta.cancel}
                      </Button>
                    )}
                  </div>
                </form>
              </Card>

              <Card className="p-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ta.sku}</TableHead>
                      <TableHead>{ta.name}</TableHead>
                      <TableHead>{ta.category}</TableHead>
                      <TableHead className="text-right">
                        {ta.pricemad}
                      </TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">
                          {p.sku}
                        </TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.category}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(p.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="p-6 overflow-x-auto">
                {renderOrdersTable(activeOrders)}
              </Card>
            </TabsContent>

            <TabsContent value="archive">
              <Card className="p-6 overflow-x-auto">
                {renderOrdersTable(archivedOrders)}
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="p-6 overflow-x-auto">
                {favorites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {ta.noFavorites}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{ta.sku}</TableHead>
                        <TableHead>{ta.product}</TableHead>
                        <TableHead className="text-right">
                          {ta.favoritedBy}
                        </TableHead>
                        <TableHead>{ta.buyers}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {favorites.map((f) => (
                        <TableRow key={f.product_id}>
                          <TableCell className="font-mono text-xs">
                            {f.product_sku}
                          </TableCell>
                          <TableCell className="font-medium">
                            {f.product_name}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {f.buyers.length}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {f.buyers
                              .map(
                                (b) =>
                                  b.email ||
                                  b.company_name ||
                                  b.user_id.slice(0, 8),
                              )
                              .join(", ")}
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
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
