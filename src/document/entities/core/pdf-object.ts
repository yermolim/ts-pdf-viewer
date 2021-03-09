import { CryptInfo, IEncodable, Reference } from "../../common-interfaces";
import { DataParser, ParseResult } from "../../data-parser";
import { DateString } from "../strings/date-string";
import { LiteralString } from "../strings/literal-string";
import { ObjectId } from "./object-id";

export abstract class PdfObject implements IEncodable {
  //#region reference
  protected _ref: Reference;
  get ref(): Reference {
    return this._ref;
  }
  set ref(ref: Reference) {
    this._ref = ref;
  }
  get id(): number {
    return this._ref?.id;
  }
  get generation(): number {
    return this._ref?.generation;
  } 
  //#endregion 
  
  //#region detecting changes
  protected _proxy: PdfObject; 

  protected _edited = false;
  get edited(): boolean {
    return this._edited;
  }   

  protected _deleted = false;
  get deleted(): boolean {
    return this._deleted;
  }

  /**
   * returns 'true' if an object has no reference to the PDF document
   */
  get added(): boolean {
    return !!this._ref;
  }

  protected onChange: ProxyHandler<PdfObject> = {
    set: (target: PdfObject, prop: string, value: any) => {
      if (!this._edited && prop[0] !== "_") {
        // if any public property except "deleted" changed, then set 'edited' flag to 'true'
        this._edited = true;

        // DEBUG
        console.log(`EDITED prop ${prop}`);
        console.log(this);
      }
      // proceed assignment as usual
      target[prop] = value;
      return true;
    },
  };
  //#endregion

  protected constructor() {
    
  }
  
  markAsDeleted(value = true) {
    this._deleted = value;
  }

  //#region parse simple properties 
  protected parseRefProp(propName: string, parser: DataParser, index: number): number {
    const parsed = ObjectId.parseRef(parser, index);
    return this.setParsedProp(propName, parsed);
  }

  protected parseRefArrayProp(propName: string, parser: DataParser, index: number): number {
    const parsed = ObjectId.parseRefArray(parser, index);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseBoolProp(propName: string, parser: DataParser, index: number): number {
    const parsed = parser.parseBoolAt(index);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseNameProp(propName: string, parser: DataParser, index: number, includeSlash = true): number {
    const parsed = parser.parseNameAt(index, includeSlash);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseNameArrayProp(propName: string, parser: DataParser, index: number, includeSlash = true): number {
    const parsed = parser.parseNameArrayAt(index, includeSlash);
    return this.setParsedProp(propName, parsed);
  }

  protected parseNumberProp(propName: string, parser: DataParser, index: number, float = true): number {
    const parsed = parser.parseNumberAt(index, float);
    return this.setParsedProp(propName, parsed);
  }
    
  protected parseNumberArrayProp(propName: string, parser: DataParser, index: number, float = true): number {
    const parsed = parser.parseNumberArrayAt(index, float);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseDateProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number {
    const parsed = DateString.parse(parser, index, cryptInfo);
    return this.setParsedProp(propName, parsed);
  }

  protected parseLiteralProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number {
    const parsed = LiteralString.parse(parser, index, cryptInfo);
    return this.setParsedProp(propName, parsed);
  }

  private setParsedProp(propName: string, parsed: ParseResult<any>): number {
    if (!parsed) {
      throw new Error(`Can't parse ${propName} property value`);
    }
    this[propName.slice(1)] = parsed.value;
    return parsed.end + 1;
  }
  //#endregion

  abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
