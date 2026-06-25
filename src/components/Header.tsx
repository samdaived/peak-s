import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const { t, direction } = useLanguage();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const buyer = user ? { username: user.email?.split('@')[0] ?? 'user' } : null;

  const pricesLabel =
    t.nav.products === 'Produits' ? 'Tarifs' : t.nav.products === 'المنتجات' ? 'الأسعار' : 'Prices';

  const navItems = [
    { label: t.nav.home, href: '/#home', internal: false },
    { label: t.nav.products, href: '/#products', internal: false },
    { label: t.nav.about, href: '/#about', internal: false },
    { label: t.nav.contact, href: '/#contact', internal: false },
    { label: pricesLabel, href: '/prices', internal: true },
    ...(isAdmin ? [{ label: (t.nav as any).admin ?? 'Admin', href: '/admin', internal: true }] : []),
  ];


  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-primary-foreground font-bold text-lg">PN</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-foreground leading-tight">Peak Nutrition</p>
              <p className="text-xs text-muted-foreground">Health &amp; Wellness</p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.internal ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          {/* Right side: Language + Auth */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {buyer ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <User size={16} className="text-primary" />
                  <span className="font-medium">{buyer.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
                  title={t.footer.logout}
                >
                  <LogOut size={16} />
                  <span>{t.footer.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-300"
              >
                <LogIn size={16} />
                <span>{t.footer.login}</span>
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-foreground"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300',
            isMenuOpen ? 'max-h-80 pb-4' : 'max-h-0'
          )}
        >
          <nav className="flex flex-col gap-2">
            {navItems.map((item) =>
              item.internal ? (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              )
            )}

            {buyer ? (
              <div className="flex flex-col gap-2 px-4 pt-2 border-t border-border/50 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <User size={16} className="text-primary" />
                  <span className="font-medium">{buyer.username}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <LogOut size={16} />
                  <span>{t.footer.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg transition-colors"
              >
                <LogIn size={16} />
                <span>{t.footer.login}</span>
              </Link>
            )}

            <div className="px-4 pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
