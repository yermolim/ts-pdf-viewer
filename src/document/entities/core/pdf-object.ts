import { DataCryptor } from "../../crypto";
import { Encodable } from "../../interfaces";

export abstract class PdfObject implements Encodable {
  protected _id: number;
  get id(): number {
    return this._id;
  }
  protected _generation: number;
  get generation(): number {
    return this._generation;
  }

  protected constructor() {
    
  }

  abstract toArray(cryptor?: DataCryptor): Uint8Array;
}
