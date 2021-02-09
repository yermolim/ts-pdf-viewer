import { keywordCodes } from "../common/codes";
import { annotationTypes, dictTypes, objectTypes, XRefType, xRefTypes } from "../common/const";
import { AnnotationDict } from "../entities/annotations/annotation-dict";
import { FreeTextAnnotation } from "../entities/annotations/markup/free-text-annotation";
import { InkAnnotation } from "../entities/annotations/markup/ink-annotation";
import { StampAnnotation } from "../entities/annotations/markup/stamp-annotation";
import { TextAnnotation } from "../entities/annotations/markup/text-annotation";
import { ObjectId } from "../entities/common/object-id";
import { ObjectStream } from "../entities/streams/object-stream";
import { XFormStream } from "../entities/streams/x-form-stream";
import { CatalogDict } from "../entities/structure/catalog-dict";
import { PageDict } from "../entities/structure/page-dict";
import { PageTreeDict } from "../entities/structure/page-tree-dict";
import { XRef } from "../entities/x-refs/x-ref";
import { XRefEntry } from "../entities/x-refs/x-ref-entry";
import { XRefStream } from "../entities/x-refs/x-ref-stream";
import { XRefTable } from "../entities/x-refs/x-ref-table";
import { DataParser, ParseInfo, ParseResult } from "./data-parser";
import { ReferenceData } from "./reference-data";

export class DocumentData {
  private readonly _docParser: DataParser;
  private readonly _version: string;  

  private readonly _lastXrefIndex: number;
  private _lastXrefType: XRefType;
  private _xrefs: XRef[];
  private _referenceData: ReferenceData;

  private _catalog: CatalogDict;
  private _pageRoot: PageTreeDict;
  private _pages: PageDict[];

  private _annotations: AnnotationDict[];

  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].prev;
    } else {
      return 0;
    }
  }

  constructor(data: Uint8Array) {
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    this._lastXrefIndex = lastXrefIndex.value;
  }  

  parse() {
    this.reset();

    const xrefs = this.parseAllXrefs();
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}

    this._xrefs = xrefs;
    this._referenceData = new ReferenceData(xrefs);
    
    console.log(this._xrefs);    
    console.log(this._referenceData);   

    this.parsePageTree();
 
    console.log(this._catalog);    
    console.log(this._pageRoot); 
    console.log(this._pages);  

    this.parseSupportedAnnotations();

    console.log(this._annotations);

    for (const annot of this._annotations) {
      if (annot.AP?.N && annot.AP.N instanceof ObjectId) {
        const apInfo = this.getObjectParseInfo(annot.AP.N.id);
        const apStream = XFormStream.parse(apInfo);
        if (apStream) {
          console.log(String.fromCharCode(...apStream.value.decodedStreamData));
        }
      }
    }
  }

  reset() {    
    this._xrefs = null;
    this._referenceData = null;
  }
  
  private parseAllXrefs(): XRef[] {
    this.reset();
    
    const xrefs: XRef[] = [];
    let start = this._lastXrefIndex; 
    let max = this._docParser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = this.parsePrevXref(start, max);
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

  private parsePrevXref(start: number, max: number): XRef {
    if (!start) {
      return null;
    }
    
    const xrefTableIndex = this._docParser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = this._docParser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {    
        if (isNaN(this._lastXrefType)) {
          this._lastXrefType = xRefTypes.HYBRID;
        }
        const streamXrefIndex = this._docParser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        if (isNaN(this._lastXrefType)) {
          this._lastXrefType = xRefTypes.TABLE;
        }
        const xrefTable = XRefTable.parse(this._docParser, start);
        return xrefTable?.value;
      }
    } else {
      if (isNaN(this._lastXrefType)) {
        this._lastXrefType = xRefTypes.STREAM;
      }
    }

    const id = ObjectId.parse(this._docParser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = this._docParser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: this._docParser, bounds: xrefStreamBounds});
    return xrefStream?.value; 
  }

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
    this._pageRoot = pageRootTree.value;    

    const pages: PageDict[] = [];
    this.parsePages(pages, pageRootTree.value);
    this._pages = pages;
  }

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

  private parseSupportedAnnotations() {
    const annotationIds: ObjectId[] = [];

    for (const page of this._pages) {
      if (!page.Annots) {
        break;
      }
      if (Array.isArray(page.Annots)) {
        annotationIds.push(...page.Annots);
      } else {
        const parseInfo = this.getObjectParseInfo(page.Annots.id);
        if (parseInfo) {
          const annotationRefs = ObjectId.parseRefArray(parseInfo.parser, 
            parseInfo.bounds.contentStart);
          if (annotationRefs?.value?.length) {
            annotationIds.push(...annotationRefs.value);
          }
        }        
      }
    }

    const annotations: AnnotationDict[] = [];
    for (const objectId of annotationIds) {
      const info = this.getObjectParseInfo(objectId.id);
      const annotationType = info.parser.parseDictSubtype(info.bounds);
      let annot: ParseResult<AnnotationDict>;
      switch (annotationType) {
        case annotationTypes.INK:
          annot = InkAnnotation.parse(info);
          if (annot) {
            annotations.push(annot.value);
          }
          break;
        case annotationTypes.FREE_TEXT:
          annot = FreeTextAnnotation.parse(info);
          if (annot) {
            annotations.push(annot.value);
          }
          break;
        case annotationTypes.STAMP:
          annot = StampAnnotation.parse(info);
          if (annot) {
            annotations.push(annot.value);
          }
          break;
        case annotationTypes.TEXT:
          annot = TextAnnotation.parse(info);
          if (annot) {
            annotations.push(annot.value);
          }
          break;
        default:
          break;
      }
    }

    this._annotations = annotations;
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
    const info = {parser: this._docParser, bounds, parseInfoGetter, objectId: objectId.value.id};

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
}
