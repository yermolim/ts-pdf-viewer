import { dictTypes, valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { getCharCodesMapByCode, pdfCharCodesByName } from "../../encoding/char-encodings";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { PdfDict } from "../core/pdf-dict";

export class EncodingDict extends PdfDict {
  //#region PDF properties

  /** (Optional) The base encoding (the encoding from which the Differences entry (if present) 
   * describes differences) shall be the name of one of the predefined encodings 
   * MacRomanEncoding, MacExpertEncoding, or WinAnsiEncoding. 
   * If this entry is absent, the Differences entry shall describe differences 
   * from an implicit base encoding. For a font program that is embedded in the PDF file, 
   * the implicit base encoding shall be the font program’s built-in encoding, 
   * and further elaborated in the sub-clauses on specific font types. 
   * Otherwise, for a nonsymbolic font, it shall be StandardEncoding, 
   * and for a symbolic font, it shall be the font’s built-in encoding.
   * */
  BaseEncoding: string;
  /** 
   * (Optional; should not be used with TrueType fonts) 
   * An array describing the differences from the encoding specified by BaseEncoding or, 
   * if BaseEncoding is absent, from an implicit base encoding.
   * */
  Differences: (number | string)[];

  //#endregion

  protected _charMap: Map<number, string>;
  get charMap(): Map<number, string> {
    if (!this._charMap) {
      this.refreshCharMaps();
    }
    return this._charMap;
  }

  protected _codeMap: Map<string, number>;
  get codeMap(): Map<string, number> {
    if (!this._codeMap) {
      this.refreshCharMaps();
    }
    return this._codeMap;
  }

  constructor() {
    super(dictTypes.ENCODING);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<EncodingDict>> {    
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new EncodingDict();
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
    
    if (this.BaseEncoding) {
      bytes.push(...encoder.encode("/BaseEncoding "), ...encoder.encode(" " + this.BaseEncoding));
    }
    if (this.Differences) {      
      bytes.push(...encoder.encode("/Differences "), ...this.encodePrimitiveArray(this.Differences, encoder));
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
    
    // DEBUG
    // console.log(parser.sliceChars(start, end));  
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {   
          case "/BaseEncoding":
            i = await this.parseNamePropAsync(name, parser, i);
            break; 

          case "/Differences": 
            const differencesValueType = await parser.getValueTypeAtAsync(i, true);
            if (differencesValueType === valueTypes.ARRAY) {
              this.Differences = [];
              const arrayBounds = await parser.getArrayBoundsAtAsync(i);          
              let j = arrayBounds.start + 1;
              while(j < arrayBounds.end - 1 && j !== -1) {
                const nextArrayValueType = await parser.getValueTypeAtAsync(j, true);
                switch (nextArrayValueType) {
                  case valueTypes.NAME:
                    const arrayNameResult = await parser.parseNameAtAsync(j, true);
                    this.Differences.push(arrayNameResult.value);
                    j = arrayNameResult.end + 1;
                    break;
                  case valueTypes.NUMBER:
                    const arrayNumberResult = await parser.parseNumberAtAsync(j, true);
                    this.Differences.push(arrayNumberResult.value);
                    j = arrayNumberResult.end + 1;
                    break;
                  default:
                    // should not end up here
                    throw new Error(`Invalid differences array value type: ${nextArrayValueType}`);
                }
              }
              i = arrayBounds.end + 1;
            } else {
              // should not end up here
              throw new Error(`Invalid differences value type: ${differencesValueType}`);
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

  protected refreshCharMaps() {
    if (this.Differences) {
      if (typeof this.Differences[0] !== "number") {
        throw new Error("First element of encoding difference array must be a number");
      }

      let code: number;
      // get the default map copy
      const charInfoMap = getCharCodesMapByCode(<any>this.BaseEncoding.substring(1));
      for (const diff of this.Differences) {
        if (typeof diff === "number") {
          // if the element is a number, then set it as the current code
          code = diff;
          continue;
        }
        // if element is a string (name), then replace the value in the default map
        const charInfo = pdfCharCodesByName[diff.substring(1)];
        if (charInfo) {
          charInfoMap.set(code++, charInfo); // don't forget to increment code
        }
      }

      // simplify and save the map
      this._charMap = new Map<number, string>();
      this._codeMap = new Map<string, number>();
      charInfoMap.forEach((v, k) => {
        this.charMap.set(k, v.char);
        this._codeMap.set(v.char, k);
      });
    }
  }
}
