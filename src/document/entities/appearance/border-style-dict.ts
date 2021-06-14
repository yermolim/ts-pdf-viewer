import { Double } from "../../../common/types";
import { codes } from "../../encoding/char-codes";
import { dictTypes, borderStyles, BorderStyle } from "../../spec-constants";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfDict } from "../core/pdf-dict";

export class BorderStyleDict extends PdfDict {
  /**(Optional) The border width in points. 
   * If this value is 0, no border shall drawn */
  W = 1;
  /**(Optional) The border style */
  S: BorderStyle = borderStyles.SOLID;
  /**(Optional) A dash array defining a pattern of dashes and gaps 
   * that shall beused in drawing a dashed border. [dash gap] */
  D: Double = [3, 0];
  
  constructor() {
    super(dictTypes.BORDER_STYLE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<BorderStyleDict> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    } 
    try {
      const pdfObject = new BorderStyleDict();
      pdfObject.parseProps(parseInfo);
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

    if (this.W) {
      bytes.push(...encoder.encode("/W "), ...encoder.encode(" " + this.W));
    }
    if (this.S) {
      bytes.push(...encoder.encode("/S "), ...encoder.encode(this.S));
    }
    if (this.D) {
      bytes.push(
        ...encoder.encode("/D "), codes.L_BRACKET, 
        ...encoder.encode(this.D[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.D[1] + ""), codes.R_BRACKET,
      );
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
  protected override parseProps(parseInfo: ParseInfo) {
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
          case "/W":
            i = this.parseNumberProp(name, parser, i, true);
            break;

          case "/S":
            const style = parser.parseNameAt(i, true);
            if (style && (<string[]>Object.values(borderStyles)).includes(style.value)) {
              this.S = <BorderStyle>style.value;
              i = style.end + 1;              
            } else {              
              throw new Error("Can't parse /S property value");
            }
            break;  

          case "/D":
            const dashGap = parser.parseNumberArrayAt(i, true);
            if (dashGap) {
              this.D = [
                dashGap.value[0] ?? 3,
                dashGap.value[1] ?? 0,
              ];
              i = dashGap.end + 1;
            } else {              
              throw new Error("Can't parse /D property value");
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
