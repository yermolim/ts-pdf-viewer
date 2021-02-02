import { codes, keywordCodes, 
  DELIMITER_CHARS, SPACE_CHARS, DIGIT_CHARS, 
  isRegularChar } from "./common/codes";
import { ValueType, valueTypes } from "./common/const";
import { DateString } from "./common/date-string";
import { HexString } from "./common/hex-string";
import { LiteralString } from "./common/literal-string";

export type SearchDirection = "straight" | "reverse";

export interface SearchOptions {
  direction?: SearchDirection; 
  minIndex?: number;
  maxIndex?: number;
  closedOnly?: boolean;
}

export interface ParseResult<T> {
  value: T; 
  start: number;
  end: number;
}

export class Parser {
  private _data: Uint8Array;
  
  private _maxIndex: number;
  public get maxIndex(): number {
    return this._maxIndex;
  }

  constructor(data: Uint8Array) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = data;
    this._maxIndex = data.length - 1;
  }

  getPdfVersion(): string {
    const i = this.findSubarrayIndex(keywordCodes.VERSION);
    if (!i) {
      throw new Error("PDF not valid. Version not found");
    }
    const version = this.parseNumberAt(i.end + 1, true)?.value;
    if (!version) {
      throw new Error("Error parsing version number");
    }

    return version.toFixed(1);
  }

  //#region search methods
  /**
   * find the indices of the first occurence of the subarray in the data
   * @param sub sought subarray
   * @param direction search direction
   * @param start starting index
   * @param closedOnly define if subarray must be followed by a delimiter in the search direction
   */
  findSubarrayIndex(sub: number[] | readonly number[], 
    options?: SearchOptions): {start: number; end: number} { 

    const arr = this._data;
    if (!sub?.length) {
      return null;
    }

    const direction = options?.direction || "straight";
    const minIndex = Math.max(Math.min(options?.minIndex ?? 0, this._maxIndex), 0);
    const maxIndex = Math.max(Math.min(options?.maxIndex ?? this._maxIndex, this._maxIndex), 0);
    const allowOpened = !options?.closedOnly;

    let i = direction === "straight"
      ? minIndex
      : maxIndex; 

    let j: number; 
    if (direction === "straight") { 
      outer_loop:
      for (i; i <= maxIndex; i++) {
        for (j = 0; j < sub.length; j++) {
          if (arr[i + j] !== sub[j]) {
            continue outer_loop;
          }
        }
        if (allowOpened || !isRegularChar(arr[i + j])) {
          return {start: i, end: i + j - 1};
        }
      }
    } else {
      const subMaxIndex = sub.length - 1;
      outer_loop:
      for (i; i >= minIndex; i--) {
        for (j = 0; j < sub.length; j++) {
          if (arr[i - j] !== sub[subMaxIndex - j]) {
            continue outer_loop;
          }
        }
        if (allowOpened || !isRegularChar(arr[i - j])) {
          return {start: i - j + 1, end: i};
        }
      }
    }

    return null;
  }
  
  /**
   * find the nearest specified char index
   * @param charCode sought char code
   * @param direction search direction
   * @param start starting index
   */
  findCharIndex(charCode: number, direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => charCode === value,
      direction, start);  
  }
  
  /**
   * find the nearest char index after EOL
   * @param direction search direction
   * @param start starting index
   */
  findNewLineIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {

    let lineBreakIndex = this.findSingleCharIndex(
      (value) => value === codes.CARRIAGE_RETURN || value === codes.LINE_FEED,
      direction, start); 
      
    if (lineBreakIndex === -1) {
      return -1;
    }

    if (this._data[lineBreakIndex] === codes.CARRIAGE_RETURN 
      && this._data[lineBreakIndex + 1] === codes.LINE_FEED) {
      lineBreakIndex++;
    }

    return Math.min(lineBreakIndex + 1, this._maxIndex);
  }
  
  /**
   * find the nearest space char index
   * @param direction search direction
   * @param start starting index
   */
  findSpaceIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => SPACE_CHARS.has(value),
      direction, start);  
  }

  /**
   * find the nearest non-space char index
   * @param direction search direction
   * @param start starting index
   */
  findNonSpaceIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {    
    
    return this.findSingleCharIndex((value) => !SPACE_CHARS.has(value),
      direction, start);  
  }
  
  /**
   * find the nearest delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => DELIMITER_CHARS.has(value),
      direction, start);  
  }
  
  /**
   * find the nearest non-delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findNonDelimiterIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => !DELIMITER_CHARS.has(value),
      direction, start);  
  }

  /**
   * find the nearest space or delimiter char index
   * @param direction search direction
   * @param start starting index
   */
  findIrregularIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {
    
    return this.findSingleCharIndex((value) => !isRegularChar(value),
      direction, start);  
  }

  /**
   * find the nearest regular (non-space and non-delimiter) char index
   * @param direction search direction
   * @param start starting index
   */
  findRegularIndex(direction: "straight" | "reverse" = "straight", 
    start?: number): number {

    return this.findSingleCharIndex((value) => isRegularChar(value),
      direction, start);
  }
  //#endregion

  //#region parse methods  
  getValueTypeAt(start: number, skipEmpty = true): ValueType  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start)) {
      return null;
    }

    const arr = this._data;
    const i = start;
    const charCode = arr[i];
    switch (charCode) {
      case codes.SLASH:
        if (isRegularChar(arr[i + 1])) {
          return valueTypes.NAME;
        } 
        return valueTypes.UNKNOWN;
      case codes.L_BRACKET:
        return valueTypes.ARRAY;
      case codes.L_PARENTHESE:
        return valueTypes.STRING_LITERAL;
      case codes.LESS:
        if (codes.LESS === arr[i + 1]) {          
          return valueTypes.DICTIONARY;
        }
        return valueTypes.STRING_HEX;
      case codes.PERCENT:
        return valueTypes.COMMENT;
      case codes.D_0:
      case codes.D_1:
      case codes.D_2:
      case codes.D_3:
      case codes.D_4:
      case codes.D_5:
      case codes.D_6:
      case codes.D_7:
      case codes.D_8:
      case codes.D_9:
        const nextDelimIndex = this.findDelimiterIndex("straight", i + 1);
        if (nextDelimIndex !== -1) {
          const refEndIndex = this.findCharIndex(codes.R, "reverse", nextDelimIndex - 1);
          if (refEndIndex !== -1 && refEndIndex > i) {
            return valueTypes.REF;
          }
        }
        return valueTypes.NUMBER;
      case codes.s:
        if (arr[i + 1] === codes.t
          && arr[i + 2] === codes.r
          && arr[i + 3] === codes.e
          && arr[i + 4] === codes.a
          && arr[i + 5] === codes.m) {
          return valueTypes.STREAM;
        }
        return valueTypes.UNKNOWN;
      case codes.t:
        if (arr[i + 1] === codes.r
          && arr[i + 2] === codes.u
          && arr[i + 3] === codes.e) {
          return valueTypes.BOOLEAN;
        }
        return valueTypes.UNKNOWN;
      case codes.f:
        if (arr[i + 1] === codes.a
          && arr[i + 2] === codes.l
          && arr[i + 3] === codes.s
          && arr[i + 4] === codes.e) {
          return valueTypes.BOOLEAN;
        }
        return valueTypes.UNKNOWN;
      default:
        return valueTypes.UNKNOWN;
    }
  }  

  getDictBoundsAt(start: number, skipEmpty = true): {start: number; end: number} {   
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.LESS) {
      return null;
    }

    const dictStart = this.findSubarrayIndex(keywordCodes.DICT_START, 
      {minIndex: start});
    if (!dictStart) {
      return null;
    }

    const dictEnd = this.findSubarrayIndex(keywordCodes.DICT_END, 
      {minIndex: dictStart.end + 1});
    if (!dictEnd) {
      return null;
    }

    return {start: dictStart.start, end: dictEnd.end};
  }
  
  getArrayBoundsAt(start: number, skipEmpty = true): {start: number; end: number} {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.L_BRACKET) {
      return null;
    }

    let subArrayOpened = 0;
    let i = start + 1;    
    let code: number;
    while (subArrayOpened || code !== codes.R_BRACKET) {
      code = this._data[i++];
      if (code === codes.L_BRACKET) {
        subArrayOpened++;
      } else if (subArrayOpened && code === codes.R_BRACKET) {
        subArrayOpened--;
      }
    }
    const arrayEnd = i - 1;
    if (arrayEnd - start < 2) {
      return null;
    }

    return {start, end: arrayEnd};
  }

  parseNumberAt(start: number, 
    float = false, skipEmpty = true): ParseResult<number>  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || !isRegularChar(this._data[start])) {
      return null;
    }

    let i = start;
    let numberStr = "";
    let value = this._data[i];
    if (value === codes.MINUS) {
      numberStr += value;
      value = this._data[++i];
    }
    while (DIGIT_CHARS.has(value)
      || (float && value === codes.DOT)) {
      numberStr += String.fromCharCode(value);
      value = this._data[++i];
    };

    return numberStr 
      ? {value: +numberStr, start, end: i - 1}
      : null;
  }
  
  parseNameAt(start: number, 
    includeSlash = true, skipEmpty = true): ParseResult<string>  {
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.SLASH) {
      return null;
    }

    let i = start + 1;
    let result = includeSlash
      ? "/"
      : "";
    let value = this._data[i];
    while (isRegularChar(value)) {
      result += String.fromCharCode(value);
      value = this._data[++i];
    };

    return result.length > 1 
      ? {value: result, start, end: i - 1}
      : null;
  } 
  
  parseHexAt(start: number, skipEmpty = true): ParseResult<HexString>  {    
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.LESS) {
      return null;
    }

    const end = this.findCharIndex(codes.GREATER, "straight", start + 1);
    if (end === -1) {
      return;
    }

    const hex = HexString.fromBytes(this._data.slice(start, end + 1));
    return {value: hex, start, end};
  }

  parseLiteralAt(start: number, skipEmpty = true): ParseResult<LiteralString>  {       
    if (skipEmpty) {
      start = this.skipEmpty(start);
    }
    if (this.isOutside(start) || this._data[start] !== codes.L_PARENTHESE) {
      return null;
    }

    const arr = this._data;
    const bytes: number[] = [];
    let i = start + 1;
    let prevCode: number;
    let code: number;
    let opened = 0;
    while (opened || code !== codes.R_PARENTHESE || prevCode === codes.BACKSLASH) {
      if (code) {
        prevCode = code;
      }
      code = arr[i++];
      bytes.push(code);

      if (prevCode !== codes.BACKSLASH) {
        if (code === codes.L_PARENTHESE) {
          opened += 1;
        } else if (code === codes.R_PARENTHESE) {
          opened -= 1;
        }
      }
    }
    if (!bytes.length) {
      return null;
    }

    const literal = LiteralString.fromBytes(new Uint8Array(bytes));
    return {value: literal, start, end: i - 1};
  }
  
  parseNumberArrayAt(start: number, float = true, 
    skipEmpty = true): ParseResult<number[]>  {
    const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const numbers: number[] = [];
    let current: ParseResult<number>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = this.parseNumberAt(i, float, true);
      if (!current) {
        break;
      }
      numbers.push(current.value);
      i = current.end + 1;
    }

    return {value: numbers, start: arrayBounds.start, end: arrayBounds.end};
  }
  
  parseHexArrayAt(start: number, skipEmpty = true): ParseResult<HexString[]>  {
    const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
    if (!arrayBounds) {
      return null;
    }

    const hexes: HexString[] = [];
    let current: ParseResult<HexString>;
    let i = arrayBounds.start + 1;
    while(i < arrayBounds.end) {
      current = this.parseHexAt(i, true);
      if (!current) {
        break;
      }
      hexes.push(current.value);
      i = current.end + 1;
    }

    return {value: hexes, start: arrayBounds.start, end: arrayBounds.end};
  }
  //#endregion

  //#region debug methods
  getCharCode(index: number): number {    
    return this._data[index];
  }

  getChar(index: number): string {    
    const code = this._data[index];
    if (!isNaN(code)) {
      return String.fromCharCode(code);
    }
    return null;
  }

  sliceCharCodes(start: number, end?: number): Uint8Array {
    return this._data.slice(start, (end || start) + 1);
  }
  
  sliceChars(start: number, end?: number): string {
    return String.fromCharCode(...this._data.slice(start, (end || start) + 1));
  }
  //#endregion

  //#region private search methods
  private isOutside(index: number) {
    return (index < 0 || index > this._maxIndex);
  }

  private getValidStartIndex(direction: "straight" | "reverse", 
    start: number): number {
    return !isNaN(start) 
      ? Math.max(Math.min(start, this._maxIndex), 0)
      : direction === "straight"
        ? 0
        : this._maxIndex;
  }
  
  private findSingleCharIndex(filter: (value: number) => boolean, 
    direction: "straight" | "reverse" = "straight", start?: number): number {

    const arr = this._data;
    let i = this.getValidStartIndex(direction, start); 
      
    if (direction === "straight") {        
      for (i; i <= this._maxIndex; i++) {
        if (filter(arr[i])) {
          return i;
        }
      }    
    } else {        
      for (i; i >= 0; i--) {
        if (filter(arr[i])) {
          return i;
        }
      }
    }
    
    return -1; 
  }

  private skipEmpty(start: number): number {
    let index = this.findNonSpaceIndex("straight", start);
    if (index === -1) {
      return -1;
    }
    if (this._data[index] === codes.PERCENT) {
      // it's a comment. skip it
      const afterComment = this.findNewLineIndex("straight", index + 1);
      if (afterComment === -1) {
        return -1;
      }
      index = this.findNonSpaceIndex("straight", afterComment);
    }
    return index;
  }
  //#endregion
}
