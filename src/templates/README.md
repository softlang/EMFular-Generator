# EMFular Angular Generator Templates
This directory contains all template files used by the EMFular Angular project generator.  
The generator produces a ready‑to‑use Angular 19 application based on an uploaded `.ecore` model.

The templates are organized by purpose and follow strict conventions to ensure:
- reproducible builds
- deterministic folder structure
- compatibility with Angular 19
- compatibility with EMFular 9 and 10
- minimal and explicit code generation

---

## Template Folder Structure

```
templates/
  README.md
  angular/      → angular.json, package.json, tsconfig templates
  src/          → index.html, main.ts, styles, root app files
  app/          → app.component, app.config, app.routes templates
  services/     → model.service + model-history.service templates
  model/        → model class templates (EMFular 9/10)
```

### Purpose of each folder

### **angular/**
Contains all workspace‑level configuration templates:
- angular.json.template.json
- package.json.template.json
- tsconfig.app.json.template.json
- tsconfig.json (static)

These files define the Angular workspace and are processed before any app code is generated.

---

### **src/**
Contains root‑level Angular files:
- index.html.template.html
- main.ts (static)
- styles.scss (static)

Only `index.html` is templated (for the project title).

---

### **app/**
Contains templates for the root Angular application:
- app.component.ts.template
- app.component.html.template
- app.component.scss (static)
- app.config.ts.template
- app.routes.ts.template
- app.ts.template

These files form the minimal Angular shell that hosts the EMFular editor.

---

### **services/**
Contains templates for the two generated services:

#### `model-history.service.ts.template.ts`
- Extends `HistoryService<JsonOf<Model>>`
- Deterministic import path: `../core/{{modelFileName}}`
- Deterministic service name: `{{modelName}}HistoryService`

#### `model.service.ts.template.ts`
- Extends `ModelService<Model>`
- Imports **all** model classes to prevent tree‑shaking
- Instantiates each model class once in dummy properties
- Deterministic import path for history service:  
  `./{{modelFileName}}-history.service`

Both services are placed in the generated project under:

```
src/app/{{modelFileName}}/edit/
```

---

### **model/**
Contains templates for generating model classes from the `.ecore` file.

These templates differ between EMFular 9 and 10 only in class structure, not in naming or folder layout.

Generated model classes are placed under:

```
src/app/{{modelFileName}}/core/
```

---

## Placeholder Conventions

The generator replaces the following placeholders in template files:

| Placeholder | Meaning                                                                 |
|------------|-------------------------------------------------------------------------|
| `{{projectName}}` | Name of the generated Angular project                                   |
| `{{modelName}}` | Root EClass name (e.g., `Family`)                                       |
| `{{modelFileName}}` | Lowercase file name (e.g., `family`)                                    |
| `{{modelImportPath}}` | Path to the root model class                                            |
| `{{allModelImports}}` | Multi-line block importing all model classes                            |
| `{{antiExtinctionProperties}}` | Multi-line block instantiating all model classes                        |
| `{{emfular-version}}` | Version of the EMFular runtime to install (e.g., `^9.1.0` or `^10.0.0`) |

### Notes on `{{emfular-version}}`

This placeholder is used inside `package.json.template.json` to pin the chosen EMFular version.
Default is currently "^10.0.0" but it is planned that users can later generate a 9.1.0 as well.
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
    {{modelFileName}}/
      core/
        model classes...
      edit/
        {{modelFileName}}-history.service.ts
        {{modelFileName}}.service.ts
  index.html
  main.ts
  styles.scss
```

This structure is deterministic and based solely on the model name.

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
- The EMFular tree editor is embedded directly in `AppComponent`.
- Routing exists only because Angular standalone bootstrap requires it.
- All import paths are deterministic and based on the model name.

