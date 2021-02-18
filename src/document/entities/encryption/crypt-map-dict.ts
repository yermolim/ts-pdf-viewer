import { valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfDict } from "../core/pdf-dict";
import { CryptFilterDict } from "./crypt-filter-dict";

export class CryptMapDict extends PdfDict {
  protected readonly _filtersMap = new Map<string, CryptFilterDict>();
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<CryptMapDict> {    
    const cryptMap = new CryptMapDict();
    const parseResult = cryptMap.tryParseProps(parseInfo);

    return parseResult
      ? {value: cryptMap, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  getProp(name: string): CryptFilterDict { 
    return this._filtersMap.get(name);
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  


    if (this._filtersMap.size) {
      this._filtersMap.forEach((v, k) => 
        bytes.push(...encoder.encode(k), ...v.toArray()));
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
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end;
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          default:
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.DICTIONARY) { 
              const dictBounds = parser.getDictBoundsAt(i);
              if (dictBounds) {
                const filter = CryptFilterDict.parse({parser, bounds: dictBounds});
                if (filter) {
                  this._filtersMap.set(name, filter.value);
                  i = filter.end + 1;
                  break;
                }
              } 
            }
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    return true;
  }
}
