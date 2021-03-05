import { annotationTypes } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";
import { TextMarkupAnnotation } from "./text-markup-annotation";
import { RenderToSvgResult } from "../../../../../common";

export class HighlightAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.HIGHLIGHT);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<HighlightAnnotation> {    
    const text = new HighlightAnnotation();
    const parseResult = text.parseProps(parseInfo);

    return parseResult
      ? {value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    return superBytes;
  }  
  
  // TODO: implement render method
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    // const {parser, bounds} = parseInfo;
    // const start = bounds.contentStart || bounds.start;
    // const end = bounds.contentEnd || bounds.end; 
    
    // let i = parser.skipToNextName(start, end - 1);
    // if (i === -1) {
    //   // no required props found
    //   return false;
    // }
    // let name: string;
    // let parseResult: ParseResult<string>;
    // while (true) {
    //   parseResult = parser.parseNameAt(i);
    //   if (parseResult) {
    //     i = parseResult.end + 1;
    //     name = parseResult.value;
    //     switch (name) {
    //       default:
    //         // skip to next name
    //         i = parser.skipToNextName(i, end - 1);
    //         break;
    //     }
    //   } else {
    //     break;
    //   }
    // };

    return true;
  }
}
