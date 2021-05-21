import { Mat3, Vec2 } from "../../../../../common/math";
import { buildCloudCurveFromPolyline } from "../../../../../drawing/clouds";

import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { XFormStream } from "../../../streams/x-form-stream";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { PolyAnnotation, PolyAnnotationDto, polyIntents } from "./poly-annotation";

export interface PolygonAnnotationDto extends PolyAnnotationDto {  
  cloud: boolean;
}

export class PolygonAnnotation extends PolyAnnotation {  
  static readonly cloudArcSize = 20;
    
  constructor() {
    super(annotationTypes.POLYGON);
  }
  
  static createFromDto(dto: PolygonAnnotationDto): PolygonAnnotation {
    if (dto.annotationType !== "/Polygon") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new PolygonAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : null;
      
    annotation.Rect = dto.rect;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;
    annotation.IT = dto.cloud
      ? polyIntents.CLOUD
      : polyIntents.POLYGON_DIMENSION;
    annotation.Vertices = dto.vertices;

    annotation.generateApStream();

    const proxy = new Proxy<PolygonAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<PolygonAnnotation> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    } 
    try {
      const pdfObject = new PolygonAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<PolygonAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    return superBytes;
  } 
  
  toDto(): PolygonAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Square",
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

      vertices: this.Vertices,

      cloud: this.IT === polyIntents.CLOUD,
      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
      strokeDashGap: this.BS?.D ?? [3, 0],
    };
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    
    // bake the current annotation rotation into its appearance stream
    // works perfectly with PDF-XChange annotations
    // TODO: test with annotations created not in PDF-XChange
    this.bakeRotation();   
  }
  
  protected generateApStream() {
    if (!this.Vertices?.length || this.Vertices.length < 6) {
      // any polygon can't have less than 3 vertices (6 coordinates)
      return;
    }

    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    apStream.BBox = [this.Rect[0], this.Rect[1], this.Rect[2], this.Rect[3]];

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
    const strokeWidth = this.BS?.W ?? this.Border?.width ?? 1;
    const strokeDash = this.BS?.D[0] ?? this.Border?.dash ?? 3;
    const strokeGap = this.BS?.D[1] ?? this.Border?.gap ?? 0;
    const gs = new GraphicsStateDict();
    gs.AIS = true;
    gs.BM = "/Normal";
    gs.CA = opacity;
    gs.ca = opacity;
    gs.LW = strokeWidth;
    gs.D = [[strokeDash, strokeGap], 0];
    
    const list = this.Vertices;
    let streamTextData = `q ${colorString} /GS0 gs`;
    if (this.IT === polyIntents.CLOUD) {
      gs.LC = lineCapStyles.ROUND;
      gs.LJ = lineJoinStyles.ROUND; 
      
      const vertices: Vec2[] = [];
      for (let i = 0; i < list.length; i = i + 2) {
        vertices.push(new Vec2(list[i], list[i + 1]));
      }
      vertices.push(new Vec2(list[0], list[1])); // close the polygon
      const curveData = buildCloudCurveFromPolyline(vertices, PolygonAnnotation.cloudArcSize);      

      streamTextData += `\n${curveData.start.x} ${curveData.start.y} m`;
      curveData.curves.forEach(x => {
        streamTextData += `\n${x[0].x} ${x[0].y} ${x[1].x} ${x[1].y} ${x[2].x} ${x[2].y} c`;
      });
      streamTextData += "\nS";

    } else {
      gs.LC = lineCapStyles.SQUARE;
      gs.LJ = lineJoinStyles.MITER;

      let px: number;
      let py: number;
      streamTextData += `\n${list[0]} ${list[1]} m`;
      for (let i = 2; i < list.length; i = i + 2) {
        px = list[i];
        py = list[i + 1];
        streamTextData += `\n${px} ${py} l`;
      }
      streamTextData += "\ns"; 
    }

    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
  
  protected applyCommonTransform(matrix: Mat3) {  
    const dict = <PolygonAnnotation>this._proxy || this;

    // transform current Vertices
    let x: number;
    let y: number;
    let xMin: number;
    let yMin: number;
    let xMax: number;
    let yMax: number;
    const vec = new Vec2();
    const list = dict.Vertices;
    for (let i = 0; i < list.length; i = i + 2) {
      x = list[i];
      y = list[i + 1];
      vec.set(x, y).applyMat3(matrix);
      list[i] = vec.x;
      list[i + 1] = vec.y;

      if (!xMin || vec.x < xMin) {
        xMin = vec.x;
      }
      if (!yMin || vec.y < yMin) {
        yMin = vec.y;
      }
      if (!xMax || vec.x > xMax) {
        xMax = vec.x;
      }
      if (!yMax || vec.y > yMax) {
        yMax = vec.y;
      }
    }
    
    // update the Rect
    const halfStrokeWidth = (dict.BS?.W ?? dict.Border?.width ?? 1) / 2;
    const margin = dict.IT === polyIntents.CLOUD
      ? PolygonAnnotation.cloudArcSize / 2 + halfStrokeWidth
      : halfStrokeWidth;
    xMin -= margin;
    yMin -= margin;
    xMax += margin;
    yMax += margin;
    dict.Rect = [xMin, yMin, xMax, yMax];
    // update calculated bBox if present
    if (dict._bBox) {
      const bBox =  dict.getLocalBB();
      bBox.ll.set(xMin, yMin);
      bBox.lr.set(xMax, yMin);
      bBox.ur.set(xMax, yMax);
      bBox.ul.set(xMin, yMax);
    }

    // rebuild the appearance stream instead of transforming it to get rid of line distorsions
    dict.generateApStream();

    dict.M = DateString.fromDate(new Date());
  }
  
  protected bakeRotation() {    
    const angle = this.getCurrentRotation();
    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;

    // calculate the rotation matrix
    const matrix = new Mat3()
      .applyTranslation(-centerX, -centerY)
      .applyRotation(angle)
      .applyTranslation(centerX, centerY);

    this.applyCommonTransform(matrix);
  }
}
