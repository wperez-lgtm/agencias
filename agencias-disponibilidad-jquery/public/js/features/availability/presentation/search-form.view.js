import { addDays, toIsoDate, todayIsoDate } from '../../../shared/date/iso-date.js';
import { element } from '../../../shared/dom/elements.js';
import { DEFAULT_MIN_FREE, NO_SHIP_SELECTED } from '../domain/availability.rules.js';
import { DateRangeError, validateDateRange } from './date-range.validator.js';

const DEFAULT_RANGE_DAYS = 30;
const LOADING_LABEL = 'Buscando…';
const IDLE_LABEL = 'Buscar salidas';

const VALIDATION_MESSAGES = {
  [DateRangeError.Required]: 'Selecciona las dos fechas.',
  [DateRangeError.StartInPast]: 'La fecha de inicio no puede ser anterior a hoy.',
  [DateRangeError.EndBeforeStart]: 'La fecha final debe ser igual o posterior a la de inicio.',
};

export class SearchFormView {
  #handlers;
  #touched = false;
  #renderedShipNames = null;
  #$form;
  #$shipName;
  #$start;
  #$end;
  #$minFree;
  #$submit;
  #$error;

  constructor($form, handlers) {
    this.#handlers = handlers;
    this.#$form = $form;
    this.#$shipName = $form.find('#ship-name');
    this.#$start = $form.find('#start-date');
    this.#$end = $form.find('#end-date');
    this.#$minFree = $form.find('#min-free');
    this.#$submit = $form.find('#search-submit');
    this.#$error = $form.find('#search-error');

    this.#$start.val(todayIsoDate());
    this.#$end.val(toIsoDate(addDays(new Date(), DEFAULT_RANGE_DAYS)));
    this.#bindEvents();
  }

  render({ shipNames, selectedShip, loading }) {
    this.#renderShipOptions(shipNames);
    this.#$shipName.val(selectedShip);
    this.#$submit.prop('disabled', loading).text(loading ? LOADING_LABEL : IDLE_LABEL);
  }

  submit() {
    const range = this.#currentRange();
    if (this.#validate(range) !== null) {
      this.#touched = true;
      this.#showValidation();
      return;
    }
    this.#handlers.onSearch(range);
  }

  #bindEvents() {
    this.#$form.on('submit', (event) => {
      event.preventDefault();
      this.submit();
    });
    this.#$form.on('focusout', () => {
      this.#touched = true;
      this.#showValidation();
    });
    this.#$start.add(this.#$end).on('input change', () => this.#showValidation());
    this.#$shipName.on('change', () => this.#handlers.onShipSelected(this.#$shipName.val()));
    this.#$minFree.on('input', () => this.#publishMinFree());
    this.#$form.find('#min-free-less').on('click', () => this.#changeMinFree(-1));
    this.#$form.find('#min-free-more').on('click', () => this.#changeMinFree(1));
  }

  #currentRange() {
    return { start: this.#$start.val(), end: this.#$end.val() };
  }

  #validate(range) {
    return validateDateRange(range, todayIsoDate());
  }

  #showValidation() {
    const error = this.#validate(this.#currentRange());
    const isVisible = error !== null && (error !== DateRangeError.Required || this.#touched);
    this.#$error.prop('hidden', !isVisible).text(isVisible ? VALIDATION_MESSAGES[error] : '');
  }

  #minFreeValue() {
    return Number(this.#$minFree.val()) || 0;
  }

  #publishMinFree() {
    this.#handlers.onMinFreeChanged(this.#minFreeValue());
  }

  #changeMinFree(delta) {
    this.#$minFree.val(Math.max(DEFAULT_MIN_FREE, this.#minFreeValue() + delta));
    this.#publishMinFree();
  }

  /** Solo reconstruye la lista cuando cambian los barcos, para no alterar el control mientras se usa. */
  #renderShipOptions(shipNames) {
    const names = shipNames.join('|');
    if (names === this.#renderedShipNames) {
      return;
    }
    this.#renderedShipNames = names;
    const options = shipNames.map((name) => element('option', null, name).val(name)[0]);
    this.#$shipName.empty().append(element('option', null, 'Todos los barcos').val(NO_SHIP_SELECTED), options);
  }
}
