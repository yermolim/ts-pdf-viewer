import { StandardStampCreationInfo, standardStampCreationInfos } 
  from "../../../../drawing/stamps";
import { AnnotationDto } from "../../../../common/annotation";

import { CryptInfo } from "../../../encryption/interfaces";
import { annotationTypes, colorSpaces, stampTypes, StampType } from "../../../spec-constants";
import { ParseResult } from "../../../data-parse/data-parser";
import { ParseInfo } from "../../../data-parse/parser-info";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";

import { XFormStream } from "../../streams/x-form-stream";
import { ImageStream } from "../../streams/image-stream";
import { ResourceDict } from "../../appearance/resource-dict";
import { DecodeParamsDict } from "../../encoding/decode-params-dict";

import { MarkupAnnotation } from "./markup-annotation";

export interface StampAnnotationDto extends AnnotationDto {
  stampType: string;
  stampSubject?: string;
  stampImageData?: number[];
}

export class StampAnnotation extends MarkupAnnotation {
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: StampType | string = stampTypes.DRAFT;  
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the annotation
   */
  IT = "/Stamp";
  
  protected constructor() {
    super(annotationTypes.STAMP);
  }
  
  static createFromDto(dto: StampAnnotationDto): StampAnnotation {
    if (dto.annotationType !== "/Stamp") {
      throw new Error("Invalid annotation type");
    }

    const created = DateString.fromDate(new Date(dto.dateCreated));
    const modified = DateString.fromDate(new Date(dto.dateModified)); 

    const apStream = new XFormStream();
    apStream.LastModified = modified;
    apStream.Filter = "/FlateDecode";
    apStream.Resources = new ResourceDict();
    apStream.Matrix = dto.matrix || [1, 0, 0, 1, 0, 0];    
    
    const annotation = new StampAnnotation();
    annotation.$name = dto.uuid;  
    annotation.NM = LiteralString.fromString(dto.uuid); // identifier
    annotation.T = LiteralString.fromString(dto.author || "unknown");
    annotation.M = modified;
    annotation.CreationDate = created;
    annotation.Name = dto.stampType;   
    annotation.apStream = apStream;
    
    // set the stamp options using the default stamp information dictionary
    const stampCreationInfo: StandardStampCreationInfo = 
      standardStampCreationInfos[dto.stampType];
    if (stampCreationInfo) {
      // standard stamp
      const stampForm = new XFormStream();
      stampForm.LastModified = modified;
      stampForm.Filter = "/FlateDecode";

      stampForm.setTextStreamData(stampCreationInfo.textStreamData);
      const color = stampCreationInfo.color;
      const subject = stampCreationInfo.subject;
      const bBox = stampCreationInfo.bBox;
      const rect = dto.rect || stampCreationInfo.rect;
      
      stampForm.BBox = bBox;

      const r = color[0].toFixed(3);
      const g = color[1].toFixed(3);
      const b = color[2].toFixed(3);
      const colorString = `${r} ${g} ${b} rg ${r} ${g} ${b} RG`;

      apStream.BBox = bBox;
      apStream.Resources.setXObject("/Fm", stampForm);
      apStream.setTextStreamData(`q 1 0 0 -1 0 ${bBox[3]} cm ${colorString} 1 j 8.58 w /Fm Do Q`);
      
      annotation.Rect = rect;
      annotation.Subj = LiteralString.fromString(subject);
      annotation.Contents = dto.textContent 
        ? LiteralString.fromString(dto.textContent) 
        : annotation.Subj;
      annotation.C = color;
      annotation.CA = 1; // opacity
    } else if (dto.stampImageData?.length && !(dto.stampImageData.length % 4)) {
      // custom stamp
      const data = new Uint8Array(dto.stampImageData);

      const stampMask = new ImageStream();
      const stampMaskDecodeParams = new DecodeParamsDict();
      stampMaskDecodeParams.setIntProp("/Predictor", 12);
      stampMaskDecodeParams.setIntProp("/Colors", 1);
      stampMaskDecodeParams.setIntProp("/BitsPerComponent", 8);
      stampMaskDecodeParams.setIntProp("/Columns", dto.bbox[2]);
      stampMask.DecodeParms = stampMaskDecodeParams;
      stampMask.Filter = "/FlateDecode";
      stampMask.BitsPerComponent = 8;
      stampMask.Width = dto.bbox[2];
      stampMask.Height = dto.bbox[3];
      stampMask.ColorSpace = colorSpaces.GRAYSCALE;
      stampMask.streamData = data.filter((v, i) => (i + 1) % 4 === 0); // take only alpha values

      const stampImage = new ImageStream();
      const stampImageDecodeParams = new DecodeParamsDict();
      stampImageDecodeParams.setIntProp("/Predictor", 12);
      stampImageDecodeParams.setIntProp("/Colors", 3);
      stampImageDecodeParams.setIntProp("/BitsPerComponent", 8);
      stampImageDecodeParams.setIntProp("/Columns", dto.bbox[2]);
      stampImage.DecodeParms = stampImageDecodeParams;
      stampImage.Filter = "/FlateDecode";
      stampImage.BitsPerComponent = 8;
      stampImage.Width = dto.bbox[2];
      stampImage.Height = dto.bbox[3];
      stampImage.ColorSpace = colorSpaces.RGB;
      stampImage.streamData = data.filter((v, i) => (i + 1) % 4 !== 0); // skip alpha values
      stampImage.sMask = stampMask;
      
      apStream.BBox = dto.bbox;
      apStream.Resources.setXObject("/Im", stampImage);
      apStream.setTextStreamData(`q ${dto.bbox[2]} 0 0 ${dto.bbox[3]} 0 0 cm /Im Do Q`);
      
      annotation.Rect = dto.rect;
      annotation.Subj = dto.stampSubject 
        ? LiteralString.fromString(dto.stampSubject) 
        : LiteralString.fromString(dto.stampType);
      annotation.Contents = dto.textContent 
        ? LiteralString.fromString(dto.textContent) 
        : annotation.Subj;
    } else {
      throw new Error("Custom stamp has no valid image data");
    }

    annotation._added = true;
    return annotation.initProxy();
  }

  static parse(parseInfo: ParseInfo): ParseResult<StampAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new StampAnnotation();
      pdfObject.parseProps(parseInfo); 
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

    if (this.Name) {
      bytes.push(...encoder.encode("/Name "), ...encoder.encode(this.Name));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  override toDto(): StampAnnotationDto {
    return {
      annotationType: "/Stamp",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this.CreationDate?.date.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this.T?.literal,

      textContent: this.Contents?.literal,

      rect: this.Rect,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      stampType: this.Name,
      stampSubject: this.Subj?.literal,
      stampImageData: null, // TODO: add export custom image data
    };
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
          case "/Name":
            i = this.parseNameProp(name, parser, i);
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
    
    if (!this.Name) {
      throw new Error("Not all required properties parsed");
    }
  }
  
  protected override initProxy(): StampAnnotation {
    return <StampAnnotation>super.initProxy();
  }

  protected override getProxy(): StampAnnotation {
    return <StampAnnotation>super.getProxy();
  }
}
