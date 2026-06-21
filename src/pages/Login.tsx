import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const copy = {
  en: { title: 'Buyer Portal', subtitle: 'Peak Nutrition Health & Wellness', email: 'Email', password: 'Password', company: 'Company name', signin: 'Sign in', signup: 'Create account', back: '← Back to site' },
  fr: { title: 'Portail Acheteur', subtitle: 'Peak Nutrition', email: 'Email', password: 'Mot de passe', company: "Nom de l'entreprise", signin: 'Se connecter', signup: 'Créer un compte', back: '← Retour au site' },
  ar: { title: 'بوابة المشتري', subtitle: 'بيك نيوتريشن', email: 'البريد الإلكتروني', password: 'كلمة المرور', company: 'اسم الشركة', signin: 'تسجيل الدخول', signup: 'إنشاء حساب', back: '← العودة' },
};

const Login = () => {
  const navigate = useNavigate();
  const { language, direction } = useLanguage();
  const { signIn, signUp } = useAuth();
  const c = copy[language] ?? copy.en;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return toast({ title: 'Sign-in failed', description: error, variant: 'destructive' });
    toast({ title: 'Welcome back!' });
    navigate('/prices');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signUp(email, password, company);
    setBusy(false);
    if (error) return toast({ title: 'Sign-up failed', description: error, variant: 'destructive' });
    toast({ title: 'Account created — you can sign in now.' });
  };

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-28">
        <Card className="w-full max-w-md p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{c.title}</h1>
            <p className="text-sm text-muted-foreground">{c.subtitle}</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email">{c.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{c.password}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{c.signin}</Button>
          </form>

          <div className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">{c.back}</Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
