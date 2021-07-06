import { dictTypes, GroupDictType, groupDictTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { PdfDict } from "../core/pdf-dict";

export abstract class GroupDict extends PdfDict {
  /**
   * (Required) The group subtype, which identifies the type of group 
   * whose attributes this dictionary describes and determines the format and meaning 
   * of the dictionary’s remaining entries. The only group subtype defined in PDF 1.4 is Transparency; 
   * Other group subtypes may be added in the future
   */
  S: GroupDictType = "/Transparency";
  
  protected constructor() {
    super(dictTypes.GROUP);
  }  

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.S) {
      bytes.push(...encoder.encode("/S "), ...encoder.encode(this.S));
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
          case "/S":
            const intent = await parser.parseNameAtAsync(i, true);
            if (intent) {
              if ((<string[]>Object.values(groupDictTypes)).includes(intent.value)) {
                this.S = <GroupDictType>intent.value;
                i = intent.end + 1;    
              } else {
                // Unsupported subtype
                throw new Error(`Invalid dict subtype: '${intent.value}'`);
              }      
            } else {              
              throw new Error("Can't parse /S property value");
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
  }
}
