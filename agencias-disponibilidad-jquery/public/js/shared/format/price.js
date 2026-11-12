const LOCALE = 'es';
const MISSING_PRICE = '—';

function amountFormat(fractionDigits) {
  // Sin `always`, en español los miles de cuatro cifras saldrían sin punto: 1300 en vez de 1.300.
  return new Intl.NumberFormat(LOCALE, {
    useGrouping: 'always',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

const WHOLE_AMOUNT = amountFormat(0);
const AMOUNT_WITH_CENTS = amountFormat(2);

export function formatPrice(value) {
  if (value === null) {
    return MISSING_PRICE;
  }
  const format = Number.isInteger(value) ? WHOLE_AMOUNT : AMOUNT_WITH_CENTS;
  return `$${format.format(value)}`;
}
