import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useMemo, useState } from "react";

type Message = {
  id: string;
  from: "buyer" | "admin";
  text: string;
  at: string;
};

type Thread = {
  id: string;
  orderId: string;
  buyer: string;
  issueType: string;
  status: "open" | "in_progress" | "resolved";
  messages: Message[];
};

// FE-only mock threads (backend wiring pending).
const mockThreads: Thread[] = [
  {
    id: "r1",
    orderId: "8a2f1c9d",
    buyer: "acme@example.com",
    issueType: "Damaged product",
    status: "open",
    messages: [
      {
        id: "m1",
        from: "buyer",
        text: "Two boxes arrived crushed.",
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ],
  },
  {
    id: "r2",
    orderId: "4bd0e77a",
    buyer: "pharma@example.com",
    issueType: "Late delivery",
    status: "in_progress",
    messages: [
      {
        id: "m2",
        from: "buyer",
        text: "Order still not delivered after 10 days.",
        at: new Date(Date.now() - 7200_000).toISOString(),
      },
      {
        id: "m3",
        from: "admin",
        text: "We are contacting the carrier — ETA tomorrow.",
        at: new Date(Date.now() - 3600_000).toISOString(),
      },
    ],
  },
];

export const AdminReports = () => {
  const { t } = useLanguage();
  const ta: any = (t as any).admin;
  const to: any = (t as any).orders;

  const [threads, setThreads] = useState<Thread[]>(mockThreads);
  const [selectedId, setSelectedId] = useState<string>(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const selected = useMemo(
    () => threads.find((x) => x.id === selectedId),
    [threads, selectedId],
  );

  const sendReply = () => {
    if (!selected || !draft.trim()) return;
    setThreads((prev) =>
      prev.map((th) =>
        th.id === selected.id
          ? {
              ...th,
              status: "in_progress",
              messages: [
                ...th.messages,
                {
                  id: `m-${Date.now()}`,
                  from: "admin",
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

  const statusBadge = (s: Thread["status"]) => {
    const label =
      s === "resolved"
        ? to.reportResolved
        : s === "in_progress"
          ? to.reportInProgress
          : to.reportOpen;
    const color =
      s === "resolved"
        ? "bg-green-500/10 text-green-700 dark:text-green-400"
        : s === "in_progress"
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400";
    return (
      <span className={cn("text-xs px-2 py-0.5 rounded-full", color)}>
        {label}
      </span>
    );
  };

  return (
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
                    #{th.orderId}
                  </span>
                  {statusBadge(th.status)}
                </div>
                <div className="text-sm font-medium truncate">{th.buyer}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {th.issueType}
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
                <div className="font-semibold text-sm">{selected.buyer}</div>
                <div className="text-xs text-muted-foreground">
                  #{selected.orderId} — {selected.issueType}
                </div>
              </div>
              {statusBadge(selected.status)}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selected.messages.map((m) => {
                  const mine = m.from === "admin";
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
                          {mine ? "A" : selected.buyer.slice(0, 1).toUpperCase()}
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
                placeholder={ta.typeReply ?? "Type your reply..."}
              />
              <Button onClick={sendReply} disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {to.noReports}
          </div>
        )}
      </Card>
    </div>
  );
};
