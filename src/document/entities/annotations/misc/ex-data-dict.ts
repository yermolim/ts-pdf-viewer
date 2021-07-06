import { dictTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { ParserResult } from "../../../data-parse/data-parser";
import { ParserInfo } from "../../../data-parse/parser-info";
import { PdfDict } from "../../core/pdf-dict";

export class ExDataDict extends PdfDict {
  /**
   * (Required) A name specifying the type of data that the markup annotation shall be associated with
   */
  readonly Subtype = "/Markup3D";
   
  constructor() {
    super(dictTypes.EXTERNAL_DATA);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<ExDataDict>> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new ExDataDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  
    
    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Subtype":
            const subtype = await parser.parseNameAtAsync(i);
            if (subtype) {
              if (this.Subtype && this.Subtype !== subtype.value) {
                throw new Error(`Invalid dict subtype: '${subtype.value}' instead of '${this.Subtype}'`);
              }
              i = subtype.end + 1;
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break; 
             
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.Subtype) {
      throw new Error("Not all required properties parsed");
    }
  }
}
