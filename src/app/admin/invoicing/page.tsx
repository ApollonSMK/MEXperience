'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getBillingRecords, BillingRecord } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfMonth, startOfWeek, startOfYear, isWithinInterval, parseISO, startOfQuarter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, FileText, Calendar as CalendarIcon, CreditCard, TrendingUp, DollarSign, Wallet, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { InvoiceDocument } from '@/components/invoice-document';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export default function InvoicingPage() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // day, week, month, quarter, year, custom
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: new Date() });
  
  // PDF Generation State
  const printRef = useRef<HTMLDivElement>(null);
  const [printingRecord, setPrintingRecord] = useState<BillingRecord | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await getBillingRecords();
        setRecords(data);
      } catch (error) {
        console.error("Failed to load records", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtering Logic
  useEffect(() => {
    if (!records.length) {
        setFilteredRecords([]);
        return;
    }

    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'day':
        start = new Date(today.setHours(0,0,0,0));
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        break;
      case 'quarter':
        start = startOfQuarter(today);
        break;
      case 'year':
        start = startOfYear(today);
        break;
      case 'custom':
        if (dateRange?.from) start = dateRange.from;
        if (dateRange?.to) end = dateRange.to;
        break;
    }

    // Set end of day for the end date
    end.setHours(23, 59, 59, 999);

    const filtered = records.filter(rec => {
      const recDate = parseISO(rec.date);
      return isWithinInterval(recDate, { start, end });
    });

    setFilteredRecords(filtered);
  }, [period, dateRange, records]);

  // Aggregations
  const stats = useMemo(() => {
    const totalRevenue = filteredRecords.reduce((acc, curr) => acc + curr.amount, 0);
    const methodStats = filteredRecords.reduce((acc, curr) => {
        // Normalizar método para exibição
        let method = curr.method;
        if (curr.method.toLowerCase().includes('stripe')) method = 'Stripe (Web)';
        else if (curr.method.toLowerCase().includes('carte')) method = 'TPE (Carte)';
        else if (curr.method.toLowerCase().includes('esp')) method = 'Espèces';
        else if (curr.method.toLowerCase().includes('cadeau')) method = 'Chèque Cadeau';

        acc[method] = (acc[method] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(methodStats).map(key => ({ name: key, value: methodStats[key] }));

    // Group by Date for Bar Chart
    const timelineDataMap = filteredRecords.reduce((acc, curr) => {
        const dateKey = format(parseISO(curr.date), 'dd/MM');
        acc[dateKey] = (acc[dateKey] || 0) + curr.amount;
        return acc;
    }, {} as Record<string, number>);
    
    // Sort timeline based on date
    const timelineData = Object.keys(timelineDataMap)
        .sort((a, b) => { 
            const [da, ma] = a.split('/').map(Number);
            const [db, mb] = b.split('/').map(Number);
            return ma - mb || da - db;
        })
        .map(key => ({ date: key, amount: timelineDataMap[key] }));

    return { totalRevenue, methodStats, chartData, timelineData };
  }, [filteredRecords]);

  // Actions
  const handleDownloadCSV = () => {
    const headers = ['ID', 'Date', 'Client', 'Description', 'Méthode', 'Montant'];
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => 
        [r.id, r.date, `"${r.client}"`, `"${r.description}"`, r.method, r.amount].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `facturation_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDownloadReportPDF = () => {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(20);
      doc.text("Rapport Financier - M.E Experience", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      const periodText = period === 'custom' && dateRange?.from && dateRange?.to
        ? `Période: ${format(dateRange.from, 'dd/MM/yyyy')} au ${format(dateRange.to, 'dd/MM/yyyy')}`
        : `Période: ${period.charAt(0).toUpperCase() + period.slice(1)} (Généré le ${format(new Date(), 'dd/MM/yyyy')})`;
      doc.text(periodText, 14, 30);

      // Resumo Financeiro
      doc.setDrawColor(200);
      doc.line(14, 35, 196, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Résumé", 14, 45);
      
      doc.setFontSize(10);
      doc.text(`Chiffre d'Affaires: ${stats.totalRevenue.toFixed(2)}€`, 14, 52);
      doc.text(`Nombre de Transactions: ${filteredRecords.length}`, 14, 58);
      doc.text(`Panier Moyen: ${(filteredRecords.length ? stats.totalRevenue / filteredRecords.length : 0).toFixed(2)}€`, 14, 64);

      // Detalhes por Método
      doc.text("Détail par Source:", 110, 45);
      let yPos = 52;
      stats.chartData.forEach(item => {
          doc.text(`- ${item.name}: ${item.value.toFixed(2)}€`, 110, yPos);
          yPos += 6;
      });

      // Tabela de Transações
      autoTable(doc, {
        startY: Math.max(yPos, 70) + 10,
        head: [['Date', 'Client', 'Description', 'Méthode', 'Montant']],
        body: filteredRecords.map(r => [
            format(parseISO(r.date), 'dd/MM/yyyy HH:mm'),
            r.client,
            r.description,
            r.method,
            r.amount.toFixed(2) + '€'
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [20, 20, 20] }, // Dark header
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`rapport_financier_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleDownloadPDF = async (record: BillingRecord) => {
    setPrintingRecord(record);
    // Aguarda renderização
    setTimeout(async () => {
        if (printRef.current) {
            try {
                const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`recu_${record.id.replace('inv_', '')}.pdf`);
            } catch (err) {
                console.error("PDF generation failed", err);
            } finally {
                setPrintingRecord(null);
            }
        }
    }, 100);
  };

  const getMethodBadge = (method: string) => {
      const m = method.toLowerCase();
      if (m.includes('stripe')) return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200">Stripe</Badge>;
      if (m.includes('carte')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Carte TPE</Badge>;
      if (m.includes('esp')) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Espèces</Badge>;
      if (m.includes('cadeau')) return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100 border-pink-200">Chèque Cadeau</Badge>;
      return <Badge variant="outline">{method}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Hidden container for PDF Generation */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {printingRecord && <InvoiceDocument ref={printRef} data={printingRecord} />}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Rapports Financiers</h1>
            <p className="text-muted-foreground">Analysez vos revenus, abonnements et paiements ponctuels.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadReportPDF} disabled={isLoading || filteredRecords.length === 0}>
                <FileText className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadCSV} disabled={isLoading || filteredRecords.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1.5 rounded-lg border">
        <Tabs value={period} onValueChange={setPeriod} className="w-full md:w-auto">
            <TabsList>
                <TabsTrigger value="day">Aujourd'hui</TabsTrigger>
                <TabsTrigger value="week">Semaine</TabsTrigger>
                <TabsTrigger value="month">Mois</TabsTrigger>
                <TabsTrigger value="quarter">Trimestre</TabsTrigger>
                <TabsTrigger value="year">Année</TabsTrigger>
                <TabsTrigger value="custom">Personnalisé</TabsTrigger>
            </TabsList>
        </Tabs>
        
        {period === 'custom' && (
             <div className="flex items-center gap-2">
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>{format(dateRange.from, "dd MMM", {locale:fr})} - {format(dateRange.to, "dd MMM", {locale:fr})}</>
                        ) : (
                        format(dateRange.from, "dd MMM yyyy", {locale:fr})
                        )
                    ) : (
                        <span>Selectionner dates</span>
                    )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={fr}
                    />
                </PopoverContent>
                </Popover>
             </div>
        )}
      </div>

      {isLoading ? (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      ) : (
      <>
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
                    <p className="text-xs text-muted-foreground">sur la période sélectionnée</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{filteredRecords.length}</div>
                    <p className="text-xs text-muted-foreground">paiements reçus</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {filteredRecords.length ? (stats.totalRevenue / filteredRecords.length).toFixed(2) : 0}€
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Méthode</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate text-primary">
                        {stats.chartData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 shadow-sm">
                <CardHeader>
                    <CardTitle>Évolution du Chiffre d'Affaires</CardTitle>
                    <CardDescription>Revenus journaliers sur la période</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.timelineData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                />
                                <YAxis 
                                    stroke="#888888" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}€`}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [`${value}€`, 'Revenu']}
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="amount" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-3 shadow-sm">
                <CardHeader>
                    <CardTitle>Répartition par Source</CardTitle>
                    <CardDescription>Méthodes de paiement utilisées</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {stats.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => [`${value.toFixed(2)}€`, 'Montant']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                        {stats.chartData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span>{entry.name} ({((entry.value / stats.totalRevenue) * 100).toFixed(0)}%)</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Detailed Table */}
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Historique des Transactions</CardTitle>
                <CardDescription>Liste détaillée de toutes les transactions sur la période.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="text-right">Document</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRecords.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-32 text-muted-foreground">Aucune transaction trouvée sur cette période.</TableCell></TableRow>
                        ) : (
                            filteredRecords.map((record) => (
                                <TableRow key={record.id} className="group">
                                    <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                                        {format(parseISO(record.date), 'dd MMM yyyy HH:mm', { locale: fr })}
                                    </TableCell>
                                    <TableCell className="font-medium">{record.client}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{record.description}</TableCell>
                                    <TableCell>{getMethodBadge(record.method)}</TableCell>
                                    <TableCell className="text-right font-bold text-gray-700">{record.amount.toFixed(2)}€</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => handleDownloadPDF(record)}
                                            disabled={!!printingRecord}
                                            className="text-muted-foreground hover:text-primary"
                                        >
                                            {printingRecord?.id === record.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4 mr-1"/>}
                                            Reçu
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </>
      )}
    </div>
  );
}