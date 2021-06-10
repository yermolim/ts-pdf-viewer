import { Hextuple, Quadruple } from "../../../../../common/types";
import { codes } from "../../../../codes";
import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../const";
import { Mat3, Vec2 } from "mathador";
import { bezierConstant, calcPdfBBoxToRectMatrices } from "../../../../../drawing/utils";
import { buildCloudCurveFromEllipse } from "../../../../../drawing/clouds";

import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { XFormStream } from "../../../streams/x-form-stream";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { GeometricAnnotation, GeometricAnnotationDto } from "./geometric-annotation";

export interface CircleAnnotationDto extends GeometricAnnotationDto {  
  rectMargins: Quadruple;
  cloud: boolean;
}

export class CircleAnnotation extends GeometricAnnotation {
  static readonly cloudArcSize = 20;

  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying square or circle. Such a difference may occur in situations 
   * where a border effect (described by BE) causes the size of the Rect to increase 
   * beyond that of the square or circle
   */
  RD: Quadruple;

  /**defines if annotation should be rendered using wavy lines (for custom annotations) */
  protected _cloud: boolean;
  
  constructor() {
    super(annotationTypes.CIRCLE);
  }
  
  static createFromDto(dto: CircleAnnotationDto): CircleAnnotation {
    if (dto.annotationType !== "/Circle") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new CircleAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : null;

    annotation.Rect = dto.rect;
    annotation.RD = dto.rectMargins;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;

    annotation._cloud = dto.cloud;
    annotation.generateApStream(dto.bbox, dto.matrix);

    const proxy = new Proxy<CircleAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }

