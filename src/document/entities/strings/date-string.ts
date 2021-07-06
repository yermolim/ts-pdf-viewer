import { codes, keywordCodes } from "../../encoding/char-codes";
import { CryptInfo, IEncodable } from "../../encryption/interfaces";
import { DataParser, ParserResult } from "../../data-parse/data-parser";

/**
 * Immutablse class representing PDF date
 */
export class DateString implements IEncodable {
  private readonly _source: string;
  get source(): string {
    return this._source;
  }
  
  private readonly _date: Date;
  get date(): Date {
    return new Date(this._date);
  }

  private constructor(source: string, date: Date) {
    this._source = source;
    this._date = new Date(date);
  }
    
  static async parseAsync(parser: DataParser, start: number, cryptInfo: CryptInfo = null, 
    skipEmpty = true): Promise<ParserResult<DateString>> {       
    if (skipEmpty) {
      start = await parser.skipEmptyAsync(start);
    }
    if (parser.isOutside(start) || !(await parser.isCodeAtAsync(start, codes.L_PARENTHESE))) {
      return null;
    }

    const end = await parser.findCharIndexAsync(codes.R_PARENTHESE, true, start);
    if (end === -1) {
      return null;
    }

    let bytes = await parser.sliceCharCodesAsync(start + 1, end - 1);
    if (cryptInfo?.ref && cryptInfo.stringCryptor) {
      bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
    }

    try {
      const date = DateString.fromArray(bytes);
      return {value: date, start, end};      
    } catch {
      return null;
    }
  }

  static fromDate(date: Date): DateString {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const source = `D:${year}${month}${day}${hours}${minutes}${seconds}`;
    return new DateString(source, date);
  }

  static fromString(source: string): DateString {
    const result = /D:(?<Y>\d{4})(?<M>\d{2})(?<D>\d{2})(?<h>\d{2})(?<m>\d{2})(?<s>\d{2})/.exec(source);
    const date = new Date(
      +result.groups.Y,
      +result.groups.M - 1,
      +result.groups.D,
      +result.groups.h,
      +result.groups.m,
      +result.groups.s,
    );
    return new DateString(source, date);
  }
  
  /**
   * create DateString from a byte array
   * @param arr 
   * @returns 
   */
  static fromArray(arr: Uint8Array): DateString {
    const source = new TextDecoder().decode(arr);
    return DateString.fromString(source);
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array { 
    let bytes = new TextEncoder().encode(this._source);
    if (cryptInfo?.ref && cryptInfo.stringCryptor) {
      bytes = cryptInfo.stringCryptor.encrypt(bytes, cryptInfo.ref);
    }
    return new Uint8Array([
      ...keywordCodes.STR_LITERAL_START,         
      ...bytes, 
      ...keywordCodes.STR_LITERAL_END,
    ]);
  }
}
