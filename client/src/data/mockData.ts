import dress1 from '@/assets/dress1.jpg';
import dress2 from '@/assets/dress2.jpg';
import dress3 from '@/assets/dress3.jpg';
import dress4 from '@/assets/dress4.jpg';
import dress5 from '@/assets/dress5.jpg';
import dress6 from '@/assets/dress6.jpg';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: 'wedding' | 'graduation' | 'evening';
  size: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  color: string;
  brand: string;
  measurements: { bust: string; waist: string; hips: string; length: string };
  images: string[];
  seller: { id: string; name: string; avatar: string; rating: number; listings: number; location: string; memberSince: string; isVerified?: boolean };
  shop?: { id: string; name: string; slug: string; logoUrl?: string };
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Елегантна розова сатенена рокля',
    description: 'Прекрасна розова сатенена рокля за бал или специален повод. Носена само веднъж. Включва калъф за съхранение.',
    price: 350,
    originalPrice: 890,
    category: 'graduation',
    size: 'S',
    condition: 'like-new',
    color: 'Розово',
    brand: 'Vera Wang',
    measurements: { bust: '84 см', waist: '64 см', hips: '90 см', length: '155 см' },
    images: [dress1],
    seller: { id: 's1', name: 'Мария Иванова', avatar: '', rating: 4.8, listings: 5, location: 'София', memberSince: '2024' },
    createdAt: '2025-02-20',
  },
  {
    id: '2',
    title: 'Класическа сватбена рокля с дантела',
    description: 'Изящна сватбена рокля с детайли от дантела и тюл. Перфектно състояние, професионално почистена.',
    price: 1200,
    originalPrice: 3500,
    category: 'wedding',
    size: 'M',
    condition: 'like-new',
    color: 'Слонова кост',
    brand: 'Pronovias',
    measurements: { bust: '88 см', waist: '68 см', hips: '94 см', length: '170 см' },
    images: [dress2],
    seller: { id: 's2', name: 'Елена Петрова', avatar: '', rating: 5.0, listings: 3, location: 'Пловдив', memberSince: '2023' },
    createdAt: '2025-02-18',
  },
  {
    id: '3',
    title: 'Шампанска вечерна рокля',
    description: 'Луксозна вечерна рокля в шампанско злато. Идеална за абитуриентски бал или гала вечер.',
    price: 280,
    originalPrice: 650,
    category: 'evening',
    size: 'M',
    condition: 'good',
    color: 'Шампанско',
    brand: 'BCBG',
    measurements: { bust: '86 см', waist: '66 см', hips: '92 см', length: '160 см' },
    images: [dress3],
    seller: { id: 's3', name: 'Десислава Тодорова', avatar: '', rating: 4.5, listings: 8, location: 'Варна', memberSince: '2024' },
    createdAt: '2025-02-15',
  },
  {
    id: '4',
    title: 'Лавандулова тюлена рокля',
    description: 'Нежна лавандулова рокля от тюл с кристални детайли. Перфектна за абитуриентски бал.',
    price: 420,
    originalPrice: 950,
    category: 'graduation',
    size: 'S',
    condition: 'new',
    color: 'Лавандула',
    brand: 'Marchesa',
    measurements: { bust: '82 см', waist: '62 см', hips: '88 см', length: '158 см' },
    images: [dress4],
    seller: { id: 's4', name: 'Ивана Димитрова', avatar: '', rating: 4.9, listings: 2, location: 'Бургас', memberSince: '2025' },
    createdAt: '2025-02-22',
  },
  {
    id: '5',
    title: 'Бяла дантелена сватбена рокля',
    description: 'Романтична сватбена рокля с дълги ръкави от дантела. Силует А-линия. Професионално изпрана.',
    price: 900,
    originalPrice: 2800,
    category: 'wedding',
    size: 'S',
    condition: 'like-new',
    color: 'Бяло',
    brand: 'Rosa Clará',
    measurements: { bust: '84 см', waist: '64 см', hips: '90 см', length: '165 см' },
    images: [dress5],
    seller: { id: 's1', name: 'Мария Иванова', avatar: '', rating: 4.8, listings: 5, location: 'София', memberSince: '2024' },
    createdAt: '2025-02-10',
  },
  {
    id: '6',
    title: 'Зелена шифонена вечерна рокля',
    description: 'Елегантна зелена рокля от шифон. Лека и женствена, подходяща за кумуване или тържество.',
    price: 200,
    originalPrice: 480,
    category: 'evening',
    size: 'L',
    condition: 'good',
    color: 'Зелено',
    brand: 'Jenny Packham',
    measurements: { bust: '92 см', waist: '74 см', hips: '100 см', length: '162 см' },
    images: [dress6],
    seller: { id: 's3', name: 'Десислава Тодорова', avatar: '', rating: 4.5, listings: 8, location: 'Варна', memberSince: '2024' },
    createdAt: '2025-02-08',
  },
];

export const mockReviews: Review[] = [
  { id: 'r1', sellerId: 's1', userName: 'Анна К.', rating: 5, comment: 'Роклята е точно като на снимките! Много доволна съм.', createdAt: '2025-02-22' },
  { id: 'r2', sellerId: 's1', userName: 'Петя М.', rating: 4, comment: 'Красива рокля, бърза доставка. Леко по-дълга от очакваното.', createdAt: '2025-02-21' },
  { id: 'r3', sellerId: 's2', userName: 'Силвия Д.', rating: 5, comment: 'Абсолютно перфектна сватбена рокля! Препоръчвам!', createdAt: '2025-02-20' },
  { id: 'r4', sellerId: 's3', userName: 'Виктория С.', rating: 4, comment: 'Много хубава рокля за цената.', createdAt: '2025-02-17' },
  { id: 'r5', sellerId: 's4', userName: 'Габриела Р.', rating: 5, comment: 'Вълшебна рокля! Получих много комплименти на бала.', createdAt: '2025-02-24' },
  { id: 'r6', sellerId: 's1', userName: 'Надежда И.', rating: 5, comment: 'Сватбената ми рокля от мечтите! Благодаря!', createdAt: '2025-02-12' },
];
