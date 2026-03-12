import { ModelDefinition, ReferenceMeta } from "emfular";

%%ENUMS%%
%%CLASS_REFS%%

export const %%ModelName%%Meta: ModelDefinition = {
  name: "%%prefix%%",
  prefix: "%%prefix%%",
  uri: "%%uri%%",
  classes: {
    %%CLASS_ENTRIES%%
  }
};
