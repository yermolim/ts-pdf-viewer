import { annotationTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { AnnotationDict } from "../annotation-dict";

export class ScreenAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.SCREEN);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
