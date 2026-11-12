import { Component, computed, inject } from '@angular/core';

import { PluralizePipe } from '../../../../shared/pipes/pluralize.pipe';
import { PricePipe } from '../../../../shared/pipes/price.pipe';
import { AvailabilityStore } from '../../application/availability.store';
import { DepartureCard } from '../departure-card/departure-card';
import { SearchForm } from '../search-form/search-form';
import { shipTypePresentation } from '../ship-type-presentation';

const SKELETON_ROWS = [1, 2, 3, 4];

@Component({
  selector: 'app-availability-page',
  imports: [DepartureCard, PluralizePipe, PricePipe, SearchForm],
  templateUrl: './availability-page.html',
  styleUrl: './availability-page.scss',
})
export class AvailabilityPage {
  protected readonly store = inject(AvailabilityStore);
  protected readonly skeletonRows = SKELETON_ROWS;
  protected readonly shipTypePresentation = shipTypePresentation;

  protected readonly shipNames = computed(() => this.store.availableShips().map((ship) => ship.name));

  protected scrollToShip(index: number): void {
    document.getElementById(`ship-${index}`)?.scrollIntoView({ behavior: 'smooth' });
  }
}
