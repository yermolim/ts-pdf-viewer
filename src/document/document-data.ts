import { keywordCodes } from "./codes";
import { annotationTypes, dictTypes } from "./const";
import { AuthenticationResult } from "./common-interfaces";

import { DataCryptHandler } from "./encryption/data-crypt-handler";
import { DataParser, ParseInfo, ParseResult } from "./data-parser";
import { ReferenceData } from "./reference-data";
import { DocumentDataUpdater, PageWithAnnotations } from "./document-data-updater";

import { XRef } from "./entities/x-refs/x-ref";
import { XRefStream } from "./entities/x-refs/x-ref-stream";
import { XRefTable } from "./entities/x-refs/x-ref-table";

import { CatalogDict } from "./entities/structure/catalog-dict";
import { PageDict } from "./entities/structure/page-dict";
import { PageTreeDict } from "./entities/structure/page-tree-dict";

import { ObjectId } from "./entities/core/object-id";
import { EncryptionDict } from "./entities/encryption/encryption-dict";
import { ObjectStream } from "./entities/streams/object-stream";

import { AnnotationDto, InkAnnotationDto, StampAnnotationDto } from "../annotator/serialization";

import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { StampAnnotation } from "./entities/annotations/markup/stamp-annotation";
import { InkAnnotation } from "./entities/annotations/markup/ink-annotation";
import { FreeTextAnnotation } from "./entities/annotations/markup/free-text-annotation";
import { CircleAnnotation } from "./entities/annotations/markup/geometric/circle-annotation";
import { LineAnnotation } from "./entities/annotations/markup/geometric/line-annotation";
import { SquareAnnotation } from "./entities/annotations/markup/geometric/square-annotation";
import { TextAnnotation } from "./entities/annotations/markup/text-annotation";
import { PolygonAnnotation } from "./entities/annotations/markup/geometric/polygon-annotation";
import { PolylineAnnotation } from "./entities/annotations/markup/geometric/polyline-annotation";

//#region custom events
export const annotChangeEvent = "tspdf-annotchange" as const;
export interface AnnotEventDetail {
  type: "select" | "add" | "edit" | "delete";
  annotations: AnnotationDto[];
}
export class AnnotEvent extends CustomEvent<AnnotEventDetail> {
  constructor(detail: AnnotEventDetail) {
    super(annotChangeEvent, {detail});
  }
}
declare global {
  interface DocumentEventMap {
    [annotChangeEvent]: AnnotEvent;
  }
}
//#endregion

export class DocumentData {
  private readonly _userName: string; 
  get userName(): string {
    return this._userName;
  }

  private readonly _data: Uint8Array; 
  private readonly _docParser: DataParser;
  private readonly _version: string; 

  private readonly _xrefs: XRef[];
  private readonly _referenceData: ReferenceData;

  private _encryption: EncryptionDict;  
  private _authResult: AuthenticationResult;

  private _catalog: CatalogDict;
  private _pages: PageDict[];
  private _pageById = new Map<number, PageDict>();
  
