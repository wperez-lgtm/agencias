import { Observable } from 'rxjs';

import { DateRange, Ship } from './availability.models';

/** Puerto del dominio: la aplicación depende de esta abstracción, no de HTTP. */
export abstract class AvailabilityRepository {
  abstract search(range: DateRange): Observable<Ship[]>;
}

/** Error con un mensaje ya apto para mostrarse al usuario. */
export class AvailabilityError extends Error {}
