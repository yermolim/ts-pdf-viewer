import { annotationTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { MarkupAnnotation } from "./markup-annotation";

export class ProjectionAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.PROJECTION);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  // TODO: implement render method
}
