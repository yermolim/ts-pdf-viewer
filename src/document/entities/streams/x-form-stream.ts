import { Mat3, Vec2 } from "mathador";
import { Hextuple, Quadruple } from "../../../common/types";
import { BBox } from "../../../drawing/utils";

import { CryptInfo } from "../../encryption/interfaces";
import { streamTypes, valueTypes } from "../../spec-constants";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";

import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";
import { DateString } from "../strings/date-string";
import { ResourceDict } from "../appearance/resource-dict";
import { MeasureDict } from "../appearance/measure-dict";
import { TransparencyGroupDict } from "../appearance/transparency-group-dict";
import { ImageStream } from "./image-stream";

export class XFormStream extends PdfStream {
  /**
   * (Required) The type of XObject that this dictionary describes
   */
  readonly Subtype: "/Form" = "/Form";
  /**
   * (Optional) A code identifying the type of form XObject that this dictionary describes. 
   * The only valid value is 1
   */
  readonly FormType: 1 = 1;
  /**
   * (Required) An array of four numbers in the form coordinate system (see above), 
   * giving the coordinates of the left, bottom, right, and top edges, respectively, 
   * of the form XObject’s bounding box
   */
  BBox: Quadruple;
  /**
   * (Optional) An array of six numbers specifying the form matrix, 
   * which maps form space into user space
   */
  Matrix: Hextuple = [1,0,0,1,0,0];
  /**
   * (Optional but strongly recommended; PDF 1.2+) A dictionary specifying any resources 
   * (such as fonts and images) required by the form
   */
  Resources: ResourceDict;
  /**
   * (Optional; PDF 1.4+) A metadata stream containing metadata for the form XObject
   */
  Metadata: ObjectId;
  /**
   * (Required if PieceInfo is present; optional otherwise; PDF 1.3+) 
   * The date and time when the form XObject’s contents were most recently modified. 
   * If a page-piece dictionary (PieceInfo) is present, the modification date 
   * shall be used to ascertain which of the application data dictionaries 
   * it contains correspond to the current content of the form
   */
  LastModified: DateString;
  /** 
   * (Required if the form XObject is a structural content item; PDF 1.3+) 
   * The integer key of the form XObject’s entry in the structural parent tree
   * */
  StructParent: number;
  /** 
   * (Required if the form XObject contains marked-content sequences 
   * that are structural content items; PDF 1.3+) 
   * The integer key of the form XObject’s entry in the structural parent tree
   * */
  StructParents: number;
  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  /** 
   * (Optional; PDF1.4+) A group attributes dictionary indicating that the contents 
   * of the form XObject are to be treated as a group and specifying the attributes of that group
   */
  Group: TransparencyGroupDict;

  // /** (Optional; PDF 1.5+) An optional content group or optional content membership dictionary
  //  *  specifying the optional content properties for the annotation */
  // OC: OcMembershipDict | OcGroupDict;

  //TODO: add remaining properties
  //OPI
  //PtData

  get matrix(): Mat3 {         
    const apMatrix = new Mat3();
    if (this.Matrix) {
      const [m0, m1, m3, m4, m6, m7] = this.Matrix;
      apMatrix.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
    }
    return apMatrix;
  }  
  set matrix(matrix: Mat3) {  
    if (!matrix) {
      return;
    }  
    this.Matrix = <Hextuple><unknown>[...matrix.toFloatShortArray()];
  }
  
