
import type { LucideIcon } from 'lucide-react';
import { Sun, Waves, Dna, Sunrise } from 'lucide-react';

export type Service = {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: string; // Now a string
  imageId: string;
  durations: number[];
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
    imageId: 'collagen-boost',
    durations: [20, 30],
  },
  {
    id: 'solarium',
    name: 'Solarium',
    description:
      'Obtenha um bronzeado dourado perfeito em nosso solário de última geração.',
    longDescription:
      'Nossos solários são equipados com a mais recente tecnologia para garantir um bronzeado seguro, uniforme e duradouro. Relaxe e desfrute de um brilho beijado pelo sol durante todo o ano.',
    icon: 'Sun',
    imageId: 'solarium',
    durations: [5, 10, 15],
  },
  {
    id: 'hydromassage',
    name: 'Hydromassage',
    description: 'Relaxe e alivie a tensão muscular com jatos de água potentes.',
    longDescription:
      'Mergulhe em relaxamento profundo com nossas camas de hidromassagem. Jatos de água aquecida massageiam seu corpo, aliviando dores, melhorando a circulação e promovendo uma sensação de bem-estar.',
    icon: 'Waves',
    imageId: 'hydromassage',
    durations: [15],
  },
  {
    id: 'infrared-dome',
    name: 'Domo de Infravermelho',
    description:
      'Desintoxique seu corpo e acalme sua mente em nosso domo de infravermelho.',
    longDescription:
      'A terapia de infravermelho distante em nosso domo de sauna pessoal ajuda a desintoxicar o corpo em nível celular, queimar calorias, aliviar a dor e reduzir o estresse. Uma experiência de bem-estar rejuvenescedora.',
    icon: 'Sunrise',
    imageId: 'infrared-dome',
    durations: [20],
  },
];
