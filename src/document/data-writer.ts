import { codes, keywordCodes } from "./codes";
import { CryptInfo, IDataCryptor, IEncodable, Reference } from "./common-interfaces";

export class DataWriter {
  private readonly _data: number[];  
  private _pointer: number;

  private _encoder: TextEncoder;

  private _stringCryptor: IDataCryptor;
  private _streamCryptor: IDataCryptor;

  public get offset(): number {
    return this._pointer;
  }

  constructor(data: Uint8Array, cryptInfo?: CryptInfo) {
    if (!data?.length) {
      throw new Error("Data is empty");
    }
    this._data = [...data];
    this._pointer = data.length - 1;

    this._encoder = new TextEncoder();

    if (cryptInfo) {
      this._stringCryptor = cryptInfo.stringCryptor;
      this._streamCryptor = cryptInfo.streamCryptor;
    }

    this.fixEof();
  }

  getCurrentData(): Uint8Array {
    return new Uint8Array(this._data);
  }

  writeBytes(bytes: Uint8Array | number[]) {
    if (!bytes?.length) {
      return;
    }
    this._data.push(...bytes);
    this._pointer += bytes.length;
  }
  
  writeIndirectObject(cryptInfo: CryptInfo, obj: IEncodable) {
    if (!cryptInfo?.ref || !obj) {
      return;
    }

    const objBytes = [
      ...this._encoder.encode(`${cryptInfo.ref.id} ${cryptInfo.ref.generation} `), 
      ...keywordCodes.OBJ, ...keywordCodes.END_OF_LINE,
      ...obj.toArray(cryptInfo), 
      ...keywordCodes.OBJ_END, ...keywordCodes.END_OF_LINE,
    ];

    this.writeBytes(objBytes);
  }

  writeEof(xrefOffset: number) {
    const eof = [
      ...keywordCodes.XREF_START, ...keywordCodes.END_OF_LINE,
      ...this._encoder.encode(xrefOffset + ""), ...keywordCodes.END_OF_LINE,
      ...keywordCodes.END_OF_FILE, ...keywordCodes.END_OF_LINE
    ];

    this.writeBytes(eof);
  }

  /**
   * append \r\n to the end of data if absent
   */
  private fixEof() {
    if (this._data[this._pointer] !== codes.LINE_FEED) {
      if (this._data[this._pointer - 1] !== codes.CARRIAGE_RETURN) {
        this._data.push(codes.CARRIAGE_RETURN, codes.LINE_FEED);
        this._pointer += 2;
      } else {        
        this._data.push(codes.LINE_FEED);
        this._pointer += 1;
      }
    }
  }
}
