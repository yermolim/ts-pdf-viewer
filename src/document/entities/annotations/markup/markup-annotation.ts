import { codes } from "../../../codes";
import { AnnotationType, valueTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";
import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";
import { ObjectId } from "../../core/object-id";
import { TextStream } from "../../streams/text-stream";
import { AnnotationDict } from "../annotation-dict";
import { ExDataDict } from "../misc/ex-data-dict";

export const markupAnnotationReplyTypes = {
  /**
   * The annotation shall be considered a reply to the annotation specified by IRT. 
   * Conforming readers shall not display replies to an annotation individually 
   * but together in the form of threaded comments
   */
  REPLY: "/R",
  /**
   * The annotation shall be grouped with the annotation specified by IRT
   */
  GROUP: "/Group",
} as const;
export type MarkupAnnotationReplyType = typeof markupAnnotationReplyTypes[keyof typeof markupAnnotationReplyTypes];

export abstract class MarkupAnnotation extends AnnotationDict {
  /**
   * (Optional; PDF 1.1+) The text label that shall be displayed in the title bar 
   * of the annotation’s pop-up window when open and active. 
   * This entry shall identify the user who added the annotation
   */
  T: LiteralString;
  /**
   * (Optional; PDF 1.3+) An indirect reference to a pop-up annotation 
   * for entering or editing the text associated with this annotation
   */
  Popup: ObjectId;
  /**
   * (Optional; PDF 1.5+) A rich text string that shall be displayed 
   * in the pop-up window when the annotation is opened
   */
  RC: LiteralString;
  /**
   * (Optional; PDF 1.4+) The constant opacity value
   */
  CA: number;
  /**
   * (Optional; PDF 1.5+) The date and time when the annotation was created
   */
  CreationDate: DateString;
  /**
   * (Optional; PDF 1.5+) Text representing a short description of the subject 
   * being addressed by the annotation
   */
  Subj: LiteralString;
  /**
   * (Required if an RT entry is present, otherwise optional; PDF 1.5+) 
   * A reference to the annotation that this annotation is “in reply to.” 
   * Both annotations shall be on the same page of the document. 
   * The relationship between the two annotations shall be specified by the RT entry
   */
  IRT: ObjectId;
  /**
   * (Optional; meaningful only if IRT is present; PDF 1.6+) 
   * A name specifying the relationship (the “reply type”) 
   * between this annotation and one specified by IRT
   */
  RT: MarkupAnnotationReplyType = markupAnnotationReplyTypes.REPLY;
  /**
   * (Optional; PDF 1.7+) An external data dictionary specifying data 
   * that shall be associated with the annotation
   */
  ExData: ExDataDict;
  
  protected constructor(subType: AnnotationType) {
    super(subType);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.T) {
      bytes.push(...encoder.encode("/T "), ...this.T.toArray(cryptInfo));
    }
    if (this.Popup) {
      bytes.push(...encoder.encode("/Popup "), codes.WHITESPACE, ...this.Popup.toArray(cryptInfo));
    }
    if (this.RC) {
      bytes.push(...encoder.encode("/RC "), ...this.RC.toArray(cryptInfo));
    }
    if (this.CA) {
      bytes.push(...encoder.encode("/CA "), ...encoder.encode(" " + this.CA));
    }
    if (this.CreationDate) {
      bytes.push(...encoder.encode("/CreationDate "), ...this.CreationDate.toArray(cryptInfo));
    }
    if (this.Subj) {
      bytes.push(...encoder.encode("/Subj "), ...this.Subj.toArray(cryptInfo));
    }
    if (this.IRT) {
      bytes.push(...encoder.encode("/IRT "), codes.WHITESPACE, ...this.IRT.toArray(cryptInfo));
    }
    if (this.RT) {
      bytes.push(...encoder.encode("/RT "), ...encoder.encode(this.RT));
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
          case "/T":
          case "/Subj":
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
            break;
          
          case "/Popup":
          case "/IRT":
            i = this.parseRefProp(name, parser, i);
            break;

          case "/RC":    
            // TODO: test it   
            const rcEntryType = parser.getValueTypeAt(i);
            if (rcEntryType === valueTypes.REF) {    
              // should be reference to text stream or literal string           
              const rsObjectId = ObjectId.parseRef(parser, i);
              if (rsObjectId && parseInfo.parseInfoGetter) {
                const rcParseInfo = parseInfo.parseInfoGetter(rsObjectId.value.id);
                if (rcParseInfo) {
                  const rcObjectType = rcParseInfo.type 
                    || rcParseInfo.parser.getValueTypeAt(rcParseInfo.bounds.contentStart);
                  if (rcObjectType === valueTypes.STRING_LITERAL) {
                    // reference is to the indirect literal string 
                    // or to the string in an object stream 
                    const popupTextFromIndirectLiteral = LiteralString
                      .parse(rcParseInfo.parser, rcParseInfo.bounds.contentStart);
                    if (popupTextFromIndirectLiteral) {
                      this.RC = popupTextFromIndirectLiteral.value;
                      i = rsObjectId.end + 1;
                      break;
                    }
                  } else if (rcObjectType === valueTypes.DICTIONARY) {
                    // should be a text stream. check it
                    const popupTextStream = TextStream.parse(rcParseInfo);
                    if (popupTextStream) {
                      const popupTextFromStream = popupTextStream.value.getText();
                      this.RC = LiteralString.fromString(popupTextFromStream);
                      i = rsObjectId.end + 1;
                      break;
                    }
                  } else {                     
                    throw new Error(`Unsupported /RC property value type: ${rcObjectType}`);
                  }
                }
              }              
              throw new Error("Can't parse /RC value reference");
            } else if (rcEntryType === valueTypes.STRING_LITERAL) { 
              const popupTextFromLiteral = LiteralString.parse(parser, i, parseInfo.cryptInfo);
              if (popupTextFromLiteral) {
                this.RC = popupTextFromLiteral.value;
                i = popupTextFromLiteral.end + 1;
                break;
              } else {              
              }
              throw new Error("Can't parse /RC property value"); 
            }
            throw new Error(`Unsupported /RC property value type: ${rcEntryType}`);
          
          case "/CA":
            i = this.parseNumberProp(name, parser, i, true);
            break;   
          
          case "/CreationDate":
            i = this.parseDateProp(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/RT":
            const replyType = parser.parseNameAt(i, true);
            if (replyType && (<string[]>Object.values(markupAnnotationReplyTypes))
              .includes(replyType.value)) {
              this.RT = <MarkupAnnotationReplyType>replyType.value;
              i = replyType.end + 1;              
            } else {              
              throw new Error("Can't parse /RT property value");
            }
            break; 
          
          case "/ExData":
            // TODO: handle this case
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
    
    if (!this.Subtype || !this.Rect) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
