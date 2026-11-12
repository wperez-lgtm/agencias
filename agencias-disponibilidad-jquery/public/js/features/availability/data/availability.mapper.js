function toPrice(value) {
  if (value === null || value === '') {
    return null;
  }
  const price = Number(value);
  return Number.isNaN(price) ? null : price;
}

function toItinerary(dto) {
  return {
    ...dto,
    package: {
      normal: toPrice(dto.package.normal),
      save: toPrice(dto.package.save),
      promo: toPrice(dto.package.promo),
    },
  };
}

function byDeparture(first, second) {
  return first.date.start.localeCompare(second.date.start) || first.date.end.localeCompare(second.date.end);
}

/** Corrige dos defectos de la API: devuelve salidas anteriores al rango pedido y no siempre las ordena. */
export function toShips(dtos, earliestDeparture) {
  return dtos.map((dto) => ({
    ...dto,
    itinerary: dto.itinerary
      .filter(({ date }) => date.start >= earliestDeparture)
      .sort(byDeparture)
      .map(toItinerary),
  }));
}
