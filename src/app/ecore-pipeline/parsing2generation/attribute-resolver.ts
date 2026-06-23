import {Injectable} from '@angular/core';
import {EAttributeJson} from '../parsing-model/structural-feature';
import {Attribute} from '../generation-model/structural-feature';
import {EDataType} from '../generation-model/classifier';
import {EEnumJson} from '../parsing-model/classifier';
import {AttributeTargetTypes, BuiltInTypeReference, ClassifierReference} from '../generation-model/cross-references';

@Injectable({
  providedIn: 'root',
})
export class AttributeResolver {
  /*
    1) call normal resolvers to get the type right
    2) set default values to correct values (also for enums and own data types)
  */
  resolve(attr: EAttributeJson, enums: EEnumJson[], usedEnums: Set<string>, eDataTypes: EDataType[], usedTypes: Set<string>): Attribute {

    const ref = this.createAttrRef(attr);
    const tsType = this.mapEcoreTypeToTs(attr);
    const isList =  attr.upperBound === -1 || attr.upperBound > 1

    const typeShortcut = eDataTypes.find(t => t.name == tsType)
    if (typeShortcut) {
      usedTypes.add(typeShortcut.name)
    }
    const enumInfo = this.findEnum(tsType, enums);
    if (enumInfo) {
      usedEnums.add(enumInfo.name)
    }
    const typeCase = this.assignType()

    const initializer = enumInfo
      ? this.buildEnumInitializer(attr, enumInfo, isList)
      : this.buildPrimitiveInitializer(attr, tsType, isList);

    return {
      name: attr.name, //todo clean
      lowerBound: attr.lowerBound,
      upperBound: attr.upperBound,
      type: {
        target: typeCase,
        reference: ref,
      },
      defaultValueLiteral: initializer
    }
  }

  private createAttrRef(attr: EAttributeJson): ClassifierReference|BuiltInTypeReference {
    //todo
    return {
      isBuiltIn: true,
      name: 'todo'
    }
  }

  private assignType(): AttributeTargetTypes {
    return AttributeTargetTypes.any //todo
  }

  private createInitializer() {

  }

  private mapEcoreTypeToTs(attr: EAttributeJson): string {
    const t = attr.type.raw;


    if (t.length == 0) return "any"

    if (t == "EString") return "string";
    if (t == "EBoolean" || t == "EBooleanObject") return "boolean";

    if (
      t == "EInt" || t == "EIntegerObject" ||
      t == "ELong" || t == "ELongObject" ||
      t == "EShort" || t == "EShortObject" ||
      t == "EFloat" || t == "EFloatObject" ||
      t == "EDouble" || t == "EDoubleObject"
    ) return "number";

    if (t == "EDate") return "Date";
    if (t == "EByteArray") return "Uint8Array";

    // enum or custom datatype → short name
    const idx = t.lastIndexOf("#//");
    return idx >= 0 ? t.substring(idx + 3) : t;
  }

  private findEnum(typeName: string, enums: EEnumJson[]): EEnumJson | undefined {
    return enums.find(e => e.name === typeName);
  }

  private parseMultiDefault(multiDefault: string): string[] {
    return multiDefault
      .split(",")
      .map(s => s.trim())  // remove whitespace
      .filter(s => s.length > 0);
  }

  // --- primitive types ----

  private buildPrimitiveInitializer(attr: EAttributeJson, tsType: string, isList: boolean): string {
    if (attr.defaultValueLiteral !== undefined) {
      return " = " + this.formatPrimitiveDefault(attr.defaultValueLiteral, tsType, isList);
    }
    if (attr.lowerBound === 1) {
      return " = " + this.emfPrimitiveDefault(tsType, isList);
    }
    return "";
  }

  private formatPrimitiveDefault(defaultAttr: string, tsType: string, isList: boolean): string {
    if (tsType === "string") {
      if(isList) {
        this.parseMultiDefault(defaultAttr)
      } else
        return JSON.stringify(defaultAttr);
    }
    return defaultAttr;
  }

  private emfPrimitiveDefault(tsType: string, isList: boolean): string {
    if(isList) {
      return "[]"
    }
    switch (tsType) {
      case "string": return '""';
      case "number": return "0";
      case "boolean": return "false";
      case "Date": return "null";
      case "Uint8Array": return "new Uint8Array()";
      default: return "undefined";
    }
  }

  //---- Enum handling -----
  private buildEnumInitializer(attr: EAttributeJson, e: EEnumJson, isList: boolean): string {
    if(isList) {
      return this.buildEnumListInitializer(attr, e)
    } else {
      return this.buildEnumSingleInitializer(attr, e)
    }
  }

  private buildEnumListInitializer(attr: EAttributeJson, e: EEnumJson): string {
    if (attr.defaultValueLiteral !== undefined) {
      const valuesStr = this.parseMultiDefault(attr.defaultValueLiteral)
        .map(v => this.getEnumValue(v, e))
        .join(", ")
      return ` = [${valuesStr}]`;
    }
    if (attr.lowerBound === 1) {
      return ` = []`;
    }
    return "";
  }

  private buildEnumSingleInitializer(attr: EAttributeJson, e: EEnumJson): string {
    if (attr.defaultValueLiteral !== undefined) {
      return ` = ${this.getEnumValue(attr.defaultValueLiteral, e)}`;
    }
    if (attr.lowerBound === 1) {
      return ` = ${this.getEnumDefault(e)}`;
    }
    return "";
  }

  getEnumDefault(e: EEnumJson): string {
    return `${e.name}.${e.literals[0]}`;
  }

  getEnumValue(value: string, e: EEnumJson): string {
    return ` = ${e.name}.${value}`; //todo could sanitize/check
  }


}
