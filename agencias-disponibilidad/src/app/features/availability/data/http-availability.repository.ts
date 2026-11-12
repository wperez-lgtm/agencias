import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DateRange, Ship } from '../domain/availability.models';
import { AvailabilityError, AvailabilityRepository } from '../domain/availability.repository';
import { AvailabilityResponseDto } from './availability.dto';
import { translateHttpError } from './availability-error.translator';
import { toShips } from './availability.mapper';

const ALL_SHIPS_ID = 0;

/** Adapter: traduce la API externa al puerto que espera el dominio. */
@Injectable()
export class HttpAvailabilityRepository extends AvailabilityRepository {
  private readonly http = inject(HttpClient);

  override search({ start, end }: DateRange): Observable<Ship[]> {
    const url = `${environment.availabilityApiUrl}/${ALL_SHIPS_ID}/${start}/${end}`;
    return this.http.get<AvailabilityResponseDto>(url).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(() => new AvailabilityError(translateHttpError(error))),
      ),
      map((response) => {
        if (!response.successful) {
          throw new AvailabilityError('La API indicó que la consulta no fue exitosa.');
        }
        return toShips(response.data?.ship ?? [], start);
      }),
    );
  }
}
