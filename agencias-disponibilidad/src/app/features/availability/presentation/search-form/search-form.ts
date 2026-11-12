import { Component, OnInit, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { addDays, toIsoDate, todayIsoDate } from '../../../../shared/date/iso-date';
import { DateRange } from '../../domain/availability.models';
import { DEFAULT_MIN_FREE, NO_SHIP_SELECTED } from '../../domain/availability.rules';
import { dateRangeValidator } from './date-range.validator';

const DEFAULT_RANGE_DAYS = 30;

@Component({
  selector: 'app-search-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-form.html',
  styleUrl: './search-form.scss',
})
export class SearchForm implements OnInit {
  readonly shipNames = input.required<string[]>();
  readonly selectedShip = input<string>(NO_SHIP_SELECTED);
  readonly loading = input(false);

  readonly searchRequested = output<DateRange>();
  readonly shipSelected = output<string>();
  readonly minFreeChanged = output<number>();

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      shipName: [NO_SHIP_SELECTED],
      start: [todayIsoDate(), Validators.required],
      end: [toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS)), Validators.required],
      minFree: [DEFAULT_MIN_FREE],
    },
    { validators: dateRangeValidator(todayIsoDate) },
  );

  constructor() {
    const { shipName, minFree } = this.form.controls;

    shipName.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => this.shipSelected.emit(name));
    minFree.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.minFreeChanged.emit(Number(value) || 0));

    effect(() => shipName.setValue(this.selectedShip(), { emitEvent: false }));
  }

  ngOnInit(): void {
    this.submit();
  }

  protected changeMinFree(delta: number): void {
    const { minFree } = this.form.controls;
    minFree.setValue(Math.max(DEFAULT_MIN_FREE, (Number(minFree.value) || 0) + delta));
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { start, end } = this.form.getRawValue();
    this.searchRequested.emit({ start, end });
  }
}
