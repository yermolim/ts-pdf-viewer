import { Quadruple } from "../../../common/types";
import { dictTypes, valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";

import { HexString } from "../strings/hex-string";
import { LiteralString } from "../strings/literal-string";

export class FontDescriptorDict extends PdfDict {
  //#region PDF properties
  /** 
   * (Required) The PostScript name of the font. 
   * This name shall be the same as the value of BaseFont in the font 
   * or CIDFont dictionary that refers to this font descriptor.
   * */
  FontName: string;
  /** 
   * (Optional; PDF 1.5; should be used for Type 3 fonts in Tagged PDF documents) 
   * A byte string specifying the preferred font family name.
   * */
  FontFamily: HexString | LiteralString;
  /** 
   * (Optional; PDF 1.5; should be used for Type 3 fonts in Tagged PDF documents) 
   * The font stretch value. It shall be one of these names (ordered from narrowest to widest):
   *  UltraCondensed, ExtraCondensed, Condensed, SemiCondensed, Normal, SemiExpanded, 
   * Expanded, ExtraExpanded or UltraExpanded. 
   * The specific interpretation of these values varies from font to font.
   * */
  FontStretch: string;
  /** 
   * (Optional; PDF 1.5; should be used for Type 3 fonts in Tagged PDF documents) 
   * The weight (thickness) component of the fully-qualified font name or font specifier. 
   * The possible values shall be 100, 200, 300, 400, 500, 600, 700, 800, or 900, 
   * where each number indicates a weight that is at least as dark as its predecessor. 
   * A value of 400 shall indicate a normal weight; 700 shall indicate bold.
   * The specific interpretation of these values varies from font to font.
   * */
  FontWeight: number;
  /** 
   * (Required) A collection of flags defining various characteristics of the font
   * */
  Flags: number;
  /** 
   * (Required, except for Type 3 fonts) A rectangle, 
   * expressed in the glyph coordinate system, that shall specify the font bounding box. 
   * This should be the smallest rectangle enclosing the shape that would result 
   * if all of the glyphs of the font were placed with their origins coincident and then filled.
   * */
  FontBBox: Quadruple;
  /** 
   * (Required) The angle, expressed in degrees counterclockwise from the vertical, 
   * of the dominant vertical strokes of the font. The 9-o’clock position is 90 degrees, 
   * and the 3-o’clock position is –90 degrees. 
   * The value shall be negative for fonts that slope to the right, as almost all italic fonts do.
   * */
  ItalicAngle: number;
  /** 
   * (Required, except for Type 3 fonts) 
   * The maximum height above the baseline reached by glyphs in this font. 
   * The height of glyphs for accented characters shall be excluded.
   * */
  Ascent: number;
  /** 
   * (Required, except for Type 3 fonts) 
   * The maximum depth below the baseline reached by glyphs in this font. 
   * The value shall be a negative number. 
   * */
  Descent: number;
  /** 
   * (Required for fonts that have Latin characters, except for Type 3 fonts)
   * The vertical coordinate of the top of flat capital letters, measured from the baseline.
   * */
  CapHeight: number;
  /** 
   * (Required, except for Type 3 fonts)The thickness, measured horizontally, 
   * of the dominant vertical stems of glyphs in the font. 
   * */
  StemV: number;
  /** 
   * (Optional) The thickness, measured vertically, 
   * of the dominant horizontal stems of glyphs in the font.
   * */
  StemH = 0;
  /** 
   * (Optional) The spacing between baselines of consecutive lines of text.
   * */
  Leading = 0;
  /** 
   * (Optional) The average width of glyphs in the font.
   * */
  AvgWidth = 0;
  /** 
   * (Optional) The maximum width of glyphs in the font.
   * */
  MaxWidth = 0;
  /** 
   * (Optional) The width to use for character codes whose widths 
   * are not specified in a font dictionary’s Widths array. 
   * This shall have a predictable effect only if all such codes map to glyphs 
   * whose actual widths are the same as the value of the MissingWidth entry. 
   * */
  MissingWidth = 0;
  /** 
   * (Optional) The font’s x height: the vertical coordinate of the top 
   * of flat non-ascending lowercase letters (like the letter x), 
   * measured from the baseline, in fonts that have Latin characters.
   * */
  XHeight = 0;
  /** 
   * (Optional; meaningful only in Type 1 fonts; PDF 1.1) 
   * A string listing the character names defined in a font subset. 
   * The names in this string shall be in PDF syntax—that is, each name preceded by a slash (/). 
   * The names may appear in any order. 
   * The name .notdef shall be omitted; it shall exist in the font subset. 
   * If this entry is absent, the only indication of a font subset 
   * shall be the subset tag in the FontName entry.
   * */
  CharSet: HexString | LiteralString;
  /** 
   * (Optional) A stream containing a Type 1 font program
   * */
  FontFile: ObjectId;
  /** 
   * (Optional; PDF 1.1) A stream containing a TrueType font program
   * */
  FontFile2: ObjectId;
  /** 
   * (Optional; PDF 1.2) A stream containing a font program whose format 
   * is specified by the Subtype entry in the stream dictionary
   * */
  FontFile3: ObjectId;
  //#endregion

  constructor() {
    super(dictTypes.FONT_DESCRIPTOR);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<FontDescriptorDict>> {    
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new FontDescriptorDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  
    
    if (this.FontName) {
      bytes.push(...encoder.encode("/FontName "), ...encoder.encode(" " + this.FontName));
    }
    if (this.FontFamily) {
      bytes.push(...encoder.encode("/FontFamily "), ...this.FontFamily.toArray(cryptInfo));
    }
    if (this.FontStretch) {
      bytes.push(...encoder.encode("/FontStretch "), ...encoder.encode(" " + this.FontStretch));
    }
    if (this.FontWeight) {
      bytes.push(...encoder.encode("/FontWeight "), ...encoder.encode(" " + this.FontWeight));
    }
    if (this.Flags) {
      bytes.push(...encoder.encode("/Flags "), ...encoder.encode(" " + this.Flags));
    }
    if (this.FontBBox) {   
      bytes.push(...encoder.encode("/FontBBox "), ...this.encodePrimitiveArray(this.FontBBox, encoder));
    }
    if (this.ItalicAngle || this.ItalicAngle === 0) {
      bytes.push(...encoder.encode("/ItalicAngle "), ...encoder.encode(" " + (this.ItalicAngle)));
    }
    if (this.Ascent) {
      bytes.push(...encoder.encode("/Ascent "), ...encoder.encode(" " + this.Ascent));
    }
    if (this.Descent) {
      bytes.push(...encoder.encode("/Descent "), ...encoder.encode(" " + this.Descent));
    }
    if (this.CapHeight) {
      bytes.push(...encoder.encode("/CapHeight "), ...encoder.encode(" " + this.CapHeight));
    }
    if (this.StemV) {
      bytes.push(...encoder.encode("/StemV "), ...encoder.encode(" " + this.StemV));
    }
    if (this.StemH) {
      bytes.push(...encoder.encode("/StemV "), ...encoder.encode(" " + this.StemH));
    }
    if (this.Leading) {
      bytes.push(...encoder.encode("/Leading "), ...encoder.encode(" " + this.Leading));
    }
    if (this.AvgWidth) {
      bytes.push(...encoder.encode("/AvgWidth "), ...encoder.encode(" " + this.AvgWidth));
    }
    if (this.MaxWidth) {
      bytes.push(...encoder.encode("/MaxWidth "), ...encoder.encode(" " + this.MaxWidth));
    }
    if (this.MissingWidth) {
      bytes.push(...encoder.encode("/MissingWidth "), ...encoder.encode(" " + this.MissingWidth));
    }
    if (this.XHeight) {
      bytes.push(...encoder.encode("/XHeight "), ...encoder.encode(" " + this.XHeight));
    }
    if (this.CharSet) {
      bytes.push(...encoder.encode("/CharSet "), ...this.CharSet.toArray(cryptInfo));
    }
    if (this.FontFile) {
      bytes.push(...encoder.encode("/FontFile "), ...this.FontFile.toArray(cryptInfo));
    }
    if (this.FontFile2) {
      bytes.push(...encoder.encode("/FontFile2 "), ...this.FontFile2.toArray(cryptInfo));
    }
    if (this.FontFile3) {
      bytes.push(...encoder.encode("/FontFile3 "), ...this.FontFile3.toArray(cryptInfo));
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
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    // DEBUG
    // console.log(parser.sliceChars(start, end));  
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/FontName":
          case "/FontStretch":
            i = await this.parseNamePropAsync(name, parser, i);
            break; 

          case "/FontFile":
          case "/FontFile2":
          case "/FontFile3":
            i = await this.parseRefPropAsync(name, parser, i);
            break;
            
          case "/Flags":
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break; 
            
          case "/FontWeight":
          case "/ItalicAngle":
          case "/Ascent":
          case "/Descent":
          case "/Leading":
          case "/CapHeight":
          case "/XHeight":
          case "/StemV":
          case "/StemH":
          case "/AvgWidth":
          case "/MaxWidth":
          case "/MissingWidth":
            i = await this.parseNumberPropAsync(name, parser, i, true);
            break; 
            
          case "/FontBBox":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break; 
            
          case "/CharSet":
          case "/FontFamily":
            const propType = parser.getValueTypeAt(i);
            if (propType === valueTypes.STRING_HEX) {
              i = await this.parseHexPropAsync(name, parser, i);
            } else if (propType === valueTypes.STRING_LITERAL) {
              i = await this.parseLiteralPropAsync(name, parser, i);
            } else {
              throw new Error(`Unsupported '${name}' property value type: '${propType}'`);
            }
            break; 

          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.FontName 
      || (!this.Flags && this.Flags !== 0)
      || (!this.ItalicAngle && this.ItalicAngle !== 0)) {
      throw new Error("Not all required properties parsed");
    }
  }
}
