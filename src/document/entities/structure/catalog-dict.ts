import { dictTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { LiteralString } from "../strings/literal-string";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";

/**PDF document page structure root object */
export class CatalogDict extends PdfDict {
  /**
   * (Optional; PDF 1.4+) The version of the PDF specification 
   * to which the document conforms if later than the version 
   * specified in the file’s header. If the header specifies a later version, 
   * or if this entry is absent, the document shall conform to the version 
   * specified in the header. This entry enables a conforming writer 
   * to update the version using an incremental update; 
   * The value of this entry shall be a name object, not a number, 
   * and therefore shall be preceded by a SOLIDUS (2Fh) character (/) 
   * when written in the PDF file (for example, /1.4)
   */
  Version: string;
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that shall be the root of the document’s page tree
   */
  Pages: ObjectId;
  /**
   * (Optional; PDF 1.4+) A language identifier that shall specify the natural language 
   * for all text in the document except where overridden by language specifications 
   * for structure elements or marked content. If this entry is absent, 
   * the language shall be considered unknown
   */
  Lang: LiteralString;

  // TODO: Add other properties
  
  constructor() {
    super(dictTypes.CATALOG);
  }  
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<CatalogDict>> {   
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new CatalogDict();
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

    if (this.Version) {
      bytes.push(...encoder.encode("/Version "), ...encoder.encode(this.Version));
    }
    if (this.Pages) {
      bytes.push(...encoder.encode("/Pages "), ...this.Pages.toArray(cryptInfo));
    }
    if (this.Lang) {
      bytes.push(...encoder.encode("/Lang "), ...this.Lang.toArray(cryptInfo));
    }

    // TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
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
          case "/Version":            
            i = await this.parseNamePropAsync(name, parser, i);
            break;

          case "/Pages":            
            i = await this.parseRefPropAsync(name, parser, i);
            break;

          case "/Lang":            
            i = await this.parseLiteralPropAsync(name, parser, i, parseInfo.cryptInfo);
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
    
    if (!this.Pages) {
      throw new Error("Not all required properties parsed");
    }    
  }
}
