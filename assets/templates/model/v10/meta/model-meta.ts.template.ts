import { ModelDefinition, ReferenceMeta } from "emfular";

%%TYPES%%
%%ENUMS%%
%%CLASS_REFS%%

export const %%ModelName%%Meta: ModelDefinition = {
  name: "%%prefix%%",
  prefix: "%%prefix%%",
  uri: "%%uri%%#//", //because emfular expects complete uri
  classes: {
    %%CLASS_ENTRIES%%
  }
};
