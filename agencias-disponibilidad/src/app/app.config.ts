import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';

import { HttpAvailabilityRepository } from './features/availability/data/http-availability.repository';
import { AvailabilityRepository } from './features/availability/domain/availability.repository';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: AvailabilityRepository, useClass: HttpAvailabilityRepository },
  ],
};
