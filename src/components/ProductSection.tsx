import productImage from "@/assets/neovit-product.jpeg";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/customSupabase";
import { Award, Check, Factory, Leaf, Pill, Scale, Sparkles, Tag } from "lucide-react";
import { useEffect, useState } from "react";

type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
};

// Progress weight per status (0-100) to render the progress bar
const STATUS_PROGRESS: Record<string, number> = {
  collecting_legal_papers: 15,
  submitted: 30,
  dmp_in_progress: 50,
  dmp_certified: 70,
  ordered: 85,
  in_stock: 100,
};

const STATUS_COLOR: Record<string, string> = {
  collecting_legal_papers: "bg-muted-foreground",
  submitted: "bg-blue-500",
  dmp_in_progress: "bg-amber-500",
  dmp_certified: "bg-teal-500",
  ordered: "bg-indigo-500",
  in_stock: "bg-emerald-500",
};

export const ProductSection = () => {
  const { t, direction } = useLanguage();
  const tp = t.product as any;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, status")
        .eq("active", true)
        .order("name", { ascending: true });
      if (cancelled) return;
      if (!error && data) setProducts(data as CatalogProduct[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryLabel = (key: string | null) => {
    if (!key) return "";
    return tp.categories?.[key] ?? key;
  };

  const statusLabel = (key: string | null) => {
    if (!key) return "";
    return tp.statuses?.[key] ?? key;
  };

  const benefits = [
    { icon: <Check className="w-4 h-4" />, text: tp.benefit1 },
    { icon: <Check className="w-4 h-4" />, text: tp.benefit2 },
    { icon: <Check className="w-4 h-4" />, text: tp.benefit3 },
  ];

  const pillars = [
    { icon: <Award className="w-6 h-6" />, title: tp.pillars.prime, text: tp.pillars.primeText },
    { icon: <Tag className="w-6 h-6" />, title: tp.pillars.price, text: tp.pillars.priceText },
    { icon: <Factory className="w-6 h-6" />, title: tp.pillars.eu, text: tp.pillars.euText },
  ];

  return (
    <section id="products" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground shadow-gold">
            {tp.brand}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {tp.title}
          </h2>
        </div>

        {/* Value pillars */}
        <div className="max-w-5xl mx-auto mb-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 flex items-start gap-4 shadow-card hover:shadow-lg transition-all"
            >
              <span className="flex-shrink-0 w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shadow-soft">
                {p.icon}
              </span>
              <div>
                <p className="font-semibold text-foreground">{p.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Featured product card */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl shadow-card overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="rounded-3xl overflow-hidden">
                <img src={productImage} alt="Neovit Calcium + D3" className="w-full animate-shake drop-shadow-2xl" />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-primary mb-2">{tp.brand}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">{tp.name}</h3>
                  </div>
                  <p className="text-muted-foreground">{tp.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Pill className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{tp.dosage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{tp.weight}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <Leaf className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{tp.madeIn}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-3">{tp.benefits}</p>
                    <ul className="space-y-2">
                      {benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                            {b.icon}
                          </span>
                          <span className="text-muted-foreground">{b.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <p className="font-semibold text-foreground mb-2">{tp.usage}</p>
                    <p className="text-sm text-muted-foreground">{tp.usageText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog (from DB) */}
        <div className="max-w-5xl mx-auto mt-20 md:mt-28">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 gradient-gold text-secondary-foreground shadow-gold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              {tp.upcomingTitle}
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{tp.upcomingTitle}</h3>
            <p className="text-muted-foreground text-sm md:text-base">{tp.upcomingSubtitle}</p>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden shadow-card">
            {loading ? (
              <p className="text-center text-muted-foreground py-10">{tp.loading}</p>
            ) : products.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">{tp.empty}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {products.map((p, i) => {
                  const progress = STATUS_PROGRESS[p.status ?? ""] ?? 0;
                  const color = STATUS_COLOR[p.status ?? ""] ?? "bg-primary";
                  const isDone = p.status === "in_stock";
                  return (
                    <li
                      key={p.id}
                      className={`group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 md:px-8 py-4 transition-all duration-300 hover:bg-primary/5 ${
                        direction === "rtl"
                          ? "hover:pr-6 md:hover:pr-10"
                          : "hover:pl-6 md:hover:pl-10"
                      } ${i % 2 === 0 ? "bg-background/40" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center gap-4 min-w-0 md:w-2/5">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{categoryLabel(p.category)}</p>
                        </div>
                      </div>

                      <div className="md:flex-1 md:px-4">
                        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className={`h-full ${color} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:w-56 md:justify-end">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${color} ${
                            !isDone ? "animate-pulse" : ""
                          }`}
                          aria-hidden
                        />
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          {statusLabel(p.status)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
