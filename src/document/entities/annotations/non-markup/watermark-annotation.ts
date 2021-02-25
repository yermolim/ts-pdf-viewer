import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";
import { RenderToSvgResult } from "../../../../common";

export class WatermarkAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WATERMARK);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  render(): RenderToSvgResult {
    const streamRenderResult = super.render();
    if (streamRenderResult) {
      return streamRenderResult;
    }

    // TODO: implement individual render methods
    return null;
  }
}
