export interface FolderMapping {
  srcFolder: string;
  targetFolder: string;
  fileNames: string[];
}

export const PROJECT_FOLDER_MAPPINGS: FolderMapping[] = [
  // Angular workspace files
  { srcFolder: 'assets/templates/angular',   targetFolder: '',
    fileNames: [
      "angular.json.template.json",
      "tsconfig.app.json",
      "package.json.template.json",
      "tsconfig.json"
    ]
  },

  // Root-level Angular files
  { srcFolder: 'assets/templates/src',      targetFolder: 'src',
    fileNames: [
      "index.html.template.html",
      "main.ts",
      "styles.scss",
    ]
  },

  // Root Angular app shell
  { srcFolder: 'assets/templates/app',      targetFolder: 'src/app',
    fileNames: [
      "app.component.html",
      "app.component.scss",
      "app.component.ts.template.ts",
      "app.config.ts",
      "app.routes.ts",
    ]
  },

  // Generated services (edit layer)
  { srcFolder: 'assets/templates/services',    targetFolder: 'src/app/%%modelFileName%%/edit',
    fileNames: [
      "model-history.service.ts.template.ts",
      "model.service.ts.template.ts",
    ]
  },
];

export const MODEL_FOLDER_MAPPINGS: FolderMapping[] = [
  // Generated model classes (core layer)
  { srcFolder: 'assets/templates/model',    targetFolder: 'src/app/%%modelFileName%%/core',
    fileNames: []
  }
]
