export type Entry = {
  id: string;
  name: string;
  area: string;
  category: string;
  date: string;
  rating: number;
  notes: string;
  lat: number;
  lng: number;
  photos: string[];
  demo?: boolean;
};
export const EXAMPLES: Entry[] = [
  {
    id: 'sample-1',
    name: 'طاولة إيطالية',
    area: 'الرياض · العليا',
    category: 'إيطالي',
    date: '2026-09-05',
    rating: 5,
    notes:
      'بيتزا بحواف مقرمشة، وبوراتا طازجة… من تلك الوجبات التي تستحق أن نبطئ لأجلها.',
    lat: 24.7003,
    lng: 46.6802,
    photos: ['/images/example-pizza-memory.webp'],
    demo: true,
  },
  {
    id: 'sample-2',
    name: 'جلسة آخر النهار',
    area: 'الرياض · السليمانية',
    category: 'مقهى',
    date: '2026-09-02',
    rating: 0,
    notes: 'مكان هادئ، ووقت جميل. سأعود لأكتب تفاصيل هذه التجربة.',
    lat: 24.7132,
    lng: 46.6995,
    photos: [],
    demo: true,
  },
];
export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'long',
    calendar: 'gregory',
  }).format(new Date(date + 'T12:00:00'));
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
