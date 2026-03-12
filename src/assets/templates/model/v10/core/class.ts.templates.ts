%%TYPE_IMPORTS%%
%%REAL_IMPORTS%%

@eClass(%%modelMeta%%, "%%className%%")
export class %%className%% extends %%extendsExpr%% %%implementsExpr%% {

  constructor() {
    super();
  }

%%ATTRIBUTES%%

%%REFERENCES%%
}
