export interface FolderMapping {
  srcFolder: string;
  targetFolder: string;
}

export const PROJECT_FOLDER_MAPPINGS: FolderMapping[] = [
  // Angular workspace files
  { srcFolder: 'angular',  targetFolder: '' },

  // Root-level Angular files
  { srcFolder: 'src',      targetFolder: 'src' },

  // Root Angular app shell
  { srcFolder: 'app',      targetFolder: 'src/app' },

  // Generated services (edit layer)
  { srcFolder: 'services', targetFolder: 'src/app/%%modelFileName%%/edit' },
];

export const MODEL_FOLDER_MAPPINGS: FolderMapping[] = [
  // Generated model classes (core layer)
  { srcFolder: 'model',    targetFolder: 'src/app/%%modelFileName%%/core' }
]
