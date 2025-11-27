'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Invoice {
    id: string;
    date: string;
    amount: number;
    status: string;
    plan_title?: string;
}

interface UserProfile {
    display_name?: string | null;
    email?: string | null;
}

interface InvoiceDocumentProps {
    invoice: Invoice;
    user: UserProfile | null;
}

export function InvoiceDocument({ invoice, user }: InvoiceDocumentProps) {
    return (
        <div className="bg-white text-black p-12 font-sans w-[800px]">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">M.E Experience</h1>
                    <p className="text-gray-500">20 Grand-Rue, 3650 Tétange, Luxembourg</p>
                    <p className="text-gray-500">Tél: +352 691 389 519</p>
                    <p className="text-gray-500">E-mail: contact@me-experience.lu</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-bold text-gray-700">FACTURE</h2>
                    <p className="text-gray-500 mt-1"># {invoice.id}</p>
                </div>
            </div>

            <div className="flex justify-between mb-12">
                <div>
                    <h3 className="font-semibold text-gray-600 mb-1">FACTURÉ À</h3>
                    <p className="font-bold">{user?.display_name || 'Client'}</p>
                    <p>{user?.email}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold text-gray-600">Date de facturation :</span> {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
                    <p><span className="font-semibold text-gray-600">Date d'échéance :</span> {format(new Date(invoice.date), 'd MMMM yyyy', { locale: fr })}</p>
                </div>
            </div>

            <table className="w-full mb-12">
                <thead className="border-b-2 border-gray-300">
                    <tr className="text-left text-gray-600">
                        <th className="py-2 font-semibold">DESCRIPTION</th>
                        <th className="py-2 font-semibold text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-gray-200">
                        <td className="py-4">{invoice.plan_title || 'Serviço Avulso'}</td>
                        <td className="py-4 text-right">€{invoice.amount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <div className="w-1/2">
                    <div className="flex justify-between text-gray-700 mb-2">
                        <p>Sous-total</p>
                        <p>€{invoice.amount.toFixed(2)}</p>
                    </div>
                    <div className="border-t-2 border-gray-300 my-2"></div>
                    <div className="flex justify-between items-baseline font-bold text-xl text-gray-800">
                        <p>TOTAL</p>
                        <p>
                            €{invoice.amount.toFixed(2)}
                            <span className="text-xs font-normal text-gray-500 ml-2">(TVA incluse)</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center text-gray-500 text-sm mt-16">
                <p>Merci pour votre confiance.</p>
                <p>Si vous avez des questions concernant cette facture, n'hésitez pas à nous contacter.</p>
            </div>
        </div>
    );
}