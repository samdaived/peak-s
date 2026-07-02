import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/customSupabase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  from: "buyer" | "admin";
  text: string;
  at: string;
};

type Thread = {
  id: string;
  orderId: string;
  issueType: string;
  status: "open" | "in_progress" | "resolved";
  messages: Message[];
  created_at: string;
};

type OrderRow = { id: string; created_at: string; status: string };

const Reports = () => {
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const o: any = t.orders;
  const ta: any = (t as any).admin;
  const nav: any = t.nav;

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [reportOrderId, setReportOrderId] = useState("");
  const [issueType, setIssueType] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, created_at, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  }, [user]);

  const issueOptions = [
    { value: "wrong_item", label: o.issueWrongItem },
    { value: "damaged", label: o.issueDamaged },
    { value: "missing", label: o.issueMissing },
    { value: "late", label: o.issueLate },
    { value: "other", label: o.issueOther },
  ];

  const issueLabel = (v: string) =>
    issueOptions.find((x) => x.value === v)?.label ?? v;

  const statusLabel = (s: Thread["status"]) =>
    s === "resolved"
      ? o.reportResolved
      : s === "in_progress"
        ? o.reportInProgress
        : o.reportOpen;

  const statusBadge = (s: Thread["status"]) => {
    const color =
      s === "resolved"
        ? "bg-green-500/10 text-green-700 dark:text-green-400"
        : s === "in_progress"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400";
    return (
      <span className={cn("text-xs px-2 py-0.5 rounded-full", color)}>
        {statusLabel(s)}
      </span>
    );
  };

  const selected = useMemo(
    () => threads.find((x) => x.id === selectedId),
    [threads, selectedId],
  );

  const submitReport = () => {
    if (!reportOrderId || !issueType || !message.trim()) {
      toast({ title: o.error, variant: "destructive" });
      return;
    }
    const newThread: Thread = {
      id: `local-${Date.now()}`,
      orderId: reportOrderId,
      issueType,
      status: "open",
      created_at: new Date().toISOString(),
      messages: [
        {
          id: `m-${Date.now()}`,
          from: "buyer",
          text: message.trim(),
          at: new Date().toISOString(),
        },
      ],
    };
    setThreads((prev) => [newThread, ...prev]);
    setSelectedId(newThread.id);
    setReportOrderId("");
    setIssueType("");
    setMessage("");
    setCreating(false);
    toast({ title: o.reportSubmitted });
  };

  const sendReply = () => {
    if (!selected || !draft.trim()) return;
    setThreads((prev) =>
      prev.map((th) =>
        th.id === selected.id
          ? {
              ...th,
              messages: [
                ...th.messages,
                {
                  id: `m-${Date.now()}`,
                  from: "buyer",
                  text: draft.trim(),
                  at: new Date().toISOString(),
                },
              ],
            }
          : th,
      ),
    );
    setDraft("");
  };

  const pageTitle = nav.myReports ?? "My orders / Reports";

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
            <div className="flex gap-2">
              <Link to="/orders">
                <Button variant="outline">{o.title}</Button>
              </Link>
              <Button onClick={() => setCreating((s) => !s)}>
                <Plus className="h-4 w-4 mr-2" />
                {o.reportIssue}
              </Button>
            </div>
          </div>

          {creating && (
            <Card className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{o.reportIssue}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{o.order}</Label>
                  <Select
                    value={reportOrderId}
                    onValueChange={setReportOrderId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={o.selectOrder} />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((ord) => (
                        <SelectItem key={ord.id} value={ord.id}>
                          #{ord.id.slice(0, 8)} —{" "}
                          {new Date(ord.created_at).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{o.issueType}</Label>
                  <Select value={issueType} onValueChange={setIssueType}>
                    <SelectTrigger>
                      <SelectValue placeholder={o.selectIssue} />
                    </SelectTrigger>
                    <SelectContent>
                      {issueOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{o.message}</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setCreating(false)}>
                  {o.cancel}
                </Button>
                <Button onClick={submitReport}>{o.submitReport}</Button>
              </div>
            </Card>
          )}

          {threads.length === 0 && !creating ? (
            <Card className="p-8 text-center text-muted-foreground">
              {o.noReports}
            </Card>
          ) : threads.length === 0 ? null : (
            <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[70vh]">
              {/* Threads list */}
              <Card className="p-2 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-1 p-1">
                    {threads.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setSelectedId(th.id)}
                        className={cn(
                          "w-full text-left rounded-lg p-3 transition-colors border",
                          selectedId === th.id
                            ? "bg-accent border-primary/40"
                            : "border-transparent hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{th.orderId.slice(0, 8)}
                          </span>
                          {statusBadge(th.status)}
                        </div>
                        <div className="text-sm font-medium truncate">
                          {issueLabel(th.issueType)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {new Date(th.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              {/* Chat */}
              <Card className="flex flex-col overflow-hidden">
                {selected ? (
                  <>
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">
                          #{selected.orderId.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {issueLabel(selected.issueType)}
                        </div>
                      </div>
                      {statusBadge(selected.status)}
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {selected.messages.map((m) => {
                          const mine = m.from === "buyer";
                          return (
                            <div
                              key={m.id}
                              className={cn(
                                "flex gap-3",
                                mine ? "flex-row-reverse" : "flex-row",
                              )}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {mine ? "M" : "A"}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                  mine
                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                    : "bg-muted rounded-tl-sm",
                                )}
                              >
                                <div>{m.text}</div>
                                <div
                                  className={cn(
                                    "text-[10px] mt-1 opacity-70",
                                    mine ? "text-right" : "text-left",
                                  )}
                                >
                                  {new Date(m.at).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <div className="p-3 border-t flex gap-2">
                      <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                        placeholder={ta.typeReply ?? "Type your message..."}
                      />
                      <Button onClick={sendReply} disabled={!draft.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                    {o.noReports}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reports;
