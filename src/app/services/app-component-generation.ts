import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppComponentGeneratorService {
  generate(parsedModel: any): string {
    const modelName = this.extractModelName(parsedModel);  
    const rootClassName = this.extractRootClassName(parsedModel); 

    const modelVarName = this.lowerFirst(rootClassName);

    return `import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Deserializer } from "emfular";
//import { ${rootClassName} } from "./shared/${modelName}/core/model"; // when export is done with right name for file replace model with ${modelName}
import "./shared/${modelName}/core/model";
import { EClasses } from "./shared/${modelName}/eclasses";
import ${modelVarName}Json from "./shared/${modelName}/json/template.json";

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet],
})
export class AppComponent {
  protected readonly title = "test ${modelName}";

  constructor() {
    const ${modelVarName} = Deserializer.fromJSON<any>( //supposed to be type ${rootClassName}
      ${modelVarName}Json,
      EClasses.${rootClassName}
    );

    console.log("Deserialized ${rootClassName}:", ${modelVarName});
  }
}
`;
  }

  /**
   * gets modelname
   */
  private extractModelName(parsedModel: any): string {
    if (parsedModel?.name) {
      return this.toKebabOrLower(parsedModel.name);
    }

    if (parsedModel?.nsURI) {
      return this.extractNameFromNsUri(parsedModel.nsURI);
    }

    if (parsedModel?.ePackage?.name) {
      return this.toKebabOrLower(parsedModel.ePackage.name);
    }

    return 'model';
  }

  /**
   * gets root-class
   */
  private extractRootClassName(parsedModel: any): string {
    if (parsedModel?.rootClassName) {
      return parsedModel.rootClassName;
    }

    if (parsedModel?.eClassifiers?.length) {
      const firstEClass = parsedModel.eClassifiers.find(
        (classifier: any) => classifier?.eClass === 'ecore:EClass' || classifier?.type === 'EClass'
      );

      if (firstEClass?.name) {
        return firstEClass.name;
      }
    }

    if (parsedModel?.eClasses?.length && parsedModel.eClasses[0]?.name) {
      return parsedModel.eClasses[0].name;
    }

    if (parsedModel?.nsURI) {
      const nsPart = this.extractNameFromNsUri(parsedModel.nsURI);
      return this.upperFirst(nsPart);
    }

    return 'Model';
  }

  private extractNameFromNsUri(value: string): string {
    const match = value.match(/^http:\/\/([^#]+)/);
    return match ? match[1].toLowerCase() : 'model';
  }

  private lowerFirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  private upperFirst(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private toKebabOrLower(value: string): string {
    return value.trim().toLowerCase();
  }
}