import { dictTypes, valueTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { DateString } from "../common/date-string";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";

export class PageDict extends PdfDict {
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that is the immediate parent of this page object
   */
  Parent: ObjectId;
  /**
   * (Required if PieceInfo is present; optional otherwise; PDF 1.3+) 
   * The date and time when the page’s contents were most recently modified. 
   * If a page-piece dictionary (PieceInfo) is present, 
   * the modification date shall be used to ascertain 
   * which of the application data dictionaries 
   * that it contains correspond to the current content of the page
   */
  LastModified: DateString;
  /**
   * (Required; inheritable) A rectangle , expressed in default user space units, 
   * that shall define the boundaries of the physical medium 
   * on which the page shall be displayed or printed
   */
  MediaBox: [ll_x: number, ll_y: number, ur_x: number, ur_y: number];
  /**
   * (Optional; inheritable) The number of degrees by which the page shall be rotated 
   * clockwise when displayed or printed. The value shall be a multiple of 90
   */
  Rotate = 0;
  /**
   * (Optional) An array of annotation dictionaries that shall contain indirect 
   * references to all annotations associated with the page
   */
  Annots: ObjectId | ObjectId[]; 

  // TODO: Add other properties
  
  constructor() {
    super(dictTypes.PAGE);
  }  
  
  static parse(parseInfo: ParseInfo): ParseResult<PageDict> {    
    const trailer = new PageDict();
    const parseResult = trailer.tryParseProps(parseInfo);

    return parseResult
      ? {value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
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
          case "/Parent":
            const parentId = ObjectId.parseRef(parser, i);
            if (parentId) {
              this.Parent = parentId.value;
              i = parentId.end + 1;
            } else {              
              throw new Error("Can't parse /Parent property value");
            }
            break;
          case "/LastModified":
            const date = DateString.parse(parser, i, false);
            if (date) {
              this.LastModified = date.value;
              i = date.end + 1;
            } else {              
              throw new Error("Can't parse /LastModified property value");
            }
            break;          
          case "/MediaBox":
            const mediaBox = parser.parseNumberArrayAt(i, true);
            if (mediaBox) {
              this.MediaBox = [
                mediaBox.value[0],
                mediaBox.value[1],
                mediaBox.value[2],
                mediaBox.value[3],
              ];
              i = mediaBox.end + 1;
            } else {              
              throw new Error("Can't parse /MediaBox property value");
            }
            break;
          case "/Rotate":
            const rotate = parser.parseNumberAt(i, false);
            if (rotate) {
              this.Rotate = rotate.value;
              i = rotate.end + 1;
            } else {              
              throw new Error("Can't parse /Rotate property value");
            }
            break;
          case "/Annots":
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.REF) {              
              const annotArrayId = ObjectId.parseRef(parser, i);
              if (annotArrayId) {
                this.Annots = annotArrayId.value;
                i = annotArrayId.end + 1;
                break;
              }
            } else if (entryType === valueTypes.ARRAY) {              
              const annotIds = ObjectId.parseRefArray(parser, i);
              if (annotIds) {
                this.Annots = annotIds.value;
                i = annotIds.end + 1;
                break;
              }
            }
            throw new Error(`Unsupported /Annots property value type: ${entryType}`);
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.Parent) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
