import { environment } from './config/environment.js';
import { AvailabilityStore } from './features/availability/application/availability.store.js';
import { HttpAvailabilityRepository } from './features/availability/data/http-availability.repository.js';
import { AvailabilityPageView } from './features/availability/presentation/availability-page.view.js';
import { SearchFormView } from './features/availability/presentation/search-form.view.js';
import { $ } from './shared/jquery.js';

/** Composition root: el único lugar que decide qué implementación concreta usa cada capa. */
$(() => {
  const repository = new HttpAvailabilityRepository(environment.availabilityApiUrl, (options) => $.ajax(options));
  const store = new AvailabilityStore(repository);
  const searchForm = new SearchFormView($('#search-form'), {
    onSearch: (range) => store.search(range),
    onShipSelected: (name) => store.selectShip(name),
    onMinFreeChanged: (minFree) => store.setMinFree(minFree),
  });
  const page = new AvailabilityPageView(
    { $skeletons: $('#skeletons'), $feedback: $('#feedback'), $results: $('#results') },
    searchForm,
    store,
  );

  page.start();
});
