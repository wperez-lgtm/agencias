export class AvailabilityError extends Error {}

/** Puerto del dominio: las capas superiores dependen de este contrato, no de la API concreta. */
export class AvailabilityRepository {
  /** @returns {Promise<Array>} barcos con sus salidas para el rango `{ start, end }`. */
  search() {
    throw new Error('AvailabilityRepository.search debe implementarse.');
  }
}