  private _annotIdsByPageId = new Map<number, ObjectId[]>();
  private _supportedAnnotsByPageId: Map<number, AnnotationDict[]>;
  private _selectedAnnotation: AnnotationDict;
  get selectedAnnotation(): AnnotationDict {
    return this._selectedAnnotation;
  }

  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].size;
    } else {
      return 0;
    }
  }
  
  get encrypted(): boolean {
    return !!this._encryption;
  }

  get authenticated(): boolean {
    return !this._encryption || !!this._authResult;
  }

  constructor(data: Uint8Array, userName: string) {
    this._data = data;
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    const xrefs = DocumentData.parseAllXrefs(this._docParser, lastXrefIndex.value);
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}

    this._xrefs = xrefs;
    this._referenceData = new ReferenceData(xrefs);
    // DEBUG
    // console.log(this._xrefs);    
    // console.log(this._referenceData);   

    this.parseEncryption();
    // DEBUG
    // console.log(this._encryption);

    this._userName = userName;
  }

  //#region parsing xrefs
  private static parseXref(parser: DataParser, start: number, max: number): XRef {
    if (!parser || !start) {
      return null;
    }

    const offset = start;
    
    const xrefTableIndex = parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {
        // HYBRID
        const streamXrefIndex = parser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        // TABLE
        const xrefTable = XRefTable.parse(parser, start, offset);
        return xrefTable?.value;
      }
    }
    // STREAM
    const id = ObjectId.parse(parser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: parser, bounds: xrefStreamBounds}, offset);
    return xrefStream?.value; 
  }  
  
  private static parseAllXrefs(parser: DataParser, start: number): XRef[] {    
    const xrefs: XRef[] = [];
    let max = parser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = DocumentData.parseXref(parser, start, max);
      if (xref) {
        xrefs.push(xref);        
        max = start;
        start = xref.prev;
      } else {
        break;
      }
    }
    return xrefs;
  }
  //#endregion
    
  destroy() {
    // clear onEditedAction to prevent memory leak
    this.getAllSupportedAnnotations().forEach(x => x.$onEditedAction = null);
  }

  tryAuthenticate(password = ""): boolean {
    if (!this.authenticated) {
      return this.authenticate(password);
    }
    return true;
  }

  getPlainData(): Uint8Array {
    return this._data.slice();
  }

  //#region public annotations
  getDataWithoutSupportedAnnotations(): Uint8Array {
    const annotationMap = this.getSupportedAnnotationMap();
    const annotationMarkedToDelete: AnnotationDict[] = [];
    if (annotationMap?.size) {
      annotationMap.forEach((v, k) => {
        const annotations = v.slice();
        // mark all parsed annotations as deleted
        annotations.forEach(x => {
          if (!x.deleted) {
            x.markAsDeleted(true);
            annotationMarkedToDelete.push(x);
          }
        });
      });
    }

    const refined = this.getDataWithUpdatedAnnotations();

    // remove redundant "isDeleted" flags
    annotationMarkedToDelete.forEach(x => x.markAsDeleted(false));

    return refined;
  }

  getDataWithUpdatedAnnotations(): Uint8Array {    
    const annotationMap = this.getSupportedAnnotationMap();
    const updaterData: PageWithAnnotations[] = [];
    annotationMap.forEach((pageAnnotations, pageId) => {
      const page = this._pageById.get(pageId);
      if (!page) {
        throw new Error(`Page with id '${pageId}' not found`);
      }
      const allAnnotationIds = this._annotIdsByPageId.get(pageId).slice() || [];
      updaterData.push({
        page,
        allAnnotationIds,
        supportedAnnotations: pageAnnotations || [],
      });
    });

    const updater = new DocumentDataUpdater(this._data, this._xrefs[0],
      this._referenceData, this._authResult);
    const updatedBytes = updater.getDataWithUpdatedAnnotations(updaterData);
    return updatedBytes;
  }  

  getPageAnnotations(pageId: number): AnnotationDict[] {     
    const annotations = this.getSupportedAnnotationMap().get(pageId);
    return annotations || [];
  }

  appendAnnotationToPage(pageId: number, annotation: AnnotationDict) {
    if (isNaN(pageId) || !annotation) {
      throw new Error("Undefined argument exception");
    }

    annotation.$pageId = pageId;
    annotation.$onEditedAction = this.getOnAnnotationEditAction(annotation);
    const pageAnnotations = this.getSupportedAnnotationMap().get(pageId);
    if (pageAnnotations) {
      pageAnnotations.push(annotation);
    } else {
      this.getSupportedAnnotationMap().set(pageId, [annotation]);
    }

    document.dispatchEvent(new AnnotEvent({   
      type: "add",   
      annotations: [annotation.toDto()],
    }));
  }

  removeAnnotation(annotation: AnnotationDict) {
    if (!annotation) {
      return;
    }

    annotation.markAsDeleted(true);
    this.setSelectedAnnotation(null);
    
    document.dispatchEvent(new AnnotEvent({  
      type: "delete",
      annotations: [annotation.toDto()],
    }));
  }
  
  setSelectedAnnotation(annotation: AnnotationDict): AnnotationDict {
    if (annotation === this._selectedAnnotation) {
      return;
    }

    if (this._selectedAnnotation) {
      this._selectedAnnotation.$translationEnabled = false;
      const oldSelectedSvg = this._selectedAnnotation?.lastRenderResult?.svg;
      oldSelectedSvg?.classList.remove("selected");
    }

    const newSelectedSvg = annotation?.lastRenderResult.svg;
    if (!newSelectedSvg) {
      this._selectedAnnotation = null;
    } else {
      annotation.$translationEnabled = true;    
      newSelectedSvg.classList.add("selected");
      this._selectedAnnotation = annotation;
    }

    // dispatch corresponding event
    document.dispatchEvent(new AnnotEvent({      
      type: "select",
      annotations: this._selectedAnnotation
        ? [this._selectedAnnotation.toDto()]
        : [],
    }));

    return this._selectedAnnotation;
  }

  appendSerializedAnnotations(dtos: AnnotationDto[]) {
    let annotation: AnnotationDict;
    for (const dto of dtos) {
      switch (dto.annotationType) {
        case "/Stamp":
          annotation = StampAnnotation.createFromDto(dto as StampAnnotationDto);
          break;
        case "/Ink":
          annotation = InkAnnotation.createFromDto(dto as InkAnnotationDto);
          break;
        default:
          throw new Error(`Unsupported annotation type: ${dto.annotationType}`);
      }
      this.appendAnnotationToPage(dto.pageId, annotation);
    }
  }

  serializeAnnotations(addedOnly = false): AnnotationDto[] {
    const result: AnnotationDto[] = [];
    this.getSupportedAnnotationMap().forEach((v, k) => {
      v.forEach(x => {
        if (!addedOnly || x.added) {
          result.push(x.toDto());
        }
      });
    });
    return result;
  }
  //#endregion

  private getOnAnnotationEditAction(annotation: AnnotationDict): () => void {
    if (!annotation) {
      return null;
    }

    return () => document.dispatchEvent(new AnnotEvent({
      type: "edit",
      annotations: [annotation.toDto()],
    }));
  }
  
  /**
   * returns a proper parser instance and byte bounds for the object by its id.
   * returns null if an object with the specified id not found.
   * @param id 
   */
  private getObjectParseInfo = (id: number): ParseInfo => {
    if (!id) {
      return null;
    }
    const offset = this._referenceData?.getOffset(id);
    if (isNaN(offset)) {
      return null;
    } 
    
    const objectId = ObjectId.parse(this._docParser, offset);
    if (!objectId) {
      return null;
    }   

    const bounds = this._docParser.getIndirectObjectBoundsAt(objectId.end + 1, true);
    if (!bounds) {
      return null;
    }
    const parseInfoGetter = this.getObjectParseInfo;
    const info: ParseInfo = {
      parser: this._docParser, 
      bounds, 
      parseInfoGetter, 
      cryptInfo: {
        ref: {id: objectId.value.id, generation: objectId.value.generation},
        stringCryptor: this._authResult?.stringCryptor,
        streamCryptor: this._authResult?.streamCryptor,
      },
    };

    if (objectId.value.id === id) {
      // object id equals the sought one, so this is the needed object
      return info;
    } 

    // object id at the given offset is not equal to the sought one
    // check if the object is an object stream and try to find the needed object inside it
    const stream = ObjectStream.parse(info);
    if (!stream) {
      return;
    }
    const objectParseInfo = stream.value.getObjectData(id);
    if (objectParseInfo) {
      // the object is found inside the stream
      objectParseInfo.parseInfoGetter = parseInfoGetter;
      return objectParseInfo;
    }

    return null;
  };
  
  //#region authentication and encryption
  private authenticate(password: string): boolean {
    if (this.authenticated) {
      return true;
    }

    const cryptOptions = this._encryption.toCryptOptions();
    const fileId = this._xrefs[0].id[0].hex;
    const cryptorSource = new DataCryptHandler(cryptOptions, fileId);
    this._authResult = cryptorSource.authenticate(password);
    return this.authenticated;
  }

  private checkAuthentication() {    
    if (!this.authenticated) {      
      throw new Error("Unauthorized access to file data");
    }
  }

  private parseEncryption() {    
    const encryptionId = this._xrefs[0].encrypt;
    if (!encryptionId) {
      return;
    }

    const encryptionParseInfo = this.getObjectParseInfo(encryptionId.id);
    const encryption = EncryptionDict.parse(encryptionParseInfo);
    if (!encryption) {
      throw new Error("Encryption dict can't be parsed");
    }
    this._encryption = encryption.value;
  }
  //#endregion

  //#region parsing annotations
  private parsePages(output: PageDict[], tree: PageTreeDict) {
    if (!tree.Kids.length) {
      return;
    }

    for (const kid of tree.Kids) {
      const parseInfo = this.getObjectParseInfo(kid.id);
      if (!parseInfo) {
        continue;
      }

      const type = parseInfo.parser.parseDictType(parseInfo.bounds);
      if (type === dictTypes.PAGE_TREE) {          
        const kidTree = PageTreeDict.parse(parseInfo);
        if (kidTree) {
          this.parsePages(output, kidTree.value);
        }
      } else if (type === dictTypes.PAGE) {        
        const kidPage = PageDict.parse(parseInfo);
        if (kidPage) {
          output.push(kidPage.value);
        }
      }
    }
  }; 

  private parsePageTree() {  
    const catalogId = this._xrefs[0].root;
    const catalogParseInfo = this.getObjectParseInfo(catalogId.id);
    const catalog = CatalogDict.parse(catalogParseInfo);
    if (!catalog) {
      throw new Error("Document root catalog not found");
    }
    this._catalog = catalog.value;

    const pageRootId = catalog.value.Pages;
    const pageRootParseInfo = this.getObjectParseInfo(pageRootId.id);
    const pageRootTree = PageTreeDict.parse(pageRootParseInfo);
    if (!pageRootTree) {
      throw new Error("Document root page tree not found");
    }

    const pages: PageDict[] = [];
    this.parsePages(pages, pageRootTree.value);
    this._pages = pages;

    this._pageById.clear();
    pages.forEach(x => this._pageById.set(x.ref.id, x));
  }   

  private parseSupportedAnnotations(): Map<number, AnnotationDict[]> {
    this.checkAuthentication();

    if (!this._catalog) {      
      this.parsePageTree(); 
      // DEBUG
      // console.log(this._catalog);
      // console.log(this._pages);
    }

    const annotIdsByPageId = new Map<number, ObjectId[]>();
    const annotationMap = new Map<number, AnnotationDict[]>();
    
    for (const page of this._pages) {      
      const annotationIds: ObjectId[] = [];
      if (Array.isArray(page.Annots)) {
        annotationIds.push(...page.Annots);
      } else if (page.Annots instanceof ObjectId) {
        const parseInfo = this.getObjectParseInfo(page.Annots.id);
        if (parseInfo) {
          const annotationRefs = ObjectId.parseRefArray(parseInfo.parser, 
            parseInfo.bounds.contentStart);
          if (annotationRefs?.value?.length) {
            annotationIds.push(...annotationRefs.value);
          }
        }        
      }
      annotIdsByPageId.set(page.ref.id, annotationIds);

      const annotations: AnnotationDict[] = [];
      for (const objectId of annotationIds) {
        const info = this.getObjectParseInfo(objectId.id);  
        info.rect = page.MediaBox;
        const annotationType = info.parser.parseDictSubtype(info.bounds);
        let annot: ParseResult<AnnotationDict>;
        switch (annotationType) {
          case annotationTypes.STAMP:
            annot = StampAnnotation.parse(info);
            break;
          case annotationTypes.INK:
            annot = InkAnnotation.parse(info);
            break;
          // case annotationTypes.TEXT:
          //   annot = TextAnnotation.parse(info);
          //   break;
          // case annotationTypes.FREE_TEXT:
          //   annot = FreeTextAnnotation.parse(info);
          //   break;
          // case annotationTypes.CIRCLE:
          //   annot = CircleAnnotation.parse(info);
          //   break;
          // case annotationTypes.SQUARE:
          //   annot = SquareAnnotation.parse(info);
          //   break;
          // case annotationTypes.POLYGON:
          //   annot = PolygonAnnotation.parse(info);
          //   break;
          // case annotationTypes.POLYLINE:
          //   annot = PolylineAnnotation.parse(info);
          //   break;
          // case annotationTypes.LINE:
          //   annot = LineAnnotation.parse(info);
          //   break;
          default:
            break;
        }
        if (annot) {
          annotations.push(annot.value);
          annot.value.$pageId = page.id;
          annot.value.$onEditedAction = this.getOnAnnotationEditAction(annot.value);

          // DEBUG
          console.log(annot.value);
        }
      }
      
      annotationMap.set(page.id, annotations);
    }

    this._annotIdsByPageId = annotIdsByPageId;
    this._supportedAnnotsByPageId = annotationMap;

    return this._supportedAnnotsByPageId;
  }   
  
  private getSupportedAnnotationMap(): Map<number, AnnotationDict[]> {
    this.checkAuthentication();

    if (this._supportedAnnotsByPageId) {
      return this._supportedAnnotsByPageId;
    } 
    this._supportedAnnotsByPageId = this.parseSupportedAnnotations();
    return this._supportedAnnotsByPageId;
  } 

  private getAllSupportedAnnotations(): AnnotationDict[] {
    const result: AnnotationDict[] = [];
    this.getSupportedAnnotationMap().forEach((v, k) => {
      result.push(...v);
    });
    return result;
  }
  //#endregion
}
