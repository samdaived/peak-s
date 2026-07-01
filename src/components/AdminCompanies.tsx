import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/customSupabase";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CompanyRow = {
  id: string;
  name: string;
  ice: string;
  rc: string;
  city: string;
  phone: string;
  office_address: string;
  storage_office: string;
};

type CompanyState = Omit<CompanyRow, "id">;

const empty: CompanyState = {
  name: "",
  ice: "",
  rc: "",
  city: "",
  phone: "",
  office_address: "",
  storage_office: "",
};

export const AdminCompanies = () => {
  const { t } = useLanguage();
  const tp: any = (t as any).profile;
  const ta: any = (t as any).admin;

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [form, setForm] = useState<CompanyState>(empty);
  const [original, setOriginal] = useState<CompanyState>(empty);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newC, setNewC] = useState<CompanyState>(empty);
  const [creatingLoad, setCreatingLoad] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(original),
    [form, original],
  );

  const load = async () => {
    const { data } = await supabase
      .from("companies")
      .select("id,name,ice,rc,city,phone,office_address,storage_office")
      .order("name");
    setCompanies((data as any) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const pick = (id: string) => {
    setSelectedId(id);
    const c = companies.find((x) => x.id === id);
    if (!c) return;
    const s: CompanyState = {
      name: c.name ?? "",
      ice: c.ice ?? "",
      rc: c.rc ?? "",
      city: c.city ?? "",
      phone: c.phone ?? "",
      office_address: c.office_address ?? "",
      storage_office: c.storage_office ?? "",
    };
    setForm(s);
    setOriginal(s);
    setEditing(false);
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: form.name.trim(),
        ice: form.ice.trim(),
        rc: form.rc.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
        office_address: form.office_address.trim(),
        storage_office: form.storage_office.trim(),
      })
      .eq("id", selectedId);
    setSaving(false);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: tp.saved });
    setOriginal(form);
    setEditing(false);
    await load();
  };

  const create = async () => {
    setCreatingLoad(true);
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: newC.name.trim(),
        ice: newC.ice.trim(),
        rc: newC.rc.trim(),
        city: newC.city.trim(),
        phone: newC.phone.trim(),
        office_address: newC.office_address.trim(),
        storage_office: newC.storage_office.trim(),
      })
      .select("id")
      .single();
    setCreatingLoad(false);
    if (error || !data)
      return toast({
        title: ta.error,
        description: error?.message,
        variant: "destructive",
      });
    toast({ title: tp.saved });
    setCreating(false);
    setNewC(empty);
    await load();
    setSelectedId((data as any).id);
    pick((data as any).id);
  };

  const set = (k: keyof CompanyState) => (v: string) =>
    setForm((c) => ({ ...c, [k]: v }));
  const setNew = (k: keyof CompanyState) => (v: string) =>
    setNewC((c) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-2">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px] space-y-2">
            <Label>{(ta.selectCompany ?? "Select company")}</Label>
            <Select value={selectedId} onValueChange={pick}>
              <SelectTrigger>
                <SelectValue placeholder={ta.selectCompany ?? "Select company"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {ta.addCompany}
          </Button>
        </div>
      </Card>

      {creating && (
        <Card className="p-6 space-y-4 border-primary/50">
          <h3 className="font-semibold">{ta.newCompany}</h3>
          <div className="space-y-2">
            <Label>{tp.companyName}</Label>
            <Input value={newC.name} onChange={(e) => setNew("name")(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tp.ice}</Label>
              <Input value={newC.ice} onChange={(e) => setNew("ice")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tp.rc}</Label>
              <Input value={newC.rc} onChange={(e) => setNew("rc")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tp.city}</Label>
              <Input value={newC.city} onChange={(e) => setNew("city")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{tp.companyPhone}</Label>
              <Input value={newC.phone} onChange={(e) => setNew("phone")(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{tp.officeAddress}</Label>
            <Input
              value={newC.office_address}
              onChange={(e) => setNew("office_address")(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tp.storageOffice}</Label>
            <Input
              value={newC.storage_office}
              onChange={(e) => setNew("storage_office")(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewC(empty);
              }}
              disabled={creatingLoad}
            >
              {tp.cancel}
            </Button>
            <Button onClick={create} disabled={creatingLoad}>
              {creatingLoad ? tp.saving : ta.createCompany}
            </Button>
          </div>
        </Card>
      )}

      {selectedId && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{ta.companyForm}</h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                {tp.edit}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label>{tp.companyName}</Label>
            <Input value={form.name} onChange={(e) => set("name")(e.target.value)} disabled={!editing} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tp.ice}</Label>
              <Input value={form.ice} onChange={(e) => set("ice")(e.target.value)} disabled={!editing} />
            </div>
            <div className="space-y-2">
              <Label>{tp.rc}</Label>
              <Input value={form.rc} onChange={(e) => set("rc")(e.target.value)} disabled={!editing} />
            </div>
            <div className="space-y-2">
              <Label>{tp.city}</Label>
              <Input value={form.city} onChange={(e) => set("city")(e.target.value)} disabled={!editing} />
            </div>
            <div className="space-y-2">
              <Label>{tp.companyPhone}</Label>
              <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} disabled={!editing} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{tp.officeAddress}</Label>
            <Input
              value={form.office_address}
              onChange={(e) => set("office_address")(e.target.value)}
              disabled={!editing}
            />
          </div>
          <div className="space-y-2">
            <Label>{tp.storageOffice}</Label>
            <Input
              value={form.storage_office}
              onChange={(e) => set("storage_office")(e.target.value)}
              disabled={!editing}
            />
          </div>
          {editing && (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setForm(original);
                  setEditing(false);
                }}
                disabled={saving}
              >
                {tp.cancel}
              </Button>
              <Button onClick={save} disabled={saving || !dirty}>
                {saving ? tp.saving : tp.save}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
