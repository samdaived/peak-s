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
import { useEffect, useMemo, useState } from "react";
import { ConfirmDiscardDialog } from "@/components/ConfirmDiscardDialog";
import { Plus } from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  company: string | null;
};

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

type UserState = { full_name: string; phone: string; company: string };
type CompanyState = Omit<CompanyRow, "id">;

const emptyUser: UserState = { full_name: "", phone: "", company: "" };
const emptyCompany: CompanyState = {
  name: "",
  ice: "",
  rc: "",
  city: "",
  phone: "",
  office_address: "",
  storage_office: "",
};

export const AdminUsers = () => {
  const { t } = useLanguage();
  const tp: any = (t as any).profile;
  const ta: any = (t as any).admin;

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [email, setEmail] = useState("");

  // user form
  const [userOriginal, setUserOriginal] = useState<UserState>(emptyUser);
  const [userForm, setUserForm] = useState<UserState>(emptyUser);
  const [editingUser, setEditingUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [confirmUserOpen, setConfirmUserOpen] = useState(false);

  // company form
  const [companyOriginal, setCompanyOriginal] =
    useState<CompanyState>(emptyCompany);
  const [companyForm, setCompanyForm] = useState<CompanyState>(emptyCompany);
  const [editingCompany, setEditingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [confirmCompanyOpen, setConfirmCompanyOpen] = useState(false);

  // new company creation form
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompany, setNewCompany] = useState<CompanyState>(emptyCompany);
  const [creating, setCreating] = useState(false);

  // new user signup form
  const [signupOpen, setSignupOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });
  const [signingUp, setSigningUp] = useState(false);

  const signupUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      return toast({
        title: ta.error,
        description: ta.emailPasswordRequired ?? "Email and password required",
        variant: "destructive",
      });
    }
    setSigningUp(true);
    const { error } = await supabase.auth.signUp({
      email: newUser.email.trim(),
      password: newUser.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: newUser.full_name.trim(),
          phone: newUser.phone.trim(),
        },
      },
    });
    setSigningUp(false);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: ta.userCreated ?? "User created" });
    setSignupOpen(false);
    setNewUser({ email: "", password: "", full_name: "", phone: "" });
    await loadAll();
  };


  const userDirty = useMemo(
    () => JSON.stringify(userForm) !== JSON.stringify(userOriginal),
    [userForm, userOriginal],
  );
  const companyDirty = useMemo(
    () => JSON.stringify(companyForm) !== JSON.stringify(companyOriginal),
    [companyForm, companyOriginal],
  );

  const loadAll = async () => {
    const [{ data: ps }, { data: cs }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,phone,company")
        .order("email"),
      supabase
        .from("companies")
        .select("id,name,ice,rc,city,phone,office_address,storage_office")
        .order("name"),
    ]);
    setProfiles((ps as any) ?? []);
    setCompanies((cs as any) ?? []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pickCompanyState = (cid: string): CompanyState => {
    const c = companies.find((x) => x.id === cid);
    return c
      ? {
          name: c.name ?? "",
          ice: c.ice ?? "",
          rc: c.rc ?? "",
          city: c.city ?? "",
          phone: c.phone ?? "",
          office_address: c.office_address ?? "",
          storage_office: c.storage_office ?? "",
        }
      : emptyCompany;
  };

  const pickUser = (uid: string) => {
    setSelectedUserId(uid);
    const p = profiles.find((x) => x.id === uid);
    if (!p) return;
    setEmail(p.email ?? "");
    const u: UserState = {
      full_name: p.full_name ?? "",
      phone: p.phone ?? "",
      company: p.company ?? "",
    };
    setUserOriginal(u);
    setUserForm(u);
    setEditingUser(false);

    const c = pickCompanyState(p.company ?? "");
    setCompanyOriginal(c);
    setCompanyForm(c);
    setEditingCompany(false);
  };

  const cancelUser = () => {
    if (userDirty) setConfirmUserOpen(true);
    else setEditingUser(false);
  };
  const discardUser = () => {
    setUserForm(userOriginal);
    setEditingUser(false);
    setConfirmUserOpen(false);
  };

  const saveUser = async () => {
    if (!selectedUserId) return;
    setSavingUser(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: userForm.full_name.trim() || null,
        phone: userForm.phone.trim() || null,
        company: userForm.company || null,
      })
      .eq("id", selectedUserId);
    setSavingUser(false);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: tp.saved });
    setUserOriginal(userForm);
    setEditingUser(false);
    // if company assignment changed, refresh company form too
    const c = pickCompanyState(userForm.company);
    setCompanyOriginal(c);
    setCompanyForm(c);
    setEditingCompany(false);
    await loadAll();
  };

  const cancelCompany = () => {
    if (companyDirty) setConfirmCompanyOpen(true);
    else setEditingCompany(false);
  };
  const discardCompany = () => {
    setCompanyForm(companyOriginal);
    setEditingCompany(false);
    setConfirmCompanyOpen(false);
  };

  const saveCompany = async () => {
    const cid = userForm.company || userOriginal.company;
    if (!cid) return;
    setSavingCompany(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: companyForm.name.trim(),
        ice: companyForm.ice.trim(),
        rc: companyForm.rc.trim(),
        city: companyForm.city.trim(),
        phone: companyForm.phone.trim(),
        office_address: companyForm.office_address.trim(),
        storage_office: companyForm.storage_office.trim(),
      })
      .eq("id", cid);
    setSavingCompany(false);
    if (error)
      return toast({
        title: ta.error,
        description: error.message,
        variant: "destructive",
      });
    toast({ title: tp.saved });
    setCompanyOriginal(companyForm);
    setEditingCompany(false);
    await loadAll();
  };

  const createCompany = async () => {
    setCreating(true);
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: newCompany.name.trim(),
        ice: newCompany.ice.trim(),
        rc: newCompany.rc.trim(),
        city: newCompany.city.trim(),
        phone: newCompany.phone.trim(),
        office_address: newCompany.office_address.trim(),
        storage_office: newCompany.storage_office.trim(),
      })
      .select("id")
      .single();
    setCreating(false);
    if (error || !data)
      return toast({
        title: ta.error,
        description: error?.message,
        variant: "destructive",
      });
    toast({ title: tp.saved });
    setCreatingCompany(false);
    setNewCompany(emptyCompany);
    await loadAll();
    // auto-assign to current user form (admin can save it)
    if (selectedUserId) {
      setUserForm((u) => ({ ...u, company: (data as any).id }));
      setEditingUser(true);
    }
  };

  const setU = (k: keyof UserState) => (v: string) =>
    setUserForm((u) => ({ ...u, [k]: v }));
  const setC = (k: keyof CompanyState) => (v: string) =>
    setCompanyForm((c) => ({ ...c, [k]: v }));
  const setN = (k: keyof CompanyState) => (v: string) =>
    setNewCompany((c) => ({ ...c, [k]: v }));

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px] space-y-2">
            <Label>{ta.selectUser}</Label>
            <Select value={selectedUserId} onValueChange={pickUser}>
              <SelectTrigger>
                <SelectValue placeholder={ta.selectUser} />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.email ?? p.id.slice(0, 8)}
                    {p.full_name ? ` — ${p.full_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={() => setSignupOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {ta.signUpUser ?? "Sign up user"}
          </Button>
        </div>
      </Card>

      {signupOpen && (
        <Card className="p-6 space-y-4 border-primary/50">
          <h3 className="font-semibold">{ta.newUser ?? "New user"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{tp.email}</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{(t as any).login?.password ?? "Password"}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{tp.fullName}</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, full_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{tp.phone}</Label>
              <Input
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setSignupOpen(false);
                setNewUser({ email: "", password: "", full_name: "", phone: "" });
              }}
              disabled={signingUp}
            >
              {tp.cancel}
            </Button>
            <Button onClick={signupUser} disabled={signingUp}>
              {signingUp ? tp.saving : ta.create ?? "Create"}
            </Button>
          </div>
        </Card>
      )}


      {selectedUserId && (
        <>
          {/* USER FORM */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {ta.userForm} — {tp.personalSection}
              </h3>
              {!editingUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(true)}
                >
                  {tp.edit}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>{tp.email}</Label>
              <Input value={email} disabled />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{tp.fullName}</Label>
                <Input
                  value={userForm.full_name}
                  onChange={(e) => setU("full_name")(e.target.value)}
                  disabled={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp.phone}</Label>
                <Input
                  value={userForm.phone}
                  onChange={(e) => setU("phone")(e.target.value)}
                  disabled={!editingUser}
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <Label>{ta.assignCompany}</Label>
              <div className="flex gap-2">
                <Select
                  value={userForm.company}
                  onValueChange={(v) => {
                    setU("company")(v);
                    const c = pickCompanyState(v);
                    setCompanyOriginal(c);
                    setCompanyForm(c);
                    setEditingCompany(false);
                  }}
                  disabled={!editingUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ta.assignCompany} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatingCompany(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {ta.addCompany}
                </Button>
              </div>
            </div>

            {editingUser && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={cancelUser}
                  disabled={savingUser}
                >
                  {tp.cancel}
                </Button>
                <Button onClick={saveUser} disabled={savingUser || !userDirty}>
                  {savingUser ? tp.saving : tp.save}
                </Button>
              </div>
            )}
          </Card>

          {/* NEW COMPANY FORM */}
          {creatingCompany && (
            <Card className="p-6 space-y-4 border-primary/50">
              <h3 className="font-semibold">{ta.newCompany}</h3>
              <div className="space-y-2">
                <Label>{tp.companyName}</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setN("name")(e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tp.ice}</Label>
                  <Input
                    value={newCompany.ice}
                    onChange={(e) => setN("ice")(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tp.rc}</Label>
                  <Input
                    value={newCompany.rc}
                    onChange={(e) => setN("rc")(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tp.city}</Label>
                  <Input
                    value={newCompany.city}
                    onChange={(e) => setN("city")(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tp.companyPhone}</Label>
                  <Input
                    value={newCompany.phone}
                    onChange={(e) => setN("phone")(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tp.officeAddress}</Label>
                <Input
                  value={newCompany.office_address}
                  onChange={(e) => setN("office_address")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp.storageOffice}</Label>
                <Input
                  value={newCompany.storage_office}
                  onChange={(e) => setN("storage_office")(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setCreatingCompany(false);
                    setNewCompany(emptyCompany);
                  }}
                  disabled={creating}
                >
                  {tp.cancel}
                </Button>
                <Button onClick={createCompany} disabled={creating}>
                  {creating ? tp.saving : ta.createCompany}
                </Button>
              </div>
            </Card>
          )}

          {/* COMPANY FORM */}
          {userForm.company && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {ta.companyForm} — {tp.companySection}
                </h3>
                {!editingCompany && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCompany(true)}
                  >
                    {tp.edit}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>{tp.companyName}</Label>
                <Input
                  value={companyForm.name}
                  onChange={(e) => setC("name")(e.target.value)}
                  disabled={!editingCompany}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tp.ice}</Label>
                  <Input
                    value={companyForm.ice}
                    onChange={(e) => setC("ice")(e.target.value)}
                    disabled={!editingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tp.rc}</Label>
                  <Input
                    value={companyForm.rc}
                    onChange={(e) => setC("rc")(e.target.value)}
                    disabled={!editingCompany}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tp.city}</Label>
                  <Input
                    value={companyForm.city}
                    onChange={(e) => setC("city")(e.target.value)}
                    disabled={!editingCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tp.companyPhone}</Label>
                  <Input
                    value={companyForm.phone}
                    onChange={(e) => setC("phone")(e.target.value)}
                    disabled={!editingCompany}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tp.officeAddress}</Label>
                <Input
                  value={companyForm.office_address}
                  onChange={(e) => setC("office_address")(e.target.value)}
                  disabled={!editingCompany}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp.storageOffice}</Label>
                <Input
                  value={companyForm.storage_office}
                  onChange={(e) => setC("storage_office")(e.target.value)}
                  disabled={!editingCompany}
                />
              </div>

              {editingCompany && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={cancelCompany}
                    disabled={savingCompany}
                  >
                    {tp.cancel}
                  </Button>
                  <Button
                    onClick={saveCompany}
                    disabled={savingCompany || !companyDirty}
                  >
                    {savingCompany ? tp.saving : tp.save}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      <ConfirmDiscardDialog
        open={confirmUserOpen}
        onOpenChange={setConfirmUserOpen}
        title={tp.discardTitle}
        description={tp.discardDesc}
        cancelLabel={tp.keepEditing}
        confirmLabel={tp.discard}
        onConfirm={discardUser}
      />
      <ConfirmDiscardDialog
        open={confirmCompanyOpen}
        onOpenChange={setConfirmCompanyOpen}
        title={tp.discardTitle}
        description={tp.discardDesc}
        cancelLabel={tp.keepEditing}
        confirmLabel={tp.discard}
        onConfirm={discardCompany}
      />
    </div>
  );
};
