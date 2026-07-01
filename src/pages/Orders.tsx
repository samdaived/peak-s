import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/customSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ARCHIVED_ORDER_STATUSES } from '@/lib/translations';

type OrderItem = {
  id: string;
  quantity: number;
  date_needed: string | null;
  unit_price: number;
  products: { name: string; sku: string } | null;
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  order_items: OrderItem[];
};

type IssueReport = {
  id: string;
  order_id: string;
  issue_type: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
};

const Orders = () => {
  const { user } = useAuth();
  const { t, direction } = useLanguage();
  const o: any = t.orders;
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [reportOrderId, setReportOrderId] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*, order_items(*, products(name, sku))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const activeOrders = useMemo(() => orders.filter((x) => !ARCHIVED_ORDER_STATUSES.has(x.status.toLowerCase())), [orders]);
  const archivedOrders = useMemo(() => orders.filter((x) => ARCHIVED_ORDER_STATUSES.has(x.status.toLowerCase())), [orders]);

  const statusLabel = (s: string) => (t.status as any)[s.toLowerCase()] ?? s;

  const issueOptions = [
    { value: 'wrong_item', label: o.issueWrongItem },
    { value: 'damaged', label: o.issueDamaged },
    { value: 'missing', label: o.issueMissing },
    { value: 'late', label: o.issueLate },
    { value: 'other', label: o.issueOther },
  ];

  const reportStatusLabel = (s: IssueReport['status']) =>
    s === 'open' ? o.reportOpen : s === 'in_progress' ? o.reportInProgress : o.reportResolved;
  const reportStatusVariant = (s: IssueReport['status']) =>
    s === 'resolved' ? 'secondary' : s === 'in_progress' ? 'default' : 'destructive';

  const submitReport = async () => {
    if (!reportOrderId || !issueType || !message.trim()) {
      toast({ title: o.error, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    // FE-only — backend wiring will be added later.
    const newReport: IssueReport = {
      id: `local-${Date.now()}`,
      order_id: reportOrderId,
      issue_type: issueType,
      message: message.trim(),
      status: 'open',
      created_at: new Date().toISOString(),
    };
    setReports((r) => [newReport, ...r]);
    setReportOrderId('');
    setIssueType('');
    setMessage('');
    setSubmitting(false);
    toast({ title: o.reportSubmitted });
  };

  const renderOrders = (list: Order[]) => {
    if (list.length === 0) {
      return <Card className="p-8 text-center text-muted-foreground">{o.empty}</Card>;
    }
    return list.map((row) => (
      <Card key={row.id} className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-mono text-xs text-muted-foreground">#{row.id.slice(0, 8)}</div>
            <div className="text-sm">{o.created}: {new Date(row.created_at).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{o.updated}: {new Date(row.updated_at).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">{statusLabel(row.status)}</Badge>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{o.product}</TableHead>
              <TableHead>{o.qty}</TableHead>
              <TableHead>{o.neededBy}</TableHead>
              <TableHead className="text-right">{o.unitPrice}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {row.order_items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.products?.name ?? '—'}</TableCell>
                <TableCell>{it.quantity}</TableCell>
                <TableCell>{it.date_needed ? new Date(it.date_needed).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right">{Number(it.unit_price).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-between text-sm">
          <div className="text-muted-foreground">
            {row.phone && <div>{o.phone}: {row.phone}</div>}
            {row.shipping_address && <div>{o.shipTo}: {row.shipping_address}</div>}
          </div>
          <div className="font-bold text-lg">{o.total}: {Number(row.total).toFixed(2)} MAD</div>
        </div>
      </Card>
    ));
  };

  return (
    <div dir={direction} className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-24 md:pt-28">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold">{o.title}</h1>
            <Link to="/prices"><Button variant="outline">{o.back}</Button></Link>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">{o.active} ({activeOrders.length})</TabsTrigger>
              <TabsTrigger value="archive">{o.archive} ({archivedOrders.length})</TabsTrigger>
              <TabsTrigger value="reports">{o.reports} ({reports.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              {renderOrders(activeOrders)}
            </TabsContent>
            <TabsContent value="archive" className="space-y-4">
              {renderOrders(archivedOrders)}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">{o.reportIssue}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{o.order}</Label>
                    <Select value={reportOrderId} onValueChange={setReportOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder={o.selectOrder} />
                      </SelectTrigger>
                      <SelectContent>
                        {orders.map((ord) => (
                          <SelectItem key={ord.id} value={ord.id}>
                            #{ord.id.slice(0, 8)} — {new Date(ord.created_at).toLocaleDateString()} — {statusLabel(ord.status)}
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
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                <div className="flex justify-end">
                  <Button onClick={submitReport} disabled={submitting}>
                    {o.submitReport}
                  </Button>
                </div>
              </Card>

              {reports.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">{o.noReports}</Card>
              ) : (
                <Card className="p-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{o.order}</TableHead>
                        <TableHead>{o.issueType}</TableHead>
                        <TableHead>{o.message}</TableHead>
                        <TableHead>{o.created}</TableHead>
                        <TableHead className="text-right">{o.reportStatus}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((r) => {
                        const label = issueOptions.find((x) => x.value === r.issue_type)?.label ?? r.issue_type;
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs">#{r.order_id.slice(0, 8)}</TableCell>
                            <TableCell>{label}</TableCell>
                            <TableCell className="max-w-xs truncate" title={r.message}>{r.message}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(r.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={reportStatusVariant(r.status) as any}>
                                {reportStatusLabel(r.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
