import { dayMonthOf, dayMonthYearOf, dayOf, monthYearOf, weekdayOf } from '../../../shared/format/date-format.js';
import { element, textNode } from '../../../shared/dom/elements.js';
import { pluralize } from '../../../shared/format/pluralize.js';
import { formatPrice } from '../../../shared/format/price.js';
import { currentPrice, discountPercent, isLowStock, nightsOf, occupancyOf } from '../domain/availability.rules.js';
import { islandName, languageName } from './availability.labels.js';
import { shipTypePresentation } from './ship-type-presentation.js';

function createWhen({ date }) {
  return element('div', 'when').append(
    element('span', 'when__dow', weekdayOf(date.start)),
    element('span', 'when__day', dayOf(date.start)),
    element('span', 'when__month', monthYearOf(date.start)),
  );
}

function createHeading(itinerary, presentation) {
  const $heading = element('div', 'trip__heading').append(element('h3', null, presentation.itineraryTitle(itinerary)));
  if (itinerary.acronym !== itinerary.name) {
    $heading.append(element('span', 'chip', itinerary.acronym));
  }
  $heading.append(element('span', 'chip', `Guía: ${languageName(itinerary.guide.language)}`));
  if (itinerary.deck) {
    $heading.append(element('span', 'chip', itinerary.deck));
  }
  return $heading;
}

function createStop(code, isoDate, modifier = '') {
  return element('div', `route__stop ${modifier}`.trim()).append(
    element('strong', null, islandName(code)),
    element('small', null, `${code} · ${dayMonthOf(isoDate)}`),
  );
}

function createRoute(itinerary) {
  const { island, date } = itinerary;
  const nights = nightsOf(itinerary);
  const duration = `${nights + 1} días · ${nights} ${pluralize(nights, 'noche', 'noches')}`;
  return element('div', 'route').append(
    createStop(island.start, date.start),
    element('div', 'route__line').append(element('span', null, duration)),
    createStop(island.end, date.end, 'route__stop--end'),
  );
}

function createSeats(itinerary) {
  const { free, capacity, hold, single } = itinerary;
  const lowStock = isLowStock(itinerary);
  const { freePercent, holdPercent } = occupancyOf(itinerary);

  const $label = element('div', 'seats__label').append(
    element('span', 'seats__free')
      .toggleClass('seats__free--low', lowStock)
      .append(element('strong', null, free), textNode(` de ${capacity} libres`)),
  );
  if (lowStock) {
    $label.append(element('span', 'seats__alert', 'Últimos espacios'));
  }

  const $bar = element('div', 'seats__bar')
    .attr('aria-hidden', 'true')
    .append(
      element('span', 'seats__fill').toggleClass('seats__fill--low', lowStock).css('width', `${freePercent}%`),
      element('span', 'seats__hold').css('width', `${holdPercent}%`),
    );

  const meta = `${hold} ${pluralize(hold, 'bloqueado', 'bloqueados')} · ${single} ${pluralize(single, 'single', 'singles')}`;
  return element('div', 'seats').append($label, $bar, element('p', 'seats__meta', meta));
}

function createTrip(itinerary, presentation) {
  const $trip = element('div', 'trip').append(createHeading(itinerary, presentation));
  if (itinerary.island) {
    $trip.append(createRoute(itinerary));
  }
  return $trip.append(createSeats(itinerary));
}

function createPrice(itinerary, presentation) {
  const discount = discountPercent(itinerary);
  const $price = element('div', 'price');
  if (discount > 0) {
    $price.append(
      element('div', 'price__was').append(
        element('s', null, formatPrice(itinerary.price)),
        element('span', 'price__off', `-${discount}%`),
      ),
    );
  }
  $price.append(element('strong', 'price__now', formatPrice(currentPrice(itinerary))));
  if (itinerary.promo) {
    $price.append(element('small', null, `Promo hasta el ${dayMonthYearOf(itinerary.promo.date)}`));
    if (itinerary.promo.observation) {
      $price.append(element('span', 'price__gift', itinerary.promo.observation));
    }
  }
  return $price.append(element('small', null, presentation.priceNote));
}

function createPackageRow(label, price, className) {
  return element('div', className).append(element('dt', null, label), element('dd', null, formatPrice(price)));
}

function createPackage({ package: prices }) {
  const $package = element('dl', 'package').append(
    createPackageRow('Paquete normal', prices.normal),
    createPackageRow('Precio agencia', prices.save, 'package__agency'),
  );
  if (prices.promo !== null) {
    $package.append(createPackageRow('Paquete promo', prices.promo));
  }
  return $package;
}

function createAccommodationPrice({ price, promo }) {
  const $price = element('span', 'cabin__price');
  if (promo !== null) {
    return $price.append(element('s', null, formatPrice(price)), element('strong', null, formatPrice(promo)));
  }
  return $price.append(element('strong', null, formatPrice(price)));
}

function createAccommodation(accommodation) {
  const { name, space, share } = accommodation;
  const detail = `${space} ${pluralize(space, 'plaza', 'plazas')} · ${share ? 'por compartir' : 'cabina completa'}`;
  return element('li').append(
    element('span', 'cabin__name').append(textNode(name), element('small', null, detail)),
    createAccommodationPrice(accommodation),
  );
}

function createCabin(cabin) {
  return element('section', 'cabin').append(
    element('header').append(element('strong', null, `Cabina ${cabin.name}`), element('span', null, cabin.deck)),
    element('ul').append(cabin.accom.map((accommodation) => createAccommodation(accommodation)[0])),
  );
}

function createCabins(cabins) {
  return element('div', 'cabins').append(cabins.map((cabin) => createCabin(cabin)[0]));
}

function createCabinToggle(cabins, $card) {
  const closedLabel = `Ver ${cabins.length} ${pluralize(cabins.length, 'cabina', 'cabinas')}`;
  const $label = element('span', null, closedLabel);
  const $icon = element('span', 'toggle__icon').attr('aria-hidden', 'true');
  const $toggle = element('button', 'toggle').attr({ type: 'button', 'aria-expanded': 'false' }).append($label, $icon);
  let $openCabins = null;

  $toggle.on('click', () => {
    const willOpen = $openCabins === null;
    if (willOpen) {
      $openCabins = createCabins(cabins).appendTo($card);
    } else {
      $openCabins.remove();
      $openCabins = null;
    }
    $toggle.attr('aria-expanded', String(willOpen));
    $label.text(willOpen ? 'Ocultar cabinas' : closedLabel);
    $icon.toggleClass('toggle__icon--open', willOpen);
  });
  return $toggle;
}

export function createDepartureCard(itinerary, shipType) {
  const presentation = shipTypePresentation(shipType);
  const $extras = element('footer', 'extras').append(createPackage(itinerary));
  const $card = element('article', 'card').append(
    createWhen(itinerary),
    createTrip(itinerary, presentation),
    createPrice(itinerary, presentation),
    $extras,
  );
  if (itinerary.cabin?.length > 0) {
    $extras.append(createCabinToggle(itinerary.cabin, $card));
  }
  return $card;
}
