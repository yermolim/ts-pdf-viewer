import { codes, keywordCodes, 
  DELIMITER_CHARS, SPACE_CHARS, DIGIT_CHARS, 
  isRegularChar } from "./common/codes";
import { ValueType, valueTypes } from "./common/const";

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
    const version = this.parseNumberStartingAtIndex(i.end + 1, true)?.value;
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
  getValueTypeStartingAtIndex(index: number, skipEmpty = true): ValueType  {
    const start = skipEmpty
      ? this.findRegularIndex("straight", index)
      : index;
    if (start < 0 || start > this._maxIndex) {
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
        return valueTypes.NONE;
      case codes.L_BRACKET:
        return valueTypes.ARRAY;
      case codes.L_PARENTHESE:
        return valueTypes.STRING_LITERAL;
      case codes.LESS:
        if (codes.LESS === arr[i + 1]) {          
          return valueTypes.DICT;
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
      default:
        return valueTypes.NONE;
    }
  }  

  parseNumberStartingAtIndex(index: number, 
    float = false, skipEmpty = true): ParseResult<number>  {
    const start = skipEmpty
      ? this.findRegularIndex("straight", index)
      : index;
    if (start < 0 || start > this._maxIndex) {
      return null;
    }

    let i = start;
    let numberStr = "";
    let value = this._data[i];
    while (DIGIT_CHARS.has(value)
      || (float && value === codes.DOT)) {
      numberStr += String.fromCharCode(value);
      value = this._data[++i];
    };

    return numberStr 
      ? {value: +numberStr, start, end: i - 1}
      : null;
  }
  
  parseNameStartingAtIndex(index: number, 
    includeSlash = true, skipEmpty = true): ParseResult<string>  {
    const start = skipEmpty
      ? this.findCharIndex(codes.SLASH, "straight", index)
      : index;
    if (start < 0 || start > this._maxIndex) {
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
  //#endregion

  //#region debug methods
  sliceCharCodes(start: number, end?: number): Uint8Array {
    return this._data.slice(start, (end || start) + 1);
  }
  sliceChars(start: number, end?: number): string {
    return String.fromCharCode(...this._data.slice(start, (end || start) + 1));
  }
  //#endregion

  //#region private search methods
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
  //#endregion
}
