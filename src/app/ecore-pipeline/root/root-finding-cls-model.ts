export interface RootFindingPkgModel {
  name: string;
  classes: RootFindingClsModel[]
}

export interface RootFindingClsModel {
  eClass: string;
  name: string;
  abstract: boolean;
  hasContainment: boolean;
  allFeaturesTransient: boolean;
}
