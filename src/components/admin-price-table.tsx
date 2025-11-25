'use client';

import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Service } from '@/app/admin/services/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminPriceTableProps {
  services: Service[];
}

export function AdminPriceTable({ services }: AdminPriceTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    const input = tableRef.current;
    if (!input) {
        toast({
            variant: "destructive",
            title: "Erro ao gerar PDF",
            description: "Não foi possível encontrar a tabela para download.",
        });
        return;
    }

    toast({
        title: "Gerando PDF...",
        description: "Aguarde um momento enquanto preparamos seu download.",
    });

    try {
        const canvas = await html2canvas(input, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#ffffff', // Explicitly set a white background
        });

        const imgData = canvas.toDataURL('image/png');
        
        // A4 dimensions in points: 595.28 x 841.89
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Calculate the aspect ratio
        const ratio = canvasWidth / canvasHeight;
        let imgWidth = pdfWidth - 40; // with margin
        let imgHeight = imgWidth / ratio;

        // If the image is too high, resize based on height
        if (imgHeight > pdfHeight - 40) {
            imgHeight = pdfHeight - 40;
            imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = 20; // top margin

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save(`tabela-de-precos-${new Date().toISOString().slice(0, 10)}.pdf`);

        toast({
            title: "Download Iniciado!",
            description: "O seu PDF da tabela de preços começou a ser baixado.",
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            variant: "destructive",
            title: "Erro ao gerar PDF",
            description: "Ocorreu um erro inesperado. Tente novamente.",
        });
    }
  };

  // Filter out services that don't have pricing tiers
  const servicesWithPrices = services.filter(s => s.pricing_tiers && s.pricing_tiers.length > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Tabela de Preços Geral</CardTitle>
            <CardDescription>Visão geral de todos os serviços e seus preços para download.</CardDescription>
          </div>
          <Button onClick={handleDownloadPdf} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Baixar Tabela (PDF)
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={tableRef} className="p-6 bg-white text-black rounded-lg">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Tabela de Preços</h2>
            <p className="text-sm text-gray-500">Válido a partir de {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b-gray-300">
                <TableHead className="font-bold text-gray-700 w-[50%]">Serviço</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Duração (min)</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesWithPrices.flatMap((service, serviceIndex) => (
                service.pricing_tiers.map((tier, tierIndex) => (
                  <TableRow key={`${service.id}-${tier.duration}`} className={serviceIndex < servicesWithPrices.length - 1 && tierIndex === service.pricing_tiers.length - 1 ? 'border-b-2 border-gray-200' : ''}>
                    {tierIndex === 0 ? (
                      <TableCell rowSpan={service.pricing_tiers.length} className="font-semibold text-gray-800 align-top pt-4">
                        {service.name}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right text-gray-600">{tier.duration}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-gray-800">€{tier.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}