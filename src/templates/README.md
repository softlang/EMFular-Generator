# EMFular Angular Project Templates
This directory contains all template files used by the EMFular Angular project generator.  
The generator produces a ready‑to‑use Angular 19 application based on an uploaded `.ecore` model.

The templates follow strict assumptions to ensure:
- reproducible builds
- predictable folder structure
- compatibility with Angular 19
- compatibility with EMFular 9 and 10
- minimal and explicit code generation

---

## Folder Structure Assumptions

The generated Angular project uses the following structure:

```
src/
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts
    app.routes.ts
    app.ts
    <modelFileName>/
      core/
        <modelFileName>.ts
        ...other model classes...
      edit/
        <modelFileName>-history.service.ts
        <modelFileName>.service.ts
  assets/
    templates/   (this folder)
  index.html
  main.ts
  styles.scss
```

### Key points:
- All model classes live under `app/<model>/core/`.
- Both generated services live under `app/<model>/edit/`.
- The root component (`AppComponent`) embeds the EMFular tree editor directly.
- Routing exists only to satisfy Angular’s standalone bootstrap requirements.

---

## Template File Types

### 1. Static files (copied as-is)
These contain no placeholders:

```
main.ts
styles.scss
favicon.ico
tsconfig.json
```

### 2. Template files (`*.template.*`)
These contain placeholders such as `{{projectName}}` or `{{modelName}}`:

```
index.html.template.html
angular.json.template.json
package.json.template.json
tsconfig.app.json.template.json

app.component.ts.template
app.component.html.template
app.config.ts.template
app.routes.ts.template

model-history.service.ts.template.ts
model.service.ts.template.ts
model.ts.template.ts
```

---

## Placeholder Conventions

The generator replaces the following placeholders:

| Placeholder | Meaning |
|------------|---------|
| `{{projectName}}` | Name of the generated Angular project |
| `{{modelName}}` | Root EClass name (e.g., `Family`) |
| `{{modelFileName}}` | Lowercase file name (e.g., `family`) |
| `{{modelImportPath}}` | Path to the root model class |
| `{{allModelImports}}` | Multi-line block importing all model classes |
| `{{antiExtinctionProperties}}` | Multi-line block instantiating all model classes |

These placeholders ensure:
- Angular’s tree-shaking does not remove unused model classes
- All services import the correct model types
- The generated project compiles without modification

---

## Service Generation Assumptions

### History Service
- Extends `HistoryService<JsonOf<Model>>`
- Uses deterministic import path:  
  `../core/{{modelFileName}}`
- Uses deterministic service name:  
  `{{modelName}}HistoryService`
- Lives in:  
  `app/{{modelFileName}}/edit/`

### Model Service
- Extends `ModelService<Model>`
- Imports **all** model classes to prevent tree-shaking
- Instantiates each model class once in dummy properties
- Lives next to the history service in `edit/`
- Uses deterministic import paths:
  - `../core/...` for model classes
  - `./{{modelFileName}}-history.service` for the history service

---

## Model Generation Assumptions

Model generation is handled last because:
- EMFular 9 and 10 differ only in model class structure
- All other templates are version-stable
- The generator can produce model classes with guaranteed default constructors

Generated model classes live under:

```
app/{{modelFileName}}/core/
```

---

## Version Compatibility

These templates are compatible with:
- Angular 19.x
- EMFular 9.x and 10.x
- ngx-emfular-helper 1.x
- ngx-emfular-integration 0.2.x
- ngx-svg-graphics 3.x

---

## Notes

- No spec files are generated in version 1.
- The generated app is intentionally minimal.
- The tree editor is embedded directly in `AppComponent` for immediate usability.
- Routing is included only because Angular standalone bootstrap requires it.
- All import paths are deterministic and based on the model name.

