/* eslint-disable no-bitwise */
import { hexStringToBytes } from "../../byte-functions";
import { keywordCodes } from "../../codes";
import { CryptInfo, IEncodable } from "../../common-interfaces";
import { DataParser, ParseResult } from "../../data-parser";

/**
 * Immutable class representing PDF byte string
 */
export class HexString implements IEncodable {
  private readonly _literal: string;
  get literal(): string {
    return this._literal;
  }
  
  private readonly _hex: Uint8Array;
  get hex(): Uint8Array {
    return this._hex.slice();
  }

  private readonly _bytes: Uint8Array;
  get bytes(): Uint8Array {
    return this._bytes.slice();
  }

  private constructor(literal: string, hex: Uint8Array, bytes: Uint8Array) {
    this._literal = literal;
    this._hex = hex;
    this._bytes = bytes;
  }
    
  static parse(parser: DataParser, start: number, cryptInfo: CryptInfo = null, 
    skipEmpty = true): ParseResult<HexString>  {   

    const bounds = parser.getHexBounds(start, skipEmpty);
    if (!bounds) {
      return null;
    }
    
    let bytes = parser.sliceCharCodes(bounds.start + 1, bounds.end - 1);
    if (cryptInfo?.ref && cryptInfo.stringCryptor) {
      bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
    }

    const hex = HexString.fromBytes(bytes);
    return {value: hex, start: bounds.start, end: bounds.end};
  }  
  
  static parseArray(parser: DataParser, start: number, cryptInfo: CryptInfo = null, 
    skipEmpty = true): ParseResult<HexString[]>  {
    const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const hexes: HexString[] = [];
    let current: ParseResult<HexString>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = HexString.parse(parser, i, cryptInfo, skipEmpty);
      if (!current) {
        break;
      }
      hexes.push(current.value);
      i = current.end + 1;
    }

    return {value: hexes, start: arrayBounds.start, end: arrayBounds.end};
  }

  static fromBytes(bytes: Uint8Array): HexString {  
    const literal = new TextDecoder().decode(bytes);  
    const hex = hexStringToBytes(literal);
    return new HexString(literal, hex, bytes);
  }

  static fromHexBytes(hex: Uint8Array): HexString {
    let literal = "";
    hex.forEach(x => literal += x.toString(16).padStart(2, "0"));
    const bytes = new TextEncoder().encode(literal);
    return new HexString(literal, hex, bytes);
  }

  static fromLiteralString(literal: string): HexString {
    const hex = hexStringToBytes(literal);
    const bytes = new TextEncoder().encode(literal);
    return new HexString(literal, hex, bytes);
  };
 
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    return new Uint8Array([
      ...keywordCodes.STR_HEX_START, 
      ...this._bytes, 
      ...keywordCodes.STR_HEX_END,
    ]);
  }
}
