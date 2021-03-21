import { Vec2 } from "../math";

import { DocumentData } from "../document/document-data";
import { InkAnnotation } from "../document/entities/annotations/markup/ink-annotation";

import { Annotator } from "./annotator";
import { PenTempData } from "./pen-temp-data";

export class PenAnnotator extends Annotator {
  protected _annotationPenData: PenTempData;

  constructor(docData: DocumentData, parent: HTMLDivElement) {
    super(docData, parent);
    this.init();
  }

  destroy() {   
    this.removeTempPenData();
    super.destroy();
  }

  refreshViewBox() {
    super.refreshViewBox();
    this.updatePenGroupPosition();
  }

  undoPath() {
    this._annotationPenData?.removeLastPath();
    this.emitPathCount();
  }

  clearPaths() {
    this.removeTempPenData();
  }

  savePathsAsInkAnnotation() {
    // TODO: implement
    console.log("save as ink");
    this.removeTempPenData();
    // this.forceRenderPageById(pageId);
  }
  
  protected init() {
    super.init();    
    this._overlay.addEventListener("pointerdown", 
      this.onPenPointerDown);
  }  

  protected updatePenGroupPosition() {
    if (!this._annotationPenData) {
      return;
    }
    const page = this._renderedPages.find(x => x.id === this._annotationPenData.id);
    if (!page) {
      // set scale to 0 to hide pen group if it's page is not rendered
      this._annotationPenData.setGroupMatrix(
        [0, 0, 0, 0, 0, 0]);
    }
    const {height: ph, top: ptop, left: px} = page.viewContainer.getBoundingClientRect();
    const py = ptop + ph;
    const {height: vh, top: vtop, left: vx} = this._parent.getBoundingClientRect();
    const vy = vtop + vh;
    const offsetX = (px - vx) / this._scale;
    const offsetY = (vy - py) / this._scale;

    this._annotationPenData.setGroupMatrix(
      [1, 0, 0, 1, offsetX, offsetY]);
  }

  protected removeTempPenData() {
    if (this._annotationPenData) {
      this._annotationPenData.group.remove();
      this._annotationPenData = null;
      this.emitPathCount();
    }    
  }

  protected resetTempPenData(pageId: number) {    
    this.removeTempPenData();    
    this._annotationPenData = new PenTempData({id: pageId});
    this._svgGroup.append(this._annotationPenData.group);

    // update pen group matrix to position the group properly
    this.updatePenGroupPosition();
  }
  
  protected onPenPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePageCoords(cx, cy);
    const pageCoords = this._pageCoords;
    if (!pageCoords) {
      // return if the pointer is outside page
      return;
    }

    const {pageX: px, pageY: py, pageId} = pageCoords;
    if (!this._annotationPenData || pageId !== this._annotationPenData.id) {
      this.resetTempPenData(pageId);
    }
    this._annotationPenData.newPath(new Vec2(px, py));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPenPointerMove);
    target.addEventListener("pointerup", this.onPenPointerUp);    
    target.addEventListener("pointerout", this.onPenPointerUp);    

    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPenPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary || !this._annotationPenData) {
      return;
    }

    const {clientX: cx, clientY: cy} = e;
    this.updatePageCoords(cx, cy);

    const pageCoords = this._pageCoords;
    if (!pageCoords || pageCoords.pageId !== this._annotationPenData.id) {
      // skip move if the pointer is outside of the starting page
      return;
    }
    
    this._annotationPenData.addPosition(new Vec2(pageCoords.pageX, pageCoords.pageY));
  };

  protected onPenPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onPenPointerMove);
    target.removeEventListener("pointerup", this.onPenPointerUp);    
    target.removeEventListener("pointerout", this.onPenPointerUp);   

    this._annotationPenData?.endPath();
    this.emitPathCount();
  };

  protected emitPathCount() {
    this._parent.dispatchEvent(new CustomEvent("penpathchange", {
      detail: {
        pathCount: this._annotationPenData?.pathCount || 0,
      }
    }));
  }
}
