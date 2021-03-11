import { flatePredictors, streamFilters, xRefTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { HexString } from "../strings/hex-string";
import { ObjectId } from "../core/object-id";
import { DecodeParamsDict } from "../encoding/decode-params-dict";
import { TrailerStream } from "./trailer-stream";
import { XRef } from "./x-ref";
import { XRefEntry } from "./x-ref-entry";

export class XRefStream extends XRef {
  private _trailerStream: TrailerStream;

  get prev(): number {
    return this._trailerStream?.Prev;
  }
  
  get size(): number {
    return this._trailerStream?.Size;
  }
  
  get root(): ObjectId {
    return this._trailerStream?.Root;
  }

  get info(): ObjectId {
    return this._trailerStream?.Root;
  }

  get encrypt(): ObjectId {
    return this._trailerStream?.Encrypt;
  }

  get id(): [HexString, HexString] {
    return this._trailerStream?.ID;
  }
  
  constructor(trailer: TrailerStream, offset: number) {
    super(xRefTypes.STREAM);
    this._trailerStream = trailer;
    this._offset = offset;
  }

  static createFrom(base: XRefStream, entries: XRefEntry[], offset: number) {
    if (!entries?.length || !base) {
      return null;
    }

    const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
    const size = Math.max(entriesSize, base.size);

    return XRefStream.create(entries, size, offset, base.root, 
      base.offset, base.info, base.encrypt, base.id);
  }

  static create(entries: XRefEntry[], size: number, offset: number, root: ObjectId, 
    prev?: number, info?: ObjectId, encrypt?: ObjectId, id?: [HexString, HexString]): XRefStream {

    if (!entries?.length || !size || !offset || !root) {
      return null;
    }

    const trailer = new TrailerStream();
    trailer.Size = size;
    trailer.Root = root;
    trailer.Prev = prev;
    trailer.Info = info;
    trailer.Encrypt = encrypt;
    trailer.ID = id;

    const w: [number, number, number] = [1, 4, 2];
    const wSum = w[0] + w[1] + w[2];

    const params = new DecodeParamsDict();
    params.setIntProp("/Predictor", flatePredictors.PNG_UP);
    params.setIntProp("/Columns", wSum);
    params.setIntProp("/Colors", 1);
    params.setIntProp("/BitsPerComponent", 8);
    
    const data = XRefEntry.toStreamBytes(entries, w);
    const stream = new XRefStream(trailer, offset);
    stream._trailerStream.Filter = streamFilters.FLATE;
    stream._trailerStream.DecodeParms = params;
    stream._trailerStream.W = w;
    stream._trailerStream.Index = data.index;
    stream._trailerStream.streamData = data.bytes;

    return stream;
  }
  
  static parse(parseInfo: ParseInfo, offset: number): ParseResult<XRefStream> {
    if (!parseInfo) {
      return null;
    }
    
    const trailerStream = TrailerStream.parse(parseInfo);   
    if (!trailerStream) {
      return null;
    }

    const xrefStream = new XRefStream(trailerStream.value, offset);
  
    return {
      value: xrefStream,
      start: null,
      end: null,
    };
  }

  createUpdate(entries: XRefEntry[], offset: number): XRefStream {
    return XRefStream.createFrom(this, entries, offset);
  }

  getEntries(): Iterable<XRefEntry> {   
    if (!this._trailerStream) {
      return [];
    }

    const entries = XRefEntry.fromStreamBytes(
      this._trailerStream.decodedStreamData, 
      this._trailerStream.W, 
      this._trailerStream.Index);
    return entries;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    return this._trailerStream.toArray(cryptInfo);
  }
}
