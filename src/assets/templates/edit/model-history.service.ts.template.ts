import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HistoryService } from 'ngx-emfular-tool';
import { JsonOf } from 'emfular-core';
import { %%root%% } from '../core/%%root%%';

@Injectable({
  providedIn: 'root'
})
export class %%modelName%%HistoryService extends HistoryService<JsonOf<%%root%%>> {

  constructor(@Inject(PLATFORM_ID) platform: Object) {
    super('%%modelName%%-history_', 50, platform);
  }
}
