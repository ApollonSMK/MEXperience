import { Suspense } from 'react';
import TermosDeCondicaoView from '@/components/termos-de-condicao-view';

export default function TermosDeCondicaoPage() {
    return (
        <Suspense fallback={<div>Chargement des termes...</div>}>
            <TermosDeCondicaoView />
        </Suspense>
    )
}