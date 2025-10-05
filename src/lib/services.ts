
import type { LucideIcon } from 'lucide-react';
import { Sun, Waves, Dna, Sunrise } from 'lucide-react';

export type Service = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string; // Now a string
  imageId: string; // Now a URL
  durations: number[];
  allowed_plans: string[] | null;
  created_at?: string;
};

// This is now just fallback data or for seeding
export const services: Service[] = [
  {
    id: 'collagen-boost',
    name: 'Collagen Boost',
    description:
      'Rejuvenesça a sua pele e aumente a produção natural de colagénio.',
    longDescription:
      'Nossas sessões de Collagen Boost utilizam terapia de luz vermelha para estimular a produção de colágeno, resultando em uma pele mais firme, suave e jovem. Reduz a aparência de linhas finas e rugas.',
    icon: 'Dna',
    imageId: 'https://images.unsplash.com/photo-1706304003186-61fa7521c236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjb2xsYWdlbiUyMG1hY2hpbmV8ZW58MHx8fHwxNzU4ODM5MjQ2fDA&ixlib.rb-4.1.0&q=80&w=1080',
    durations: [20, 30],
    allowed_plans: ['Plano Bronze', 'Plano Prata', 'Plano Gold'],
  },
  {
    id: 'solarium',
    name: 'Solarium',
    description:
      'Obtenha um bronzeado dourado perfeito em nosso solário de última geração.',
    longDescription:
      'Nossos solários são equipados com a mais recente tecnologia para garantir um bronzeado seguro, uniforme e duradouro. Relaxe e desfrute de um brilho beijado pelo sol durante todo o ano.',
    icon: 'Sun',
    imageId: 'https://images.unsplash.com/photo-1542719069-e41dc4429159?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzb2xhcml1bSUyMGJlZHxlbnwwfHx8fDE3NTg4Mzg4OTl8MA&ixlib.rb-4.1.0&q=80&w=1080',
    durations: [5, 10, 15],
    allowed_plans: ['Plano Gold'],
  },
  {
    id: 'hydromassage',
    name: 'Hydromassage',
    description: 'Relaxe e alivie a tensão muscular com jatos de água potentes.',
    longDescription:
      'Mergulhe em relaxamento profundo com nossas camas de hidromassagem. Jatos de água aquecida massageiam seu corpo, aliviando dores, melhorando a circulação e promovendo uma sensação de bem-estar.',
    icon: 'Waves',
    imageId: 'https://images.unsplash.com/photo-1629706167621-07b6bcc3da29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8aHlkcm9tYXNzYWdlJTIwbWFjaGluZXxlbnwwfHx8fDE3NTg4MzkyNDZ8MA&ixlib.rb-4.1.0&q=80&w=1080',
    durations: [15],
    allowed_plans: ['Plano Prata', 'Plano Gold'],
  },
  {
    id: 'infrared-dome',
    name: 'Domo de Infravermelho',
    description:
      'Desintoxique seu corpo e acalme sua mente em nosso domo de infravermelho.',
    longDescription:
      'A terapia de infravermelho distante em nosso domo de sauna pessoal ajuda a desintoxicar o corpo em nível celular, queimar calorias, aliviar a dor e reduzir o estresse. Uma experiência de bem-estar rejuvenescedora.',
    icon: 'Sunrise',
    imageId: 'https://images.unsplash.com/photo-1730126299144-b70da0a8293a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxpbmZyYXJlZCUyMGRvbWV8ZW58MHx8fHwxNzU4ODM5MjQ3fDA&ixlib.rb-4.1.0&q=80&w=1080',
    durations: [20],
    allowed_plans: ['Plano Bronze', 'Plano Prata', 'Plano Gold'],
  },
];
