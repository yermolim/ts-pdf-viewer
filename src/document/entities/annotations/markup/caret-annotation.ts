import { codes } from "../../../codes";
import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";
import { MarkupAnnotation } from "./markup-annotation";
import { Quadruple } from "../../../../common/types";

export const caretSymbolTypes = {
  NONE: "/None",
  PARAGRAPH: "/P",
} as const;
export type CaretSymbolType = typeof caretSymbolTypes[keyof typeof caretSymbolTypes];


export class CaretAnnotation extends MarkupAnnotation {
  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying caret. Such a difference can occur. When a paragraph symbol 
   * specified by Sy is displayed along with the caret
   */
  RD: Quadruple;
  /**
   * (Optional) A name specifying a symbol that shall be associated with the caret
   */
  Sy: CaretSymbolType = caretSymbolTypes.NONE;
  
  constructor() {
    super(annotationTypes.CARET);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<CaretAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new CaretAnnotation();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD "), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.Sy) {
      bytes.push(...encoder.encode("/Sy "), ...encoder.encode(this.Sy));
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
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/RD":
            const innerRect = parser.parseNumberArrayAt(i, true);
            if (innerRect) {
              this.RD = [
                innerRect.value[0],
                innerRect.value[1],
                innerRect.value[2],
                innerRect.value[3],
              ];
              i = innerRect.end + 1;
            } else {              
              throw new Error("Can't parse /RD property value");
            }
            break;
          case "/Sy":
            const symbolType = parser.parseNameAt(i, true);
            if (symbolType && (<string[]>Object.values(caretSymbolTypes))
              .includes(symbolType.value)) {
              this.Sy = <CaretSymbolType>symbolType.value;
              i = symbolType.end + 1;              
            } else {              
              throw new Error("Can't parse /Sy property value");
            }
            break;
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
  }
}
