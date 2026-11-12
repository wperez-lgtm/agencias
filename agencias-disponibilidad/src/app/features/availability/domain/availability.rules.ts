import { AvailabilitySummary, Itinerary, Occupancy, Ship, ShipAvailability } from './availability.models';

const MS_PER_DAY = 86_400_000;
const LOW_STOCK_THRESHOLD = 2;

export const DEFAULT_MIN_FREE = 1;
export const NO_SHIP_SELECTED = '';

export function currentPrice(itinerary: Itinerary): number {
  return itinerary.promo?.amount ?? itinerary.price;
}

export function discountPercent({ price, promo }: Itinerary): number {
  return promo?.amount != null && price > 0 ? Math.round(((price - promo.amount) / price) * 100) : 0;
}

/** Una combinación como "C+A" vende los mismos espacios que sus itinerarios por separado. */
function isCombinedItinerary({ name }: Itinerary): boolean {
  return name.includes('+');
}

export function nightsOf({ date }: Itinerary): number {
  return Math.round((Date.parse(`${date.end}T00:00Z`) - Date.parse(`${date.start}T00:00Z`)) / MS_PER_DAY);
}

export function isLowStock(itinerary: Itinerary): boolean {
  return itinerary.free <= LOW_STOCK_THRESHOLD;
}

function percentOf(part: number, total: number): number {
  return total > 0 ? Math.min(100, (Math.max(part, 0) / total) * 100) : 0;
}

export function occupancyOf({ free, hold, capacity }: Itinerary): Occupancy {
  const freePercent = percentOf(free, capacity);
  return { freePercent, holdPercent: Math.min(percentOf(hold, capacity), 100 - freePercent) };
}

/** Deja solo las salidas con espacio suficiente; una salida agotada nunca se considera disponible. */
export function filterAvailableShips(ships: Ship[], minFree: number): ShipAvailability[] {
  const requiredFree = Math.max(minFree, DEFAULT_MIN_FREE);
  return ships
    .map((ship) => ({
      ...ship,
      itinerary: ship.itinerary.filter((itinerary) => itinerary.free >= requiredFree),
    }))
    .filter((ship) => ship.itinerary.length > 0)
    .map((ship) => ({ ...ship, fromPrice: Math.min(...ship.itinerary.map(currentPrice)) }));
}

export function filterBySelectedShip(ships: ShipAvailability[], selectedShip: string): ShipAvailability[] {
  return selectedShip === NO_SHIP_SELECTED ? ships : ships.filter((ship) => ship.name === selectedShip);
}

export function summarizeAvailability(ships: ShipAvailability[]): AvailabilitySummary {
  const itineraries = ships.flatMap((ship) => ship.itinerary);
  return {
    departures: itineraries.length,
    ships: ships.length,
    freeSpaces: itineraries
      .filter((itinerary) => !isCombinedItinerary(itinerary))
      .reduce((total, itinerary) => total + itinerary.free, 0),
    promotions: itineraries.filter((itinerary) => itinerary.promo !== null).length,
  };
}
