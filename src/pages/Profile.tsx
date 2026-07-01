import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/customSupabase";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { Pencil } from "lucide-react";

type CompanyState = {
  name: string;
  ice: string;
  rc: string;
  city: string;
  phone: string;
  office_address: string;
  storage_office: string;
};

const emptyCompany: CompanyState = {
  name: "",
  ice: "",
  rc: "",
  city: "",
  phone: "",
  office_address: "",
  storage_office: "",
};

type PersonalState = { full_name: string; phone: string };
const emptyPersonal: PersonalState = { full_name: "", phone: "" };

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect");
  const { t, direction } = useLanguage();
  const tp: any = (t as any).profile;

  // Personal
  const [personalOriginal, setPersonalOriginal] =
    useState<PersonalState>(emptyPersonal);
  const [personal, setPersonal] = useState<PersonalState>(emptyPersonal);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [confirmPersonalOpen, setConfirmPersonalOpen] = useState(false);

  // Company
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [original, setOriginal] = useState<CompanyState>(emptyCompany);
  const [company, setCompany] = useState<CompanyState>(emptyCompany);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ICE is locked once set (admins can still edit it elsewhere)
  const iceLocked = !isAdmin && original.ice.trim().length > 0;

  const dirty = useMemo(
    () => JSON.stringify(company) !== JSON.stringify(original),
    [company, original],
  );
  const personalDirty = useMemo(
    () => JSON.stringify(personal) !== JSON.stringify(personalOriginal),
    [personal, personalOriginal],
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, company")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const pers: PersonalState = {
          full_name: (profile as any).full_name ?? "",
          phone: (profile as any).phone ?? "",
        };
        setPersonalOriginal(pers);
        setPersonal(pers);
        const cid = (profile as any).company as string | null;
        if (cid) {
          setCompanyId(cid);
          const { data: c } = await supabase
            .from("companies")
            .select(
              "id, name, ice, rc, city, phone, office_address, storage_office",
            )
            .eq("id", cid)
            .maybeSingle();
          if (c) {
            const next: CompanyState = {
              name: (c as any).name ?? "",
              ice: (c as any).ice ?? "",
              rc: (c as any).rc ?? "",
              city: (c as any).city ?? "",
              phone: (c as any).phone ?? "",
              office_address: (c as any).office_address ?? "",
              storage_office: (c as any).storage_office ?? "",
            };
            setOriginal(next);
            setCompany(next);
          }
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const requiredOk = (c: CompanyState) =>
    c.name.trim() &&
    c.ice.trim() &&
    c.city.trim() &&
    c.phone.trim();

  const handleCancel = () => {
    if (dirty) setConfirmOpen(true);
    else setEditing(false);
  };

  const discard = () => {
    setCompany(original);
    setEditing(false);
    setConfirmOpen(false);
  };

  const handleCancelPersonal = () => {
    if (personalDirty) setConfirmPersonalOpen(true);
    else setEditingPersonal(false);
  };
  const discardPersonal = () => {
    setPersonal(personalOriginal);
    setEditingPersonal(false);
    setConfirmPersonalOpen(false);
  };
  const savePersonal = async () => {
    if (!user) return;
    setSavingPersonal(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: personal.full_name.trim() || null,
        phone: personal.phone.trim() || null,
      })
      .eq("id", user.id);
    setSavingPersonal(false);
    if (error)
      return toast({
        title: tp.error,
        description: error.message,
        variant: "destructive",
      });
    setPersonalOriginal(personal);
    setEditingPersonal(false);
    toast({ title: tp.saved });
  };
  const setP = (k: keyof PersonalState) => (v: string) =>
    setPersonal((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    if (!requiredOk(company))
      return toast({ title: tp.required, variant: "destructive" });
    setSaving(true);

    const payload: any = {
      name: company.name.trim(),
      city: company.city.trim(),
      phone: company.phone.trim(),
      office_address: company.office_address.trim(),
      storage_office: company.storage_office.trim(),
      rc: company.rc.trim(),
    };
    // Only include ICE if it's editable (admin or initial set)
    if (!iceLocked) payload.ice = company.ice.trim();

    let cid = companyId;
    if (cid) {
      const { error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", cid);
      if (error) {
        setSaving(false);
        return toast({
          title: tp.error,
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({ ...payload, ice: company.ice.trim() })
        .select("id")
        .single();
      if (error || !created) {
        setSaving(false);
        return toast({
          title: tp.error,
          description: error?.message,
          variant: "destructive",
        });
      }
      cid = (created as any).id;
      setCompanyId(cid);
      await supabase
        .from("profiles")
        .update({ company: cid })
        .eq("id", user.id);
    }

    setOriginal(company);
    setEditing(false);
    setSaving(false);
    toast({ title: tp.saved });
    if (redirect) navigate(redirect);
  };

  const set = (k: keyof CompanyState) => (v: string) =>
    setCompany((c) => ({ ...c, [k]: v }));

  const disabled = !editing;
  const disabledP = !editingPersonal;

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{tp.title}</h1>
            <p className="text-sm text-muted-foreground">{tp.subtitle}</p>
          </div>

          {/* Personal */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{tp.personalSection}</h2>
              {!editingPersonal && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingPersonal(true)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" /> {tp.edit}
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>{tp.email}</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tp.fullName}</Label>
                <Input
                  value={personal.full_name}
                  onChange={(e) => setP("full_name")(e.target.value)}
                  disabled={disabledP || loading}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp.phone}</Label>
                <Input
                  value={personal.phone}
                  onChange={(e) => setP("phone")(e.target.value)}
                  disabled={disabledP || loading}
                />
              </div>
            </div>
            {editingPersonal && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={handleCancelPersonal}
                  disabled={savingPersonal}
                >
                  {tp.cancel}
                </Button>
                <Button
                  onClick={savePersonal}
                  disabled={savingPersonal || !personalDirty}
                >
                  {savingPersonal ? tp.saving : tp.save}
                </Button>
              </div>
            )}
          </Card>

          {/* Company */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{tp.companySection}</h2>
              {!editing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" /> {tp.edit}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>{tp.companyName} *</Label>
              <Input
                value={company.name}
                onChange={(e) => set("name")(e.target.value)}
                disabled={disabled || loading}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tp.ice} *</Label>
                <Input
                  value={company.ice}
                  onChange={(e) => set("ice")(e.target.value)}
                  disabled={disabled || loading || iceLocked}
                />
                {iceLocked && (
                  <p className="text-xs text-muted-foreground">
                    {tp.iceLocked}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{tp.rc}</Label>
                <Input
                  value={company.rc}
                  onChange={(e) => set("rc")(e.target.value)}
                  disabled={disabled || loading}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tp.city} *</Label>
                <Input
                  value={company.city}
                  onChange={(e) => set("city")(e.target.value)}
                  disabled={disabled || loading}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp.companyPhone} *</Label>
                <Input
                  value={company.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  disabled={disabled || loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{tp.officeAddress}</Label>
              <Input
                value={company.office_address}
                onChange={(e) => set("office_address")(e.target.value)}
                disabled={disabled || loading}
              />
            </div>
            <div className="space-y-2">
              <Label>{tp.storageOffice}</Label>
              <Input
                value={company.storage_office}
                onChange={(e) => set("storage_office")(e.target.value)}
                disabled={disabled || loading}
              />
            </div>

            {editing && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                  {tp.cancel}
                </Button>
                <Button onClick={save} disabled={saving || !dirty}>
                  {saving ? tp.saving : tp.save}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </main>
      <Footer />

      <ConfirmDiscardDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={tp.discardTitle}
        description={tp.discardDesc}
        cancelLabel={tp.keepEditing}
        confirmLabel={tp.discard}
        onConfirm={discard}
      />
      <ConfirmDiscardDialog
        open={confirmPersonalOpen}
        onOpenChange={setConfirmPersonalOpen}
        title={tp.discardTitle}
        description={tp.discardDesc}
        cancelLabel={tp.keepEditing}
        confirmLabel={tp.discard}
        onConfirm={discardPersonal}
      />
    </div>
  );
};

export default Profile;
