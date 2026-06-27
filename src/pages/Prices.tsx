import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/customSupabase";
import { Heart, ListOrdered, ShoppingCart, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const tp = t.prices;

  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [showCart, setShowCart] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ice, setIce] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const profileComplete = !!(
    companyName.trim() &&
    ice.trim() &&
    phone.trim() &&
    address.trim()
  );

  useEffect(() => {
    const load = async () => {
      const { data: prod, error } = await supabase.from("products").select("*");
      if (error) {
        toast({
          title: tp.couldNotLoad,
          description: error.message,
          variant: "destructive",
        });
      } else if (prod) {
        const list = Array.isArray(prod) ? prod : (prod ?? []);
        setProducts(list);
      }

      if (user) {
        try {
          const { data: favs } = await supabase
            .from("favorites")
            .select("product_id")
            .eq("user_id", user.id);
          setFavorites(new Set((favs ?? []).map((f: any) => f.product_id)));
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone, shipping_address, company_name, ice")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            setPhone((profile as any).phone ?? "");
            setAddress((profile as any).shipping_address ?? "");
            setCompanyName((profile as any).company_name ?? "");
            setIce((profile as any).ice ?? "");
          }
        } catch {
          /* tables not created yet — ignore */
        }
      }
    };
    load();
  }, [user]);

  const toggleFavorite = async (p: Product) => {
    if (!user) return;
    if (favorites.has(p.id)) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", p.id);
      const next = new Set(favorites);
      next.delete(p.id);
      setFavorites(next);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, product_id: p.id });
      if (error)
        return toast({
          title: tp.error,
          description: error.message,
          variant: "destructive",
        });
      setFavorites(new Set(favorites).add(p.id));
    }
  };

  const addToCart = (p: Product) => {
    setCart((c) => ({
      ...c,
      [p.id]: c[p.id]
        ? { ...c[p.id], quantity: c[p.id].quantity + 1000 }
        : { product: p, quantity: 1000, date_needed: "" },
    }));
    toast({ title: `${p.name} ${tp.added}` });
  };

  const updateLine = (id: string, patch: Partial<CartLine>) => {
    setCart((c) => ({ ...c, [id]: { ...c[id], ...patch } }));
  };

  const removeLine = (id: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = useMemo(
    () =>
      cartItems.reduce((s, l) => s + Number(l.product.price) * l.quantity, 0),
    [cartItems],
  );

  const submitOrder = async () => {
    if (!user || cartItems.length === 0) return;
    if (!profileComplete) {
      toast({ title: (tp as any).profileIncomplete, variant: "destructive" });
      navigate("/profile?redirect=/prices");
      return;
    }
    if (cartItems.some((l) => !l.date_needed)) {
      toast({
        title: (t.orders as any).neededBy + " *",
        variant: "destructive",
      });
      return;
    }
    if (cartItems.some((l) => l.quantity < 1000)) {
      toast({ title: (tp as any).minQty, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        shipping_address: address || null,
        phone: phone || null,
        notes: notes || null,
        total: cartTotal,
        status: "submitted",
      })
      .select()
      .single();
    if (orderErr || !order) {
      setSubmitting(false);
      return toast({
        title: tp.cannotCreate,
        description: orderErr?.message,
        variant: "destructive",
      });
    }
    const items = cartItems.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      quantity: l.quantity,
      date_needed: l.date_needed || null,
      unit_price: l.product.price,
    }));
    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(items);
    setSubmitting(false);
    if (itemsErr)
      return toast({
        title: tp.cannotSaveItems,
        description: itemsErr.message,
        variant: "destructive",
      });

    // persist profile defaults
    await supabase
      .from("profiles")
      .upsert({ id: user.id, phone, shipping_address: address });

    toast({
      title: tp.orderPlaced,
      description: `${tp.total}: ${cartTotal.toFixed(2)} MAD`,
    });
    setCart({});
    setShowCart(false);
    setNotes("");
    navigate("/orders");
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const af = favorites.has(a.id) ? 0 : 1;
      const bf = favorites.has(b.id) ? 0 : 1;
      return af - bf || a.sku.localeCompare(b.sku);
    });
  }, [products, favorites]);

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{tp.title}</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/orders")}>
                <ListOrdered className="h-4 w-4 mr-2" /> {tp.myOrders}
              </Button>
              <Button onClick={() => setShowCart((s) => !s)}>
                <ShoppingCart className="h-4 w-4 mr-2" /> {tp.cart} (
                {cartItems.length})
              </Button>
            </div>
          </div>

          {!profileComplete && (
            <Card className="p-4 flex flex-wrap items-center justify-between gap-3 border-destructive/50 bg-destructive/5">
              <p className="text-sm">{(tp as any).profileIncomplete}</p>
              <Button
                size="sm"
                onClick={() => navigate("/profile?redirect=/prices")}
              >
                {(tp as any).completeProfile}
              </Button>
            </Card>
          )}

          {showCart && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{tp.yourOrder}</h2>
              {cartItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tp.empty}</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{tp.product}</TableHead>
                        <TableHead>{tp.quantity}</TableHead>
                        <TableHead>{tp.dateNeeded} *</TableHead>
                        <TableHead className="text-right">
                          {tp.subtotal}
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((l) => (
                        <TableRow key={l.product.id}>
                          <TableCell>{l.product.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1000}
                                step={1000}
                                value={l.quantity}
                                onChange={(e) =>
                                  updateLine(l.product.id, {
                                    quantity: Math.max(
                                      1000,
                                      Number(e.target.value) || 1000,
                                    ),
                                  })
                                }
                                className="w-28"
                              />
                              <span className="text-sm text-muted-foreground">
                                ({(l.quantity / 1000).toLocaleString()}k)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              required
                              value={l.date_needed}
                              onChange={(e) =>
                                updateLine(l.product.id, {
                                  date_needed: e.target.value,
                                })
                              }
                              className="w-44"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {(Number(l.product.price) * l.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(l.product.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>{tp.phone} *</Label>
                      <Input value={phone} disabled />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>{(tp as any).deliveryAddress} *</Label>
                      <Input value={address} disabled />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>{tp.notes}</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg font-bold">
                      {tp.total}: {cartTotal.toFixed(2)} MAD
                    </div>
                    <Button
                      onClick={submitOrder}
                      disabled={submitting || !profileComplete}
                    >
                      {submitting ? tp.placing : tp.placeOrder}
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
                  <TableHead>{tp.sku}</TableHead>
                  <TableHead>{tp.product}</TableHead>
                  <TableHead>{tp.category}</TableHead>
                  <TableHead className="text-right">{tp.price}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(p)}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.has(p.id) ? "fill-primary text-primary" : ""}`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Number(p.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => addToCart(p)}>
                        {tp.add}
                      </Button>
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
