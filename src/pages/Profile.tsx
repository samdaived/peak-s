import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');
  const { t, direction } = useLanguage();
  const tp = (t as any).profile;

  const [companyName, setCompanyName] = useState('');
  const [ice, setIce] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_name, phone, shipping_address, ice')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setCompanyName((data as any).company_name ?? '');
        setIce((data as any).ice ?? '');
        setPhone((data as any).phone ?? '');
        setAddress((data as any).shipping_address ?? '');
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!companyName.trim() || !ice.trim() || !phone.trim() || !address.trim()) {
      return toast({ title: tp.required, variant: 'destructive' });
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      company_name: companyName.trim(),
      ice: ice.trim(),
      phone: phone.trim(),
      shipping_address: address.trim(),
    } as any);
    setSaving(false);
    if (error) return toast({ title: tp.error, description: error.message, variant: 'destructive' });
    toast({ title: tp.saved });
    if (redirect) navigate(redirect);
  };

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold">{tp.title}</h1>
          <p className="text-sm text-muted-foreground">{tp.subtitle}</p>
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>{tp.email}</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>{tp.companyName} *</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>{tp.ice} *</Label>
              <Input value={ice} onChange={(e) => setIce(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>{tp.phone} *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>{tp.deliveryAddress} *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={loading} />
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving || loading}>
                {saving ? tp.saving : tp.save}
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
