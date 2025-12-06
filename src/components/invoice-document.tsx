'use client';

import React, { forwardRef } from 'react';
import { BillingRecord } from '@/app/admin/invoicing/actions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvoiceDocumentProps {
  data: BillingRecord;
}

export const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(({ data }, ref) => {
  return (
    <div ref={ref} className="bg-white p-12 max-w-3xl mx-auto text-black font-sans leading-relaxed" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header with Brand */}
      <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">M.E Experience</h1>
          <p className="text-gray-500 mt-2 text-sm">Votre espace de bien-être</p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-600 mb-2">
            REÇU #{data.id.replace('inv_', '').replace('apt_', '').substring(0, 8).toUpperCase()}
          </div>
          <p className="text-gray-900 font-medium">{format(new Date(data.date), 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      {/* Client & Vendor Info */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Émis par</h3>
            <p className="font-semibold text-gray-900">M.E Experience</p>
            <p className="text-gray-500 text-sm">20 Grand-Rue, 3650 Tétange</p>
            <p className="text-gray-500 text-sm">Luxembourg</p>
            <div className="mt-2">
                <p className="text-gray-500 text-sm">contact@me-experience.lu</p>
                <p className="text-gray-500 text-sm">+352 691 389 519</p>
            </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturé à</h3>
          <p className="text-xl font-bold text-gray-900">{data.client}</p>
          <p className="text-gray-500 text-sm">Client Membre</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-12">
        <table className="w-full">
            <thead>
                <tr className="border-b-2 border-gray-900">
                    <th className="text-left py-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Description</th>
                    <th className="text-right py-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Méthode</th>
                    <th className="text-right py-4 text-sm font-bold text-gray-900 uppercase tracking-wide">Montant</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {data.description.includes('|') ? (
                    data.description.split('|').map((item, index) => {
                        const cleanItem = item.trim();
                        // Tenta extrair o preço do final da string se possível, ou deixa vazio na coluna preço
                        // Ex: "Item - 50€" -> Desc: "Item", Price: "50€"
                        const match = cleanItem.match(/(.*)(:?)(-?\d+(?:\.\d+)?€)$/);
                        const desc = match ? match[1].replace(/-$/, '').trim() : cleanItem;
                        const price = match ? match[3] : '';

                        return (
                            <tr key={index}>
                                <td className="py-4 text-gray-800 font-medium">{desc}</td>
                                <td className="py-4 text-right text-gray-600 text-sm">{index === 0 ? data.method : ''}</td>
                                <td className="py-4 text-right text-gray-900">{price}</td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td className="py-6 text-gray-800 font-medium">{data.description}</td>
                        <td className="py-6 text-right text-gray-600 text-sm">{data.method}</td>
                        <td className="py-6 text-right text-lg font-bold text-gray-900">{data.amount.toFixed(2)}€</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end border-t border-gray-200 pt-8">
        <div className="w-1/3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-medium">{data.amount.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Taxes (inclus)</span>
            <span className="font-medium">{(data.amount * 0.2).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between py-4">
            <span className="text-lg font-bold text-gray-900">Total Payé</span>
            <span className="text-2xl font-bold text-indigo-600">{data.amount.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-gray-100 text-center">
        <p className="text-gray-900 font-medium mb-1">Merci de votre confiance.</p>
        <p className="text-gray-500 text-sm">Si vous avez des questions concernant cette facture, contactez-nous au +352 691 389 519.</p>
      </div>
    </div>
  );
});

InvoiceDocument.displayName = 'InvoiceDocument';