import productImage from "@/assets/neovit-product.jpeg";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Leaf, Pill, Scale } from "lucide-react";

export const ProductSection = () => {
  const { t, direction } = useLanguage();

  const benefits = [
    { icon: <Check className="w-4 h-4" />, text: t.product.benefit1 },
    { icon: <Check className="w-4 h-4" />, text: t.product.benefit2 },
    { icon: <Check className="w-4 h-4" />, text: t.product.benefit3 },
  ];

  return (
    <section id="products" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 gradient-gold text-secondary-foreground shadow-gold"
          >
            {t.product.brand}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t.product.title}
          </h2>
        </div>

        {/* Product Card */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-3xl shadow-card overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              {/* <div className="relative bg-gradient-to-br from-accent to-muted p-8 md:p-12 flex items-center justify-center min-h-[400px]"> */}
              {/* <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 border-2 border-primary rounded-full" />
                  <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-secondary rounded-full" />
                  <div className="absolute bottom-10 right-10 w-32 h-32 border-2 border-secondary rounded-full" />
                </div> */}
              <div className="rounded-3xl overflow-hidden">
                <img
                  src={productImage}
                  alt="Neovit Calcium + D3"
                  className="w-full animate-shake drop-shadow-2xl"
                />
              </div>
              {/* </div> */}

              {/* Product Details */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="space-y-6">
                  {/* Product Name */}
                  <div>
                    <p className="text-sm font-medium text-primary mb-2">
                      {t.product.brand}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                      {t.product.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground">
                    {t.product.description}
                  </p>

                  {/* Product Specs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Pill className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        {t.product.dosage}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        {t.product.weight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-2">
                      <Leaf className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        {t.product.madeIn}
                      </span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <p className="font-semibold text-foreground mb-3">
                      {t.product.benefits}
                    </p>
                    <ul className="space-y-2">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
                            {benefit.icon}
                          </span>
                          <span className="text-muted-foreground">
                            {benefit.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Usage */}
                  <div className="p-4 rounded-xl bg-accent/50 border border-border">
                    <p className="font-semibold text-foreground mb-2">
                      {t.product.usage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t.product.usageText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
