import { Mat3 } from "../../common/math";
import { TextRenderMode, textRenderModes } from "../const";

export interface TextStateParams {   
  matrix?: Mat3;  
  /**
   * Name of a custom PDF font to be used
   */
  customFontName?: string;
  leading?: number;
  renderMode?: TextRenderMode;

  fontFamily?: string;
  /**
   * 1 PDF point = 1px?
   */
  fontSize?: string;
  /**
   * 1 PDF unit = 1px?
   */
  lineHeight?: string;
  /**
   * 1 PDF unit = 1px?
   */
  letterSpacing?: string; // svg attr
  /**
   * 1 PDF unit = 1px?
   */
  wordSpacing?: string; // svg attr
  /**
   * 100 PDF units = 1
   */
  horizontalScale?: number; // svg attr. transform="scale(n, 1)" | combine with matrix?
  /**
   * 1 PDF unit = 0.1em
   */
  verticalAlign?: string;
  knockOut?: boolean;
}

/**text state used in appearance streams */
export class TextState {
  static readonly defaultParams: TextStateParams = {
    matrix: new Mat3(),
    leading: 12 * -1.2,
    renderMode: textRenderModes.FILL,
    fontFamily: "helvetica, arial, sans-serif",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "normal",
    wordSpacing: "normal",
    horizontalScale: 1,
    verticalAlign: "0",
    knockOut: true,
  };

  matrix: Mat3;
  /**
   * Name of a custom PDF font to be used
   */
  customFontName: string;
  leading: number;
  renderMode: TextRenderMode;

  fontFamily: string;  
  /**
   * 1 PDF point = 1px?
   */
  fontSize: string;
  /**
   * 1 PDF unit = 1px?
   */
  lineHeight: string;
  /**
   * 1 PDF unit = 1px?
   */
  letterSpacing: string;
  /**
   * 1 PDF unit = 1px?
   */
  wordSpacing: string;
  /**
   * 100 PDF units = 1
   */
  horizontalScale: number;
  /**
   * 1 PDF unit = 0.1em
   */
  verticalAlign: string;
  knockOut: boolean;

  constructor(params?: TextStateParams) {
    Object.assign(this, TextState.defaultParams, params);
  }

  clone(params?: TextStateParams): TextState {
    const copy = new TextState(this);
    if (params) {
      return Object.assign(copy, params);
    }
    return copy;
  }
}
