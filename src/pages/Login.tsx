import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { direction, t } = useLanguage();
  const { signIn } = useAuth();
  const c = t.login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return toast({ title: c.failed, description: error, variant: 'destructive' });
    toast({ title: c.welcome });
    navigate('/prices');
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
