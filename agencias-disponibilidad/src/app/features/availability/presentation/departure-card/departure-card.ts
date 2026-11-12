import { DatePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { PluralizePipe } from '../../../../shared/pipes/pluralize.pipe';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { Itinerary } from '../../domain/availability.models';
import { currentPrice, discountPercent, isLowStock, nightsOf, occupancyOf } from '../../domain/availability.rules';
import { islandName, languageName } from '../availability.labels';
import { shipTypePresentation } from '../ship-type-presentation';

@Component({
  selector: 'app-departure-card',
  imports: [DatePipe, PluralizePipe, PricePipe],
  templateUrl: './departure-card.html',
  styleUrl: './departure-card.scss',
})
export class DepartureCard {
  readonly itinerary = input.required<Itinerary>();
  readonly shipType = input.required<number>();

  protected readonly cabinsOpen = signal(false);
  protected readonly islandName = islandName;

  protected readonly presentation = computed(() => shipTypePresentation(this.shipType()));
  protected readonly nights = computed(() => nightsOf(this.itinerary()));
  protected readonly discount = computed(() => discountPercent(this.itinerary()));
  protected readonly finalPrice = computed(() => currentPrice(this.itinerary()));
  protected readonly lowStock = computed(() => isLowStock(this.itinerary()));
  protected readonly occupancy = computed(() => occupancyOf(this.itinerary()));
  protected readonly language = computed(() => languageName(this.itinerary().guide.language));
  protected readonly cabinCount = computed(() => this.itinerary().cabin?.length ?? 0);

  protected toggleCabins(): void {
    this.cabinsOpen.update((open) => !open);
  }
}
