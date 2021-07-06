import { annotationTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { ParserResult } from "../../../data-parse/data-parser";
import { ParserInfo } from "../../../data-parse/parser-info";
import { ObjectId } from "../../core/object-id";
import { AnnotationDict } from "../annotation-dict";

export class PopupAnnotation extends AnnotationDict {
  /**
   * (Optional; shall be an indirect reference) The parent annotation 
   * with which this pop-up annotation shall be associated
   */
  Parent: ObjectId;
  /**
   * (Optional) A flag specifying whether the pop-up annotation shall initially be displayed open
   */
  Open = false;
  
  constructor() {
    super(annotationTypes.POPUP);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<PopupAnnotation>> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new PopupAnnotation();
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

    if (this.Parent) {
      bytes.push(...encoder.encode("/Parent "), ...this.Parent.toArray(cryptInfo));
    }
    if (this.Open) {
      bytes.push(...encoder.encode("/Open "), ...encoder.encode(" " + this.Open));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  // TODO: implement render method
  
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
          case "/Parent":
            i = await this.parseRefPropAsync(name, parser, i);
            break;
            
          case "/Open":
            i = await this.parseBoolPropAsync(name, parser, i);
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
