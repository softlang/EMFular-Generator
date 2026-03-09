import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HistoryService } from 'ngx-emfular-helper';
import { JsonOf } from 'emfular';
import { {{modelName}} } from '../core/{{modelFileName}}';

@Injectable({
  providedIn: 'root'
})
export class {{modelName}}HistoryService extends HistoryService<JsonOf<{{modelName}}>> {

  constructor(@Inject(PLATFORM_ID) platform: Object) {
    super('{{modelName}}-history_', 50, platform);
  }
}
