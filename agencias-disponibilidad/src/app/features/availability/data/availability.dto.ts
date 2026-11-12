import { Itinerary, Ship } from '../domain/availability.models';

/** La API envía los precios de paquete como número o como texto. */
export type PriceDto = number | string | null;

export interface PackagePricesDto {
  normal: PriceDto;
  save: PriceDto;
  promo: PriceDto;
}

export interface ItineraryDto extends Omit<Itinerary, 'package'> {
  package: PackagePricesDto;
}

export interface ShipDto extends Omit<Ship, 'itinerary'> {
  itinerary: ItineraryDto[];
}

export interface AvailabilityResponseDto {
  successful: boolean;
  /** Nulo cuando no hay salidas para el rango consultado. */
  data: { ship: ShipDto[] } | null;
}
