import productImage from "@/assets/neovit-product.jpeg";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Award, Check, Factory, Leaf, Pill, Scale, Sparkles, Tag } from "lucide-react";
import productsData from "@/data/products.json";

type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  status: string | null;
};


const CATEGORY_KEY: Record<string, string> = {
  "Daily Multivitamins": "daily_multivitamins",
  "Immunity": "immunity",
  "Bone Health": "bone_health",
  "Magnesium & Muscle Health": "magnesium_muscle",
  "Heart Health": "heart_health",
  "Brain & Memory": "brain_memory",
  "Sleep": "sleep",
  "Stress Management": "stress_management",
  "Men's Health": "mens_health",
  "Women's Health": "womens_health",
  "Hair, Skin & Nails": "hair_skin_nails",
  "Beauty & Collagen": "beauty_collagen",
  "Digestive Health": "digestive_health",
  "Joint Health": "joint_health",
  "Eye Health": "eye_health",
  "Liver Health & Antioxidant": "liver_antioxidant",
  "Children's Health": "childrens_health",
  "Hydration & Electrolytes": "hydration_electrolytes",
};

const STATUS_KEY: Record<string, string> = {
  "Collecting Legal Papers": "collecting_legal_papers",
  "Submitted": "submitted",
  "In progress": "in_progress",
  "In Progress": "in_progress",
  "DMP In Progress": "dmp_in_progress",
  "DMP Certified": "dmp_certified",
  "Ordered": "ordered",
  "In Stock": "in_stock",
};

const STATUS_PROGRESS: Record<string, number> = {
  collecting_legal_papers: 10,
  submitted: 25,
  in_progress: 45,
  dmp_in_progress: 60,
  dmp_certified: 75,
  ordered: 90,
  in_stock: 100,
};

const STATUS_STYLE: Record<string, { bar: string; pill: string; dot: string }> = {
  collecting_legal_papers: {
    bar: "bg-gradient-to-r from-slate-400 to-slate-500",
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/30",
    dot: "bg-slate-500",
  },
  submitted: {
    bar: "bg-gradient-to-r from-sky-400 to-blue-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30",
    dot: "bg-sky-500",
  },
  in_progress: {
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
    dot: "bg-amber-500",
  },
  dmp_in_progress: {
    bar: "bg-gradient-to-r from-amber-400 to-orange-500",
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
    dot: "bg-amber-500",
  },
  dmp_certified: {
    bar: "bg-gradient-to-r from-teal-400 to-cyan-500",
    pill: "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30",
    dot: "bg-teal-500",
  },
  ordered: {
    bar: "bg-gradient-to-r from-indigo-400 to-violet-500",
    pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30",
    dot: "bg-indigo-500",
  },
  in_stock: {
    bar: "bg-gradient-to-r from-emerald-400 to-green-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

const DEFAULT_STYLE = {
  bar: "bg-primary",
  pill: "bg-primary/10 text-primary ring-1 ring-primary/30",
  dot: "bg-primary",
};

export const ProductSection = () => {
  const { t, direction, language } = useLanguage();
  const tp = t.product as any;

  const nameFor = (p: any) => {
    if (language === "fr") return p.name_fr ?? p.name;
    if (language === "ar") return p.name_ar ?? p.name;
    return p.name_en ?? p.name;
  };

  const products: CatalogProduct[] = (productsData as any[])
    .filter((p) => p.active !== false)
    .map((p) => ({
      id: p.id,
      name: nameFor(p),
      category: CATEGORY_KEY[p.category] ?? p.category ?? null,
      status: STATUS_KEY[p.status] ?? p.status ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));


  const loading = false;


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

          <div className="glass-card rounded-2xl overflow-hidden shadow-card max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground py-10">{tp.loading}</p>
            ) : products.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">{tp.empty}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {products.map((p, i) => {
                  const progress = STATUS_PROGRESS[p.status ?? ""] ?? 0;
                  const style = STATUS_STYLE[p.status ?? ""] ?? DEFAULT_STYLE;
                  const isDone = p.status === "in_stock";
                  return (
                    <li
                      key={p.id}
                      className={`group flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-4 md:px-8 py-4 transition-all duration-300 hover:bg-primary/5 ${
                        i % 2 === 0 ? "bg-background/40" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 w-full md:w-2/5">
                        <span className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-sm md:text-base break-words md:truncate leading-snug">{p.name}</p>
                          <p className="text-xs text-muted-foreground break-words md:truncate mt-0.5">{categoryLabel(p.category)}</p>
                        </div>
                      </div>


                      <div className="md:flex-1 md:px-4 w-full">
                        <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                          <div
                            className={`h-full ${style.bar} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className={`flex items-center md:w-56 ${direction === "rtl" ? "md:justify-start" : "md:justify-end"}`}>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.pill}`}
                        >
                          <span className="relative flex h-2 w-2" aria-hidden>
                            {!isDone && (
                              <span
                                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${style.dot}`}
                              />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
                          </span>
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
