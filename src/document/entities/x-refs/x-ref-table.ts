import { xRefTypes } from "../../common/const";
import { DocumentParser, ParseResult } from "../../parser/document-parser";
import { ObjectId } from "../common/object-id";
import { TrailerDict } from "./trailer-dict";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefTable extends XRef {
  private _trailerDict: TrailerDict;
  private _table: Uint8Array;

  get prev(): number {
    return this._trailerDict?.Prev;
  }
  
  get size(): number {
    return this._trailerDict?.Size;
  }
  
  get root(): ObjectId {
    return this._trailerDict?.Root;
  }

  constructor(table: Uint8Array, trailer: TrailerDict) {
    super(xRefTypes.TABLE);

    this._table = table;
    this._trailerDict = trailer;
  }

  static parse(parser: DocumentParser, start: number): ParseResult<XRefTable> {
    if (!parser || isNaN(start)) {
      return null;
    }

    const xrefTableBounds = parser.getXrefTableBoundsAt(start);
    if (!xrefTableBounds) {
      return null;
    }

    const trailerDictBounds = parser.getDictBoundsAt(xrefTableBounds.end + 1);
    if (!trailerDictBounds) {
      return null;
    }
    
    const table = parser.sliceCharCodes(xrefTableBounds.contentStart, 
      xrefTableBounds.contentEnd);    

    const trailerDict = TrailerDict.parse({parser, bounds: trailerDictBounds});   
    if (!trailerDict) {
      return null;
    }

    const xrefTable = new XRefTable(table, trailerDict.value); 
  
    return {
      value: xrefTable,
      start: null,
      end: null,
    };
  }
  
  getEntries(): Iterable<XRefEntry> { 
    if (!this._table.length) {
      return [];
    }
    
    const entries = XRefEntry.parseFromTable(this._table);  
    return entries;
  }
}
