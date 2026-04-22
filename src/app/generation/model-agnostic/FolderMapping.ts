export interface FolderMapping {
  srcFolder: string;
  targetFolder: string;
  fileNames: string[];
}

export const PROJECT_FOLDER_MAPPINGS: FolderMapping[] = [
  // Angular workspace files
  { srcFolder: 'assets/utils/angular',   targetFolder: '',
    fileNames: [
      "angular.json.template.json",
      "tsconfig.app.json",
      "package.json.template.json",
      "tsconfig.json"
    ]
  },

  // Root-level Angular files
  { srcFolder: 'assets/utils/src',      targetFolder: 'src',
    fileNames: [
      "index.html.template.html",
      "main.ts",
      "styles.scss",
    ]
  },

  // Root Angular app shell
  { srcFolder: 'assets/utils/app',      targetFolder: 'src/app',
    fileNames: [
      "app.component.html.template.html",
      "app.component.scss",
      "app.component.ts.template.ts",
      "app.config.ts",
      "app.routes.ts",
    ]
  },

];
