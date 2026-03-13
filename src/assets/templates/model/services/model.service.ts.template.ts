import { Injectable } from '@angular/core';
import { ModelService } from 'ngx-emfular-integration';
import { IoService } from 'ngx-emfular-helper';

import { %%modelName%% } from '../core/%%modelFileName%%';
import { %%modelName%%HistoryService } from './%%modelFileName%%-history.service';

%%allModelImports%%

@Injectable({
  providedIn: 'root'
})
export class %%modelName%%Service extends ModelService<%%modelName%%> {

  // explicitly use modeling classes to avoid tree-shaking them away:
  %%antiExtinctionProperties%%

  constructor(
    historyService: %%modelName%%HistoryService,
    ioService: IoService,
) {
    super(historyService, ioService, %%modelName%%);
  }
}
