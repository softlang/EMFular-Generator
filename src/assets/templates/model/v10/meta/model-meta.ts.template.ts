import { ModelDefinition } from "emfular";
import { Refs } from "./Refs";
import { ReferenceMeta } from "emfular";

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
