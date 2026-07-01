import { useLanguage } from "@/contexts/LanguageContext";
import { Building2 } from "lucide-react";

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-10 border-t border-border bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Legal Information */}
        <div className="mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {t.footer.legalInfo}
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-muted-foreground">
            <div className="space-y-1">
              <p>{t.footer.rc}: 73029 - Kénitra</p>
              <p>{t.footer.ice}: 003480497000084</p>
            </div>

            <div className="space-y-1">
              <p>{t.footer.registered}: 16/04/2024</p>
              <p className="text-muted-foreground/80">Import & Distribution</p>
              <p className="text-muted-foreground/80">
                Compléments Alimentaires & Dispositifs Médicaux
              </p>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                PN
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Peak Nutrition Health & Wellness.{" "}
              {t.footer.rights}.
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center md:text-right max-w-md">
            {t.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
};