  static parse(parseInfo: ParseInfo): ParseResult<CircleAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    } 
    try {
      const pdfObject = new CircleAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<CircleAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD "), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  override toDto(): CircleAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Circle",
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
      rectMargins: this.RD,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      cloud: this._cloud,
      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
      strokeDashGap: this.BS?.D ?? [3, 0],
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
          case "/RD":
            i = this.parseNumberArrayProp(name, parser, i, true);
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
  
  protected generateApStream(bbox?: Quadruple, matrix?: Hextuple) {
    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    
    // set bounding box and transformation matrix
    const streamBbox: Quadruple = bbox 
      ? [bbox[0], bbox[1], bbox[2], bbox[3]]
      : [this.Rect[0], this.Rect[1], this.Rect[2], this.Rect[3]];  
    apStream.BBox = streamBbox;
    const streamMatrix: Hextuple =  matrix 
      ? [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]]
      : [1 ,0, 0, 1, 0, 0];
    apStream.Matrix = streamMatrix;

    // set color
    let colorString: string;
    if (!this.C?.length) {
      colorString = "0 G 0 g";
    } else if (this.C.length < 3) {
      const g = this.C[0];
      colorString = `${g} G ${g} g`;
    } else if (this.C.length === 3) {
      const [r, g, b] = this.C;      
      colorString = `${r} ${g} ${b} RG ${r} ${g} ${b} rg`;
    } else {      
      const [c, m, y, k] = this.C;      
      colorString = `${c} ${m} ${y} ${k} K ${c} ${m} ${y} ${k} k`;
    }

    // set stroke style options
    const opacity = this.CA || 1;
    const strokeWidth = this.strokeWidth;
    const strokeDash = this.BS?.D[0] ?? this.Border?.dash ?? 3;
    const strokeGap = this.BS?.D[1] ?? this.Border?.gap ?? 0;
    const gs = new GraphicsStateDict();
    gs.AIS = true;
    gs.BM = "/Normal";
    gs.CA = opacity;
    gs.ca = opacity;
    gs.LW = strokeWidth;
    gs.D = [[strokeDash, strokeGap], 0]; 
    gs.LC = lineCapStyles.ROUND;
    gs.LJ = lineJoinStyles.ROUND;

    // set margins to default if absent
    if (!this.RD) {
      const defaultMargin = this._cloud
        ? CircleAnnotation.cloudArcSize / 2
        : strokeWidth / 2;
      this.RD ||= [defaultMargin, defaultMargin, defaultMargin, defaultMargin];
    }  
    
    // calculate matrices needed for drawing
    const bBoxToRectMat = calcPdfBBoxToRectMatrices(streamBbox, 
      this.Rect, streamMatrix).matAA;
    const invMatArray = Mat3.invert(bBoxToRectMat).toFloatShortArray(); 
    const {r: rotation} = apStream.matrix.getTRS(); 
    const marginsRotationMat = new Mat3().applyRotation(rotation);
        
    // box corners starting positions
    const boxLL = new Vec2(streamBbox[0], streamBbox[1]);
    const boxLR = new Vec2(streamBbox[2], streamBbox[1]);
    const boxUR = new Vec2(streamBbox[2], streamBbox[3]);
    const boxUL = new Vec2(streamBbox[0], streamBbox[3]);

    // calculating margin vectors for the box corners
    // applying only rotation to keep margin values in their original state after any scaling
    const [marginLeft, marginTop, marginRight, marginBottom] = this.RD; 
    const marginLL = new Vec2(marginLeft, marginBottom).applyMat3(marginsRotationMat);
    const marginLR = new Vec2(-marginRight, marginBottom).applyMat3(marginsRotationMat);
    const marginUR = new Vec2(-marginRight, -marginTop).applyMat3(marginsRotationMat);
    const marginUL = new Vec2(marginLeft, -marginTop).applyMat3(marginsRotationMat);

    // apply transformation to the box corners
    // add the rotated margin vectors after transformation to preserve the initial margin values
    const trBoxLL = Vec2.applyMat3(boxLL, bBoxToRectMat).add(marginLL);
    const trBoxLR = Vec2.applyMat3(boxLR, bBoxToRectMat).add(marginLR);
    const trBoxUR = Vec2.applyMat3(boxUR, bBoxToRectMat).add(marginUR);
    const trBoxUL = Vec2.applyMat3(boxUL, bBoxToRectMat).add(marginUL);  
    const trBoxCenter = Vec2.add(trBoxLL, trBoxUR).multiplyByScalar(0.5);
    const trBoxLeft = Vec2.add(trBoxLL, trBoxUL).multiplyByScalar(0.5);
    const trBoxTop = Vec2.add(trBoxUL, trBoxUR).multiplyByScalar(0.5);
    const trBoxRight = Vec2.add(trBoxLR, trBoxUR).multiplyByScalar(0.5);
    const trBoxBottom = Vec2.add(trBoxLL, trBoxLR).multiplyByScalar(0.5);
    
    const rx = Vec2.substract(trBoxRight, trBoxLeft).multiplyByScalar(0.5);
    const ry = Vec2.substract(trBoxTop, trBoxBottom).multiplyByScalar(0.5);

    // push the graphics state onto the stack
    let streamTextData = `q ${colorString} /GS0 gs`; 
    // add the inversed transformation matrix to 
    streamTextData += `\n${invMatArray[0]} ${invMatArray[1]} ${invMatArray[2]} ${invMatArray[3]} ${invMatArray[4]} ${invMatArray[5]} cm`;

    // the graphics will be drawn using transformed coordinates to preserve stroke options
    // (by using such way line width, margins, etc. will still be as they were specified)
    if (this._cloud) {
      const curveData = buildCloudCurveFromEllipse(rx.getMagnitude(), ry.getMagnitude(), 
        CircleAnnotation.cloudArcSize, new Mat3().applyRotation(rotation).applyTranslation(trBoxCenter.x, trBoxCenter.y)); 
      streamTextData += `\n${curveData.start.x} ${curveData.start.y} m`;
      curveData.curves.forEach(x => {
        streamTextData += `\n${x[0].x} ${x[0].y} ${x[1].x} ${x[1].y} ${x[2].x} ${x[2].y} c`;
      });
      streamTextData += "\nS";
    } else {
      // draw ellipse using four cubic bezier curves
      // calculate the curves control points
      const c = bezierConstant;
      const cx = Vec2.multiplyByScalar(rx, c);
      const cy = Vec2.multiplyByScalar(ry, c);
      const controlTR1 = Vec2.add(Vec2.add(trBoxCenter, ry), cx);
      const controlTR2 = Vec2.add(Vec2.add(trBoxCenter, cy), rx);
      const controlRB1 = Vec2.add(Vec2.substract(trBoxCenter, cy), rx);
      const controlRB2 = Vec2.add(Vec2.substract(trBoxCenter, ry), cx);
      const controlBL1 = Vec2.substract(Vec2.substract(trBoxCenter, ry), cx);
      const controlBL2 = Vec2.substract(Vec2.substract(trBoxCenter, cy), rx);
      const controlLT1 = Vec2.substract(Vec2.add(trBoxCenter, cy), rx);
      const controlLT2 = Vec2.substract(Vec2.add(trBoxCenter, ry), cx);
      // drawing the curves starting at the top tangent
      streamTextData += `\n${trBoxTop.x} ${trBoxTop.y} m`;
      streamTextData += `\n${controlTR1.x} ${controlTR1.y} ${controlTR2.x} ${controlTR2.y} ${trBoxRight.x} ${trBoxRight.y} c`;
      streamTextData += `\n${controlRB1.x} ${controlRB1.y} ${controlRB2.x} ${controlRB2.y} ${trBoxBottom.x} ${trBoxBottom.y} c`;
      streamTextData += `\n${controlBL1.x} ${controlBL1.y} ${controlBL2.x} ${controlBL2.y} ${trBoxLeft.x} ${trBoxLeft.y} c`;
      streamTextData += `\n${controlLT1.x} ${controlLT1.y} ${controlLT2.x} ${controlLT2.y} ${trBoxTop.x} ${trBoxTop.y} c`;
      streamTextData += "\ns"; 
    }
    
    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
  
  protected override async applyCommonTransformAsync(matrix: Mat3) {    
    // transform bounding boxes
    this.applyRectTransform(matrix);

    const dict = <CircleAnnotation>this._proxy || this;
    
    // if the annotation has a content stream, rebuild the stream
    const stream = dict.apStream;
    if (stream) {
      const newApMatrix = Mat3.multiply(stream.matrix, matrix);
      dict.generateApStream(stream.BBox, <Hextuple><unknown>newApMatrix.toFloatShortArray());
    }

    dict.M = DateString.fromDate(new Date());
  }
}
