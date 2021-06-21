import { ObjectType, objectTypes, streamTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserBounds, DataParser, ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { HexString } from "../strings/hex-string";
import { LiteralString } from "../strings/literal-string";
import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";

export class ObjectStream extends PdfStream {
  /**
   * (Required) The number of indirect objects stored in the stream
   */
  N: number;
  /**
   * (Required) The byte offset in the decoded stream of the first compressed object
   */
  First: number;
  /**
   * (Optional) A reference to another object stream, 
   * of which the current object stream shall be considered an extension
   */
  Extends: ObjectId;

  constructor() {
    super(streamTypes.OBJECT_STREAM);
  }  
  
  static parse(parseInfo: ParserInfo): ParserResult<ObjectStream> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new ObjectStream();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  getObjectData(id: number): ParserInfo  { 
    if (!this._streamData || !this.N || !this.First) {
      return null;
    }

    const parser = new DataParser(this.decodedStreamData);

    const offsetMap = new Map<number, number>();
    let temp: ParserResult<number>;
    let objectId: number;
    let byteOffset: number;
    let position = 0;
    for (let n = 0; n < this.N; n++) {
      temp = parser.parseNumberAt(position, false, false);
      objectId = temp.value;
      position = temp.end + 2;    

      temp = parser.parseNumberAt(position, false, false);
      byteOffset = temp.value;
      position = temp.end + 2; 
      
      offsetMap.set(objectId, byteOffset);
    }

    if (!offsetMap.has(id)) {
      return null;
    }

    const objectStart = this.First + offsetMap.get(id);

    const objectType = parser.getValueTypeAt(objectStart);
    if (objectType === null) {
      return;
    }

    let bounds: ParserBounds;
    let value: any;
    switch (objectType) {
      case objectTypes.DICTIONARY:
        bounds = parser.getDictBoundsAt(objectStart, false);
        break;
      case objectTypes.ARRAY:
        bounds = parser.getArrayBoundsAt(objectStart, false);
        break;
      case objectTypes.STRING_LITERAL: 
        const literalValue = LiteralString.parse(parser, objectStart);
        if (literalValue) {
          bounds = {start: literalValue.start, end: literalValue.end};
          value = literalValue;
        }
        break; 
      case objectTypes.STRING_HEX: 
        const hexValue = HexString.parse(parser, objectStart);
        if (hexValue) {
          bounds = {start: hexValue.start, end: hexValue.end};
          value = hexValue;
        }
        break; 
      case objectTypes.NUMBER:
        const numValue = parser.parseNumberAt(objectStart);
        if (numValue) {
          bounds = {start: numValue.start, end: numValue.end};
          value = numValue;
        }
        break; 
      default:
        // TODO: handle remaining cases
        break;
    }
    
    if (!bounds) {
      return null;
    }    

    const bytes = parser.sliceCharCodes(bounds.start, bounds.end);
    if (!bytes.length) {
      // execution should not get here
      throw new Error("Object byte array is empty");
    }

    return {
      parser: new DataParser(bytes),
      bounds: {
        start: 0, 
        end: bytes.length - 1,
        contentStart: bounds.contentStart 
          ? bounds.contentStart - bounds.start 
          : undefined,
        contentEnd: bounds.contentEnd 
          ? bytes.length - 1 - (bounds.end - bounds.contentEnd) 
          : undefined,
      },
      type: <ObjectType>objectType,
      value,
      cryptInfo: {ref: {id, generation: 0}},
      streamId: this.id,
    };
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.N) {
      bytes.push(...encoder.encode("/N "), ...encoder.encode(" " + this.N));
    }
    if (this.First) {
      bytes.push(...encoder.encode("/First "), ...encoder.encode(" " + this.First));
    }
    if (this.Extends) {
      bytes.push(...encoder.encode("/Extends "), ...this.Extends.toArray(cryptInfo));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParserInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/N":
          case "/First":
            i = this.parseNumberProp(name, parser, i, false);
            break;

          case "/Extends":
            i = this.parseRefProp(name, parser, i);
            break;

          default:
            // skip to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };
  }
}
