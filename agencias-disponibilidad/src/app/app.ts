import { Component } from '@angular/core';

import { AvailabilityPage } from './features/availability/presentation/availability-page/availability-page';

@Component({
  selector: 'app-root',
  imports: [AvailabilityPage],
  template: '<app-availability-page />',
})
export class App {}
