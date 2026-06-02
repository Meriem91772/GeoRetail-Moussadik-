
export enum UserRole {
  CONSUMER = 'CONSUMER',
  OWNER = 'OWNER'
}

export enum POSType {
  CAFE = 'Café',
  RESTAURANT = 'Restaurant',
  EPICERIE = 'Épicerie',
  SUPERETTE = 'Supérette',
  SUPERMARCHE = 'Supermarché',
  GRANDE_SURFACE = 'Grande Surface',
  AUTRE = 'Autre'
}

export enum POSStatus {
  CONFIRMED = 'Existant et confirmé',
  NOT_CONFIRMED = 'Non confirmé',
  CLOSED = 'Fermé / n’existe plus'
}

export interface PointOfSale {
  id: string;
  name: string;
  type: POSType;
  address: string;
  lat: number;
  lng: number;
  status: POSStatus;
  lastConfirmedAt: string;
  ownerId?: string;
  photoUrl?: string;
  confirmedByCount: number;
  monthlyValidationCount: number; // Nombre de validations ce mois-ci
  lastValidationMonth: string;    // Format "YYYY-MM" pour réinitialisation
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  points: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  partnerName: string;
}
