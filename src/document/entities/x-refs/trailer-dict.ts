import { dictTypes, valueTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfDict } from "../core/pdf-dict";
import { ObjectId } from "../common/object-id";
import { HexString } from "../common/hex-string";
import { EncryptionDict } from "../encryption/encryption-dict";
import { codes } from "../../common/codes";

export class TrailerDict extends PdfDict {
  /**
   * (Required; shall not be an indirect reference) 
   * The total number of entries in the file’s cross-reference table, 
   * as defined by the combination of the original section and all update sections. 
   * Equivalently, this value shall be 1 greater than the highest object number 
   * defined in the file. Any object in a cross-reference section 
   * whose number is greater than this value shall be ignored and
   * defined to be missing by a conforming reader
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference section; 
   * shall be an indirect reference) The byte offset in the decoded stream 
   * from the beginning of the file to the beginning 
   * of the previous cross-reference section
   */
  Prev: number;
  /**
   * (Required; shall be an indirect reference) The catalog dictionary 
   * for the PDF document contained in the file
   */
  Root: ObjectId;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: ObjectId | EncryptionDict;
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: ObjectId;
  /**
   * (Required if an Encrypt entry is present; optional otherwise; PDF 1.1+) 
   * An array of two byte-strings constituting a file identifier for the file. 
   * If there is an Encrypt entry this array and the two byte-strings 
   * shall be direct objects and shall be unencrypted
   */
  ID: [HexString, HexString];
  
  constructor() {
    super(dictTypes.EMPTY);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<TrailerDict> {    
    const trailer = new TrailerDict();
    const parseResult = trailer.tryParseProps(parseInfo);

    return parseResult
      ? {value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }

  toArray(): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Size) {
      bytes.push(...encoder.encode("/Size"), ...encoder.encode(this.Size + ""));
    }
    if (this.Prev) {
      bytes.push(...encoder.encode("/Prev"), ...encoder.encode(this.Prev + ""));
    }
    if (this.Root) {
      bytes.push(...encoder.encode("/Root"), ...this.Root.toRefArray());
    }
    if (this.Encrypt) {
      if (this.Encrypt instanceof ObjectId) {
        bytes.push(...encoder.encode("/Encrypt"), ...this.Encrypt.toRefArray());
      } else {
        bytes.push(...encoder.encode("/Encrypt"), ...this.Encrypt.toArray());
      }
    }
    if (this.Info) {
      bytes.push(...encoder.encode("/Info"), ...this.Info.toRefArray());
    }
    if (this.ID) {
      bytes.push(...encoder.encode("/ID"), codes.L_BRACKET, 
        ...this.ID[0].toArray(), ...this.ID[1].toArray(), codes.R_BRACKET);
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
          case "/Size":
            const size = parser.parseNumberAt(i, false);
            if (size) {
              this.Size = size.value;
              i = size.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Prev":
            const prev = parser.parseNumberAt(i, false);
            if (prev) {
              this.Prev = prev.value;
              i = prev.end + 1;
            } else {              
              throw new Error("Can't parse /Size property value");
            }
            break;
          case "/Root":
            const rootId = ObjectId.parseRef(parser, i);
            if (rootId) {
              this.Root = rootId.value;
              i = rootId.end + 1;
            } else {              
              throw new Error("Can't parse /Root property value");
            }
            break;
          case "/Encrypt":
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.REF) {              
              const encryptId = ObjectId.parseRef(parser, i);
              if (encryptId) {
                this.Encrypt = encryptId.value;
                i = encryptId.end + 1;
                break;
              } 
              else {              
                throw new Error("Can't parse /Encrypt property value");
              }
            } else if (entryType === valueTypes.DICTIONARY) {  
              const encryptBounds = parser.getDictBoundsAt(i);
              if (encryptBounds) {         
                const encrypt = EncryptionDict.parse({parser, bounds: encryptBounds});
                if (encrypt) {
                  this.Encrypt = encrypt.value;
                  i = encryptBounds.end + 1;
                  break;
                }
              }               
              throw new Error("Can't parse /Encrypt property value");
            }
            throw new Error(`Unsupported /Encrypt property value type: ${entryType}`);
          case "/Info":
            const infoId = ObjectId.parseRef(parser, i);
            if (infoId) {
              this.Info = infoId.value;
              i = infoId.end + 1;
            } else {              
              throw new Error("Can't parse /Info property value");
            }
            break;
          case "/ID":
            const ids = HexString.parseArray(parser, i);
            if (ids) {
              this.ID = [ids.value[0], ids.value[1]];
              i = ids.end + 1;
            } else {              
              throw new Error("Can't parse /ID property value");
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
    
    if (!this.Size || !this.Root || (this.Encrypt && !this.ID)) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
