import { formatNumber } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

const WHOLE_AMOUNT_FORMAT = '1.0-0';
const CENTS_FORMAT = '1.2-2';
const MISSING_PRICE = '—';

@Pipe({ name: 'price' })
export class PricePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: number | null): string {
    if (value === null) {
      return MISSING_PRICE;
    }
    const format = Number.isInteger(value) ? WHOLE_AMOUNT_FORMAT : CENTS_FORMAT;
    return `$${formatNumber(value, this.locale, format)}`;
  }
}
