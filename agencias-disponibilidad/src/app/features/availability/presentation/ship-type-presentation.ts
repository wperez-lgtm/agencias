import { Itinerary, ShipType } from '../domain/availability.models';

export interface ShipTypePresentation {
  label: string;
  priceNote: string;
  itineraryTitle(itinerary: Itinerary): string;
}

const CRUISE: ShipTypePresentation = {
  label: 'Crucero',
  priceNote: 'por persona, doble acomodación',
  itineraryTitle: ({ name }) => `Itinerario ${name}`,
};

const DAILY_TOUR: ShipTypePresentation = {
  label: 'Tour diario',
  priceNote: 'por persona',
  itineraryTitle: ({ name }) => name,
};

/** Strategy: un tipo de barco nuevo solo requiere registrar su presentación aquí. */
const PRESENTATIONS: Readonly<Record<number, ShipTypePresentation>> = {
  [ShipType.Cruise]: CRUISE,
  [ShipType.DailyTour]: DAILY_TOUR,
};

export function shipTypePresentation(type: number): ShipTypePresentation {
  return PRESENTATIONS[type] ?? CRUISE;
}
