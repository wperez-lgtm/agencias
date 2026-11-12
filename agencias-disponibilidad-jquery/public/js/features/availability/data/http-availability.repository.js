import { AvailabilityError, AvailabilityRepository } from '../domain/availability.repository.js';
import { translateHttpError } from './availability-error.translator.js';
import { toShips } from './availability.mapper.js';

const ALL_SHIPS_ID = 0;

/** Adapter: traduce la API externa al puerto que espera el dominio. */
export class HttpAvailabilityRepository extends AvailabilityRepository {
  #baseUrl;
  #request;

  /** @param request función con la firma de `$.ajax`; se inyecta para no atar esta clase a jQuery. */
  constructor(baseUrl, request) {
    super();
    this.#baseUrl = baseUrl;
    this.#request = request;
  }

  search({ start, end }) {
    const url = `${this.#baseUrl}/${ALL_SHIPS_ID}/${start}/${end}`;
    return Promise.resolve(this.#request({ url, method: 'GET', dataType: 'json' })).then(
      (response) => {
        if (!response.successful) {
          throw new AvailabilityError('La API indicó que la consulta no fue exitosa.');
        }
        return toShips(response.data?.ship ?? [], start);
      },
      (xhr) => {
        throw new AvailabilityError(translateHttpError(xhr));
      },
    );
  }
}
