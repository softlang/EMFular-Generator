import { Injectable } from '@angular/core';
import { ModelService } from 'ngx-emfular-integration';
import { IoService } from 'ngx-emfular-helper';

import { %%modelName%% } from '../core/%%modelName%%';
import { %%modelName%%HistoryService } from './%%modelName%%-history.service';
%%ANTI_EXTINCTION_IMPORTS%%

@Injectable({
  providedIn: 'root'
})
export class %%modelName%%Service extends ModelService<%%root%%> {

  // explicitly use modeling classes to avoid tree-shaking them away:
  %%ANTI_EXTINCTION_PROPERTIES%%

  constructor(
    historyService: %%modelName%%HistoryService,
    ioService: IoService,
) {
    super(historyService, ioService, %%root%%);
  }
}
