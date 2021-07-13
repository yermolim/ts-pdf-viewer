import { textDialogHtml } from "../assets/index.html";

import { clamp, Vec2, getDistance2D } from "mathador";
import { htmlToElements } from "../common/dom";

import { PageService, CurrentPageChangeRequestEvent, currentPageChangeRequestEvent, 
  pagesLoadedEvent, PagesLoadedEvent } from "../services/page-service";

export const viewerModes = ["text", "hand", "annotation"] as const;
export type ViewerMode =  typeof viewerModes[number];

export interface ViewerOptions {
  minScale?: number;
  maxScale?: number;
}

export class Viewer {
  private readonly _minScale: number;
  private readonly _maxScale: number;

  private readonly _pageService: PageService;
  private readonly _container: HTMLDivElement;
  get container(): HTMLDivElement {
    return this._container;
  }

  private _mode: ViewerMode;  
  get mode(): ViewerMode {
    return this._mode;
  }
  set mode(value: ViewerMode) {
    // close an opened dialog if present
    if (this._dialogClose) {
      this._dialogClose();
    }

    if (!value || value === this._mode) {
      return;
    }

    this._mode = value;
  }

  private _scale = 1;
  get scale(): number {
    return this._scale;
  }

  /**information about the last pointer position */
  private _pointerInfo = {
    lastPos: <Vec2>null,
    downPos: <Vec2>null,
    downScroll: <Vec2>null, 
  };
  /**the object used for touch zoom handling */
  private _pinchInfo = {
    active: false,
    lastDist: 0,
    minDist: 10,
    sensitivity: 0.025,
    target: <HTMLElement>null,
  };

  private _dialogClose: () => void;

  constructor(pageService: PageService, container: HTMLDivElement, options?: ViewerOptions) {
    if (!container) {
      throw new Error("Container is not defined");
    }
    
    this._pageService = pageService;
    this._container = container;

    this._minScale = options?.minScale || 0.25;
    this._maxScale = options?.maxScale || 4;

    this.init();
  } 
  
  destroy() {  
    this._pageService.eventService.removeListener(pagesLoadedEvent, this.onPagesLoaded);
    this._pageService.eventService.removeListener(currentPageChangeRequestEvent, this.onScrollRequest);
    
    this._container.removeEventListener("scroll", this.onScroll);
    this._container.removeEventListener("wheel", this.onWheelZoom);
    this._container.removeEventListener("pointermove", this.onPointerMove);
    this._container.removeEventListener("pointerdown", this.onPointerDownScroll);    
    this._container.removeEventListener("touchstart", this.onTouchZoom);  
  }

  zoomOut() {
    this.zoomOutCentered();
  }

  zoomIn() {
    this.zoomInCentered();
  }
  