  get bBox(): BBox {
    return {
      ll: new Vec2(this.BBox[0], this.BBox[1]),
      lr: new Vec2(this.BBox[2], this.BBox[1]),
      ur: new Vec2(this.BBox[2], this.BBox[3]),
      ul: new Vec2(this.BBox[0], this.BBox[3]),
    };
  }    
  get transformedBBox(): BBox {
    const matrix = new Mat3();
    if (this.Matrix) {
      const [m0, m1, m3, m4, m6, m7] = this.Matrix;
      matrix.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
    }
    const bBoxLL = new Vec2(this.BBox[0], this.BBox[1]);
    const bBoxLR = new Vec2(this.BBox[2], this.BBox[1]);
    const bBoxUR = new Vec2(this.BBox[2], this.BBox[3]);
    const bBoxUL = new Vec2(this.BBox[0], this.BBox[3]);
    return {
      ll: Vec2.applyMat3(bBoxLL, matrix),
      lr: Vec2.applyMat3(bBoxLR, matrix),
      ur: Vec2.applyMat3(bBoxUR, matrix),
      ul: Vec2.applyMat3(bBoxUL, matrix),
    };
  }
  
  override get edited(): boolean {
    return this._edited || this.Resources.edited;
  }  
  
  constructor() {
    super(streamTypes.FORM_XOBJECT);
  }  

  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<XFormStream>> {    
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new XFormStream();
      await pdfObject.parsePropsAsync(parseInfo);
      return {
        value: pdfObject.initProxy(), 
        start: parseInfo.bounds.start, 
        end: parseInfo.bounds.end,
      };
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }
    if (this.FormType) {
      bytes.push(...encoder.encode("/FormType "), ...encoder.encode(" " + this.FormType));
    }
    if (this.BBox) {
      bytes.push(...encoder.encode("/BBox "), ...this.encodePrimitiveArray(this.BBox, encoder));
    }
    if (this.Matrix) {
      bytes.push(...encoder.encode("/Matrix "), ...this.encodePrimitiveArray(this.Matrix, encoder));
    }
    if (this.Resources) {
      bytes.push(...encoder.encode("/Resources "), ...this.Resources.toArray(cryptInfo));
    }
    if (this.Metadata) {
      bytes.push(...encoder.encode("/Metadata "), ...this.Metadata.toArray(cryptInfo));
    }
    if (this.LastModified) {
      bytes.push(...encoder.encode("/LastModified "), ...this.LastModified.toArray(cryptInfo));
    }
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent "), ...encoder.encode(" " + this.StructParent));
    }
    if (this.StructParents) {
      bytes.push(...encoder.encode("/StructParents "), ...encoder.encode(" " + this.StructParents));
    }
    if (this.Measure) {
      bytes.push(...encoder.encode("/Measure "), ...this.Measure.toArray(cryptInfo));
    }
    if (this.Group) {
      bytes.push(...encoder.encode("/Group "), ...this.Group.toArray(cryptInfo));
    }
    
    //TODO: handle remaining properties

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
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = await parser.skipToNextNameAsync(dictBounds.contentStart, dictBounds.contentEnd);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Subtype":
            const subtype = parser.parseNameAt(i);
            if (subtype) {
              if (this.Subtype && this.Subtype !== subtype.value) {
                // wrong object subtype
                throw new Error(`Invalid dict subtype: '${subtype.value}' instead of '${this.Subtype}'`);
              }
              i = subtype.end + 1;
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;
          case "/FormType":
            const formType = parser.parseNumberAt(i, false);
            if (formType) {
              if (formType.value !== 1) {
                // wrong form type
                throw new Error(`Ivalid form type: '${formType.value}' instead of '1'`);
              }
              i = formType.end + 1;
            } else {
              throw new Error("Can't parse /FormType property value");
            }
            break; 

          case "/BBox":
          case "/Matrix":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break; 

          case "/LastModified":
            i = await this.parseDatePropAsync(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/Metadata":
            i = await this.parseRefPropAsync(name, parser, i);
            break;

          case "/StructParent":
          case "/StructParents":
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break;

          case "/Resources":
            const resEntryType = await parser.getValueTypeAtAsync(i);
            if (resEntryType === valueTypes.REF) {              
              const resDictId = await ObjectId.parseRefAsync(parser, i);
              if (resDictId && parseInfo.parseInfoGetterAsync) {
                const resParseInfo = await parseInfo.parseInfoGetterAsync(resDictId.value.id);
                if (resParseInfo) {
                  const resDict = await ResourceDict.parseAsync(resParseInfo, 
                    {xform: XFormStream.parseAsync, image: ImageStream.parseAsync});
                  if (resDict) {
                    this.Resources = resDict.value;
                    i = resDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /Resources value reference");
            } else if (resEntryType === valueTypes.DICTIONARY) { 
              const resDictBounds = parser.getDictBoundsAt(i); 
              if (resDictBounds) {
                if (resDictBounds.contentStart) {
                  const resDict = await ResourceDict.parseAsync({
                    parser,
                    bounds: resDictBounds,
                    parseInfoGetterAsync: parseInfo.parseInfoGetterAsync,
                  }, {xform: XFormStream.parseAsync, image: ImageStream.parseAsync});
                  if (resDict) {
                    this.Resources = resDict.value;
                  } else {                  
                    throw new Error("Can't parse /Resources value dictionary");  
                  }
                }
                i = resDictBounds.end + 1;
                break;
              }
              throw new Error("Can't parse /Resources dictionary bounds"); 
            }
            throw new Error(`Unsupported /Resources property value type: ${resEntryType}`);         
          case "/Measure":            
            const measureEntryType = await parser.getValueTypeAtAsync(i);
            if (measureEntryType === valueTypes.REF) {              
              const measureDictId = await ObjectId.parseRefAsync(parser, i);
              if (measureDictId && parseInfo.parseInfoGetterAsync) {
                const measureParseInfo = await parseInfo.parseInfoGetterAsync(measureDictId.value.id);
                if (measureParseInfo) {
                  const measureDict = await MeasureDict.parseAsync(measureParseInfo);
                  if (measureDict) {
                    this.Measure = measureDict.value;
                    i = measureDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /Measure value reference");
            } else if (measureEntryType === valueTypes.DICTIONARY) { 
              const measureDictBounds = parser.getDictBoundsAt(i); 
              if (measureDictBounds) {
                const measureDict = await MeasureDict.parseAsync(
                  {parser, bounds: measureDictBounds, cryptInfo: parseInfo.cryptInfo});
                if (measureDict) {
                  this.Measure = measureDict.value;
                  i = measureDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /Measure value dictionary");  
            }
            throw new Error(`Unsupported /Measure property value type: ${measureEntryType}`);
          case "/Group":            
            const groupEntryType = await parser.getValueTypeAtAsync(i);
            if (groupEntryType === valueTypes.REF) {              
              const groupDictId = await ObjectId.parseRefAsync(parser, i);
              if (groupDictId && parseInfo.parseInfoGetterAsync) {
                const groupParseInfo = await parseInfo.parseInfoGetterAsync(groupDictId.value.id);
                if (groupParseInfo) {
                  const groupDict = await TransparencyGroupDict.parseAsync(groupParseInfo);
                  if (groupDict) {
                    this.Group = groupDict.value;
                    i = groupDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /Group value reference");
            } else if (groupEntryType === valueTypes.DICTIONARY) { 
              const groupDictBounds = parser.getDictBoundsAt(i); 
              if (groupDictBounds) {
                const groupDict = await TransparencyGroupDict.parseAsync(
                  {parser, bounds: groupDictBounds, cryptInfo: parseInfo.cryptInfo});
                if (groupDict) {
                  this.Group = groupDict.value;
                  i = groupDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /Group value dictionary");  
            }
            throw new Error(`Unsupported /Group property value type: ${groupEntryType}`);        

          // TODO: handle remaining cases
          case "/OC":
          case "/OPI":
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.BBox) {
      throw new Error("Not all required properties parsed");
    }
  }
  
  protected override initProxy(): XFormStream {
    return <XFormStream>super.initProxy();
  }

  protected override getProxy(): XFormStream {
    return <XFormStream>super.getProxy();
  }
}
