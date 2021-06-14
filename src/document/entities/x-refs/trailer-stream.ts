import { dictTypes, streamTypes, valueTypes } from "../../spec-constants";
import { HexString } from "../strings/hex-string";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { EncryptionDict } from "../encryption/encryption-dict";
import { PdfStream } from "../core/pdf-stream";
import { codes } from "../../encoding/char-codes";
import { CryptInfo } from "../../common-interfaces";

export class TrailerStream extends PdfStream {
  /**
   * (Required) The number one greater than the highest object number 
   * used in this section or in any section for which this shall be an update. 
   * It shall be equivalent to the Size entry in a trailer dictionary
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference stream; 
   * not meaningful in hybrid-reference files) 
   * The byte offset in the decoded stream from the beginning of the file 
   * to the beginning of the previous cross-reference stream. 
   * This entry has the same function as the Prev entry in the trailer dictionary
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
  Encrypt: ObjectId;// | EncryptionDict; // not sure if encryption dictionary can be direct object
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
  /**
   * (Optional) An array containing a pair of integers for each subsection 
   * in this section. The first integer shall be the first object number 
   * in the subsection; the second integer shall be the number of entries 
   * in the subsection The array shall be sorted in ascending order by object number. 
   * Subsections cannot overlap; 
   * an object number may have at most one entry in a section
   */
  Index: number[];
  /**
   * (Required) An array of integers representing the size of the fields 
   * in a single cross-reference entry. 
   * For PDF 1.5+, W always contains three integers; the value of each integer 
   * shall be the number of bytes (in the decoded stream) of the corresponding field
   */
  W: [type: number, value1: number, value2: number];
  
  constructor() {
    super(streamTypes.XREF);
  }  
  
  static parse(parseInfo: ParseInfo): ParseResult<TrailerStream> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TrailerStream();
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

    if (this.Size) {
      bytes.push(...encoder.encode("/Size "), ...encoder.encode(" " + this.Size));
    }
    if (this.Prev) {
      bytes.push(...encoder.encode("/Prev "), ...encoder.encode(" " + this.Prev));
    }
    if (this.Root) {
      bytes.push(...encoder.encode("/Root "), codes.WHITESPACE, ...this.Root.toArray(cryptInfo));
    }
    if (this.Encrypt) {
      bytes.push(...encoder.encode("/Encrypt "), codes.WHITESPACE, ...this.Encrypt.toArray(cryptInfo));
      // if (this.Encrypt instanceof ObjectId) {
      //   bytes.push(...encoder.encode("/Encrypt "), codes.WHITESPACE, ...this.Encrypt.toRefArray());
      // } else {
      //   bytes.push(...encoder.encode("/Encrypt "), ...this.Encrypt.toArray(cryptInfo));
      // }
    }
    if (this.Info) {
      bytes.push(...encoder.encode("/Info "), codes.WHITESPACE, ...this.Info.toArray(cryptInfo));
    }
    if (this.ID) {
      bytes.push(...encoder.encode("/ID "), codes.L_BRACKET, 
        ...this.ID[0].toArray(cryptInfo), ...this.ID[1].toArray(cryptInfo), codes.R_BRACKET);
    }
    if (this.Index) {
      bytes.push(...encoder.encode("/Index "), codes.L_BRACKET);
      this.Index.forEach(x => bytes.push(...encoder.encode(" " + x))); 
      bytes.push(codes.R_BRACKET);
    }
    if (this.W) {
      bytes.push(
        ...encoder.encode("/W "), codes.L_BRACKET,
        ...encoder.encode(this.W[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.W[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.W[2] + ""), codes.R_BRACKET,
      );
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Size":
          case "/Prev":
            i = this.parseNumberProp(name, parser, i, false);
            break;

          case "/Root":
          case "/Info":
            i = this.parseRefProp(name, parser, i);
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
            // } else if (entryType === valueTypes.DICTIONARY) {  
            //   const encryptBounds = parser.getDictBoundsAt(i);
            //   if (encryptBounds) {         
            //     const encrypt = EncryptionDict.parse({parser, bounds: encryptBounds});
            //     if (encrypt) {
            //       this.Encrypt = encrypt.value;
            //       i = encryptBounds.end + 1;
            //       break;
            //     }
            //   }               
            //   throw new Error("Can't parse /Encrypt property value");
            }
            throw new Error(`Unsupported /Encrypt property value type: ${entryType}`);

          case "/ID":
            const ids = HexString.parseArray(parser, i);
            if (ids) {
              this.ID = [ids.value[0], ids.value[1]];
              i = ids.end + 1;
            } else {              
              throw new Error("Can't parse /ID property value");
            }
            break;

          case "/Index":
          case "/W":
            i = this.parseNumberArrayProp(name, parser, i, false);
            break;

          default:
            // skip to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.W || !this.Size || !this.Root || (this.Encrypt && !this.ID)) {
      throw new Error("Not all required properties parsed");
    }

    if (!this.Index?.length) {
      this.Index = [0, this.Size];
    }
  }
}
