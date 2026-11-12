import { element, textNode } from '../../../shared/dom/elements.js';
import { pluralize } from '../../../shared/format/pluralize.js';
import { formatPrice } from '../../../shared/format/price.js';
import { createDepartureCard } from './departure-card.view.js';
import { shipTypePresentation } from './ship-type-presentation.js';

function createStat(label, value) {
  return element('div').append(element('dt', null, label), element('dd', null, value));
}

function createStats({ departures, ships, freeSpaces, promotions }) {
  return element('dl', 'stats')
    .attr('role', 'status')
    .append(
      createStat('Salidas', departures),
      createStat('Barcos', ships),
      createStat('Espacios libres', freeSpaces),
      createStat('Con promoción', promotions),
    );
}

function scrollToShip(index) {
  document.getElementById(`ship-${index}`)?.scrollIntoView({ behavior: 'smooth' });
}

function createFleetNavigation(ships) {
  const buttons = ships.map((ship, index) =>
    element('button')
      .attr('type', 'button')
      .append(textNode(`${ship.name} `), element('span', null, ship.itinerary.length))
      .on('click', () => scrollToShip(index))[0],
  );
  return element('nav', 'fleet').attr('aria-label', 'Ir a un barco').append(buttons);
}

function createShipHeader(ship) {
  const count = ship.itinerary.length;
  const availability = `${count} ${pluralize(count, 'salida disponible', 'salidas disponibles')}`;
  return element('header', 'ship__header').append(
    element('div').append(
      element('h2', null, ship.name),
      element('p', null, `${shipTypePresentation(ship.type).label} · ${availability}`),
    ),
    element('p', 'ship__from', `Desde ${formatPrice(ship.fromPrice)}`),
  );
}

function createShipSection(ship, index) {
  const cards = ship.itinerary.map((itinerary) => createDepartureCard(itinerary, ship.type)[0]);
  return element('section', 'ship')
    .attr('id', `ship-${index}`)
    .append(createShipHeader(ship), element('div', 'ship__list').append(cards));
}

export function createResults(ships, summary) {
  const sections = ships.map((ship, index) => createShipSection(ship, index)[0]);
  const stats = createStats(summary)[0];
  return summary.ships > 1 ? [stats, createFleetNavigation(ships)[0], ...sections] : [stats, ...sections];
}
