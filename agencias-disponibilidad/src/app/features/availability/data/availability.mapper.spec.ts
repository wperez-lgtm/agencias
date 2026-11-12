import { ItineraryDto, ShipDto } from './availability.dto';
import { toShips } from './availability.mapper';

function departure(id: number, start: string, end: string): ItineraryDto {
  return { id, date: { start, end }, package: { normal: 1, save: 1, promo: null } } as ItineraryDto;
}

describe('toShips', () => {
  it('ordena las salidas por fecha de inicio y luego de regreso', () => {
    const dto: ShipDto = {
      name: 'M/Y Galaxy Stella',
      type: 1,
      itinerary: [
        departure(3, '2027-06-06', '2027-06-09'),
        departure(2, '2027-06-02', '2027-06-09'),
        departure(1, '2027-06-02', '2027-06-06'),
      ],
    };

    const [ship] = toShips([dto], '2027-06-01');

    expect(ship.itinerary.map(({ id }) => id)).toEqual([1, 2, 3]);
  });
});
