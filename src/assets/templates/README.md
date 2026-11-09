# EMFular Angular Generator Templates
This directory contains all template files used by the EMFular Angular project generator.  
The generator produces a ready‑to‑use Angular 19 application based on an uploaded `.ecore` model.

---

## Template Folder Structure

```
templates/
  edit/         → model.service + model-history.service templates
  editor/       → model editor
  model/        → model class, interface and meta templates
  project/      → all project level files, organised as:
      angular/      → angular.json, package.json, tsconfig templates
      app/          → app.component, app.config, app.routes templates
      src/          → index.html, main.ts, styles, root app files
  README.md
```

---

## Placeholder Conventions

The generator replaces the following placeholders in template files:

| Placeholder | Meaning |
|------------|---------|
| `%%projectName%%` | Name of the generated Angular project |
| `%%modelName%%` | Root EClass name (e.g., `Family`) |
| `%%modelFileName%%` | Lowercase file name (e.g., `family`) |
| `%%modelImportPath%%` | Path to the root model class |
| `%%allModelImports%%` | Multi-line block importing all model classes |

---

## Generated Project Structure (for reference)

The generator produces:

```
src/
  app/
    app.component.*
    app.config.ts
    app.routes.ts
    app.ts
    edit/
        %%modelFileName%%-history.service.ts
        %%modelFileName%%.service.ts
    editor/
        %%modelFileName%%-editor.component.ts
        %%modelFileName%%-editor.component.html
        %%modelFileName%%-editor.component.css
    model/
        model classes...
  index.html
  main.ts
  styles.scss
tsconfig.json
package.json
tsconfig.app.json
angular.json
```

---

## Notes

- No spec files are generated in version 1.
- The generated app is intentionally minimal.
- Routing exists only because Angular standalone bootstrap requires it.