  zoomFitViewer() {
    const cWidth = this._container.getBoundingClientRect().width;
    const pWidth = this._pageService.getCurrentPage().viewContainer.getBoundingClientRect().width;
    const scale = clamp((cWidth  - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    this.setScale(scale);
    this.scrollToPage(this._pageService.currentPageIndex);
  }
  
  zoomFitPage() {
    const { width: cWidth, height: cHeight } = this._container.getBoundingClientRect();
    const { width: pWidth, height: pHeight } = this._pageService.getCurrentPage().viewContainer.getBoundingClientRect();
    const hScale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
    const vScale = clamp((cHeight - 20) / pHeight * this._scale, this._minScale, this._maxScale);
    this.setScale(Math.min(hScale, vScale));
    this.scrollToPage(this._pageService.currentPageIndex);
  }  
  
  async showTextDialogAsync(initialText: string): Promise<string> {
    if (this._dialogClose) {
      // can't open multiple dialogs at the same time
      return;
    }

    const dialog = htmlToElements(textDialogHtml)[0];
    dialog.style.top = this._container.scrollTop + "px";
    dialog.style.left = this._container.scrollLeft + "px";

    this._container.append(dialog);
    this._container.classList.add("dialog-shown");

    let value = initialText || "";      
    const input = dialog.querySelector(".text-input") as HTMLTextAreaElement;
    input.placeholder = "Enter text...";
    input.value = value;
    input.addEventListener("change", () => value = input.value);

    const textPromise = new Promise<string>((resolve, reject) => {

      const ok = () => {
        resolve(value || "");
      };
      const cancel = () => {
        resolve(null);
      };

      dialog.addEventListener("click", (e: Event) => {
        if (e.target === dialog) {
          cancel();
        }
      });      
      dialog.querySelector(".text-ok").addEventListener("click", ok);
      dialog.querySelector(".text-cancel").addEventListener("click", cancel);
      
      // save the dialog close callback to the viewer property
      this._dialogClose = () => resolve(null);
    });

    const result = await textPromise;

    this._dialogClose = null;
    dialog.remove();
    this._container.classList.remove("dialog-shown");
    
    return result;
  }

  private scrollToPage(pageNumber: number) { 
    if (!this._pageService.pages.length) {
      // no pages
      return;
    }

    const {top: cTop} = this._container.getBoundingClientRect();
    const {top: pTop} = this._pageService.getPage(pageNumber).viewContainer.getBoundingClientRect();

    const scroll = pTop - (cTop - this._container.scrollTop);
    this._container.scrollTo(this._container.scrollLeft, scroll);
  }

  private init() {
    this._container.addEventListener("scroll", this.onScroll);
    this._container.addEventListener("wheel", this.onWheelZoom, {passive: false});
    this._container.addEventListener("pointermove", this.onPointerMove);
    this._container.addEventListener("pointerdown", this.onPointerDownScroll);    
    this._container.addEventListener("touchstart", this.onTouchZoom);  

    this._pageService.eventService.addListener(pagesLoadedEvent, this.onPagesLoaded);
    this._pageService.eventService.addListener(currentPageChangeRequestEvent, this.onScrollRequest);
  }
  
  private renderVisible() {
    this._pageService.renderVisiblePages(this._container);
  }

  private onPagesLoaded = (event: PagesLoadedEvent) => {
    event.detail.pages?.forEach(x => {
      x.scale = this._scale;
      this._container.append(x.viewContainer);
    });
    this.renderVisible();
  };
  
  private onScrollRequest = (event: CurrentPageChangeRequestEvent) => {
    this.scrollToPage(event.detail.pageIndex);
  };

  private onPointerMove = (event: PointerEvent) => {
    const {clientX, clientY} = event;
    this._pointerInfo.lastPos = new Vec2(clientX, clientY);
  };

  private onScroll = (e: Event) => {
    this.renderVisible();
  };  

  private onPointerDownScroll = (e: PointerEvent) => { 
    if (this._mode !== "hand") {
      return;
    }
    
    const {clientX, clientY} = e;
    this._pointerInfo.downPos = new Vec2(clientX, clientY);
    this._pointerInfo.downScroll = new Vec2(this._container.scrollLeft,this._container.scrollTop);    

    const onPointerMove = (moveEvent: PointerEvent) => {
      const {x, y} = this._pointerInfo.downPos;
      const {x: left, y: top} = this._pointerInfo.downScroll;
      const dX = moveEvent.clientX - x;
      const dY = moveEvent.clientY - y;
      this._container.scrollTo(left - dX, top - dY);
    };
    
    const onPointerUp = (upEvent: PointerEvent) => {
      this._pointerInfo.downPos = null;
      this._pointerInfo.downScroll = null;

      const upTarget = upEvent.target as HTMLElement;
      upTarget.removeEventListener("pointermove", onPointerMove);
      upTarget.removeEventListener("pointerup", onPointerUp);
      upTarget.removeEventListener("pointerout", onPointerUp);
      upTarget.releasePointerCapture(upEvent.pointerId); 
    };

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointerout", onPointerUp);
  };

  //#region zoom(scale)
  private setScale(scale: number, cursorPosition: Vec2 = null) {
    if (!scale || scale === this._scale) {
      return;
    }

    let pageContainerUnderPivot: HTMLElement;
    let xPageRatio: number;
    let yPageRatio: number;

    if (cursorPosition) {
      for (const page of this._pageService.pages) {
        const {x: x, y: y} = cursorPosition;
        const {x: pX, y: pY, width: pWidth, height: pHeight} = page.viewContainer.getBoundingClientRect();
        // get page under cursor
        if (pX <= x 
          && pX + pWidth >= x
          && pY <= y
          && pY + pHeight >= y) {          
          // get cursor position relative to page dimensions before scaling
          pageContainerUnderPivot = page.viewContainer;
          xPageRatio = (x - pX) / pWidth;
          yPageRatio = (y - pY) / pHeight;    
          break;
        }
      }
    }

    this._scale = scale;
    this._pageService.scale = scale;
    
    if (pageContainerUnderPivot 
      && // check if page has scrollbars
      (this._container.scrollHeight > this._container.clientHeight
      || this._container.scrollWidth > this._container.clientWidth)) {

      // get the position of the point under cursor after scaling   
      const {x: initialX, y: initialY} = cursorPosition;
      const {x: pX, y: pY, width: pWidth, height: pHeight} = pageContainerUnderPivot.getBoundingClientRect();
      const resultX = pX + (pWidth * xPageRatio);
      const resultY = pY + (pHeight * yPageRatio);

      // scroll page to move the point to its initial position in the viewport
      let scrollLeft = this._container.scrollLeft + (resultX - initialX);
      let scrollTop = this._container.scrollTop + (resultY - initialY);
      scrollLeft = scrollLeft < 0 
        ? 0 
        : scrollLeft;
      scrollTop = scrollTop < 0
        ? 0
        : scrollTop;

      if (scrollTop !== this._container.scrollTop
        || scrollLeft !== this._container.scrollLeft) {          
        this._container.scrollTo(scrollLeft, scrollTop);
        // render will be called from the scroll event handler so no need to call it from here
        return;
      }
    }

    // use timeout to let browser update page layout
    setTimeout(() => this.renderVisible(), 0);
  }

  private zoom(diff: number, cursorPosition: Vec2 = null) {
    const scale = clamp(this._scale + diff, this._minScale, this._maxScale);
    this.setScale(scale, cursorPosition || this.getCenterPosition());
  }

  private zoomOutCentered(center: Vec2 = null) {
    this.zoom(-0.25, center);
  }
  
  private zoomInCentered(center: Vec2 = null) {
    this.zoom(0.25, center);
  }

  private getCenterPosition(): Vec2 {
    const {x, y, width, height} = this._container.getBoundingClientRect();
    return new Vec2(x + width / 2, y + height / 2);
  }
  
  private onWheelZoom = (event: WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    if (event.deltaY > 0) {
      this.zoomOutCentered(this._pointerInfo.lastPos);
    } else {
      this.zoomInCentered(this._pointerInfo.lastPos);
    }
  };  

  private onTouchZoom = (event: TouchEvent) => { 
    if (event.touches.length !== 2) {
      return;
    }    

    const a = event.touches[0];
    const b = event.touches[1];    
    this._pinchInfo.active = true;
    this._pinchInfo.lastDist = getDistance2D(a.clientX, a.clientY, b.clientX, b.clientY);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 2) {
        return;
      }

      const mA = moveEvent.touches[0];
      const mB = moveEvent.touches[1];    
      const dist = getDistance2D(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
      const delta = dist - this._pinchInfo.lastDist;
      const factor = Math.floor(delta / this._pinchInfo.minDist);  

      if (factor) {
        const center = new Vec2((mB.clientX + mA.clientX) / 2, (mB.clientY + mA.clientY) / 2);
        this._pinchInfo.lastDist = dist;
        this.zoom(factor * this._pinchInfo.sensitivity, center);
      }
    };
    
    const onTouchEnd = (endEvent: TouchEvent) => {
      this._pinchInfo.active = false;
      this._pinchInfo.lastDist = 0;

      (<HTMLElement>event.target).removeEventListener("touchmove", onTouchMove);
      (<HTMLElement>event.target).removeEventListener("touchend", onTouchEnd);
      (<HTMLElement>event.target).removeEventListener("touchcancel", onTouchEnd);
    };

    (<HTMLElement>event.target).addEventListener("touchmove", onTouchMove);
    (<HTMLElement>event.target).addEventListener("touchend", onTouchEnd);
    (<HTMLElement>event.target).addEventListener("touchcancel", onTouchEnd);
  };
  //#endregion
}
