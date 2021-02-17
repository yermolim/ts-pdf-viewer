import { OnOffState, onOffStates } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { PdfDict } from "../../core/pdf-dict";

export class LanguageDict extends PdfDict {
  /**
   * (Required) A text string that specifies a language and possibly a locale
   */
  Lang: string;
  /** (Optional) */
  Preferred: OnOffState = onOffStates.OFF;
  
  constructor() {
    super(null);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
