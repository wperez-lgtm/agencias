export const ShipType = {
  Cruise: 1,
  DailyTour: 5,
} as const;

export interface DateRange {
  /** yyyy-MM-dd */
  start: string;
  /** yyyy-MM-dd */
  end: string;
}

export interface Promo {
  /** Fecha de caducidad de la promoción. */
  date: string;
  /** Nulo cuando la promoción es solo un beneficio, como "Free Air Ticket", sin rebaja de precio. */
  amount: number | null;
  observation: string | null;
}

export interface Accommodation {
  id: number;
  name: string;
  share: boolean;
  space: number;
  price: number;
  promo: number | null;
}

export interface Cabin {
  id: number;
  name: string;
  deck: string;
  accom: Accommodation[];
}

export interface PackagePrices {
  normal: number | null;
  save: number | null;
  promo: number | null;
}

export interface Itinerary {
  id: number;
  name: string;
  acronym: string;
  date: DateRange;
  /** Ausente en los tours diarios. */
  island?: { start: string; end: string };
  guide: { language: string };
  free: number;
  hold: number;
  single: number;
  capacity: number;
  price: number;
  promo: Promo | null;
  package: PackagePrices;
  cabin: Cabin[] | null;
  /** Solo tours diarios: cubierta de los espacios generales. */
  deck?: string;
}

export interface Ship {
  name: string;
  type: number;
  itinerary: Itinerary[];
}

export interface ShipAvailability extends Ship {
  fromPrice: number;
}

export interface AvailabilitySummary {
  departures: number;
  ships: number;
  freeSpaces: number;
  promotions: number;
}

export interface Occupancy {
  freePercent: number;
  holdPercent: number;
}
