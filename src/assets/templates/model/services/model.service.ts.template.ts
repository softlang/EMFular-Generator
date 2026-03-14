import { Injectable } from '@angular/core';
import { ModelService } from 'ngx-emfular-integration';
import { IoService } from 'ngx-emfular-helper';

import { %%modelName%%HistoryService } from './%%modelName%%-history.service';
%%ALL_REAL_CLASSES_IMPORTS%%

@Injectable({
  providedIn: 'root'
})
export class %%modelName%%Service extends ModelService<%%root%%> {

  constructor(
    historyService: %%modelName%%HistoryService,
    ioService: IoService,
) {
    super(historyService, ioService, %%root%%);
  }

%%MODEL_CREATION_METHODS%%
}
