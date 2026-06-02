
import { POSType, POSStatus, PointOfSale, Reward } from './types';

const currentMonthStr = new Date().toISOString().substring(0, 7); // "2024-03" par exemple

export const MOCK_POS: PointOfSale[] = [
  {
    id: '1',
    name: 'Café de la Paix',
    type: POSType.CAFE,
    address: 'Avenue Mohammed V, Casablanca',
    lat: 33.5892,
    lng: -7.6031,
    status: POSStatus.CONFIRMED,
    lastConfirmedAt: new Date().toISOString(),
    confirmedByCount: 12,
    monthlyValidationCount: 3,
    lastValidationMonth: currentMonthStr,
    photoUrl: 'https://picsum.photos/seed/cafe/400/300'
  },
  {
    id: '2',
    name: 'Épicerie Al-Andalus',
    type: POSType.EPICERIE,
    address: 'Rue de Tanger, Rabat',
    lat: 34.0209,
    lng: -6.8416,
    status: POSStatus.NOT_CONFIRMED,
    lastConfirmedAt: '2023-11-15T10:00:00Z',
    confirmedByCount: 2,
    monthlyValidationCount: 9, // Proche de la limite
    lastValidationMonth: currentMonthStr,
    photoUrl: 'https://picsum.photos/seed/grocery/400/300'
  },
  {
    id: '3',
    name: 'Restaurant Le Marrakech',
    type: POSType.RESTAURANT,
    address: 'Guéliz, Marrakech',
    lat: 31.6295,
    lng: -7.9811,
    status: POSStatus.CONFIRMED,
    lastConfirmedAt: new Date().toISOString(),
    confirmedByCount: 45,
    monthlyValidationCount: 10, // LIMITE ATTEINTE : devrait être caché pour les consommateurs
    lastValidationMonth: currentMonthStr,
    photoUrl: 'https://picsum.photos/seed/rest/400/300'
  }
];

export const MOCK_REWARDS: Reward[] = [
  {
    id: 'r1',
    title: '-20% sur votre addition',
    description: 'Valable pour tout déjeuner en semaine.',
    pointsCost: 500,
    partnerName: 'Restaurant Le Marrakech'
  },
  {
    id: 'r2',
    title: 'Café offert',
    description: 'Un café noir ou au lait gratuit.',
    pointsCost: 150,
    partnerName: 'Café de la Paix'
  },
  {
    id: 'r3',
    title: '50 DH de réduction',
    description: 'Dès 300 DH d\'achat.',
    pointsCost: 1000,
    partnerName: 'Supermarché BIM'
  }
];
