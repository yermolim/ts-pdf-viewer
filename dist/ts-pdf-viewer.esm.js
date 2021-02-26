/**
 * Copyright 2021 yermolim
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * 
 * FlateStream class is based on the corresponding one from PDF.js,
 * so the code of that class is also subject to the next license notice:
 * 
 * Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 1996-2003 Glyph & Cog, LLC
 * 
 * The flate stream implementation contained in this file is a JavaScript port
 * of XPDF's implementation, made available under the Apache 2.0 open source
 * license.
 */

import { renderTextLayer, RenderingCancelledException, GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { v4 } from 'uuid';
import Crypto from 'crypto-es';
import Pako from 'pako';

var img = "data:image/png;base64,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";

var img$1 = "data:image/png;base64,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";

var img$2 = "data:image/png;base64,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";

var img$3 = "data:image/png;base64,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";

var img$4 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZG9S8NQFMVPW8Wi1Q46SHHIUMWhhaIgjlLBLtWhrWDVJXlN2kKShpcUKa6Ci0PBQXTxa/A/0FVwVRAERRBx8R/wa5ES72sKLdLe8PJ+nHfP5eUE8Kd1Zth9CcAwHZ5JJaW1/Lo08A4fRhBEHBGZ2dZydimHnvXzSN1UD3Exq3df1xoqqDYDfEHiOWZxh3iBOL3lWIL3iMdYSS4QnxDHOF2Q+Fboisdvgosefwnmucwi4BczpWIHKx3MStwgniaOGnqVte4jviSkmqtZ2iO0JmAjgxSSkKCgijJ0OJRLGSZl1t2XaPpWUCEPo7eFGjg5iiiRN0ZqlaaqtGukq/ToqInc/+dpa7Mz3vRQEuh/dd3PSWBgH2jUXff31HUbZ0DgBbg22/4K5TT/TXq9rUWPgfAOcHnT1pQD4GoXGH+2ZC43pQAtv6YBHxfAcB4YvQcGN7ysWuc4fwJy2/SL7oDDI2CK+sObf/JNaAQfxWcoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB+0lEQVR42u2bMW/EIAyFA7qla5Ol///HdUm6dguFKlQuBwnh7ADKs5TlTsrxPp6NAZ16H0czCMTXsijO90mNUw83DwC4OwAV5hZ37rYWoV6kAAAAAAAAAAAAAAAAAAAAAADcMh6CO63F7iwnkR2cUmqe57YcEIq3zyg4cWaapnYARM7rRjtLYupXY9ggaAHxzqKDtSgbAXdIkwBqqgK4QryP8J3OBe6xLjBVAFwpnjoh9rmDUJoOuhfxqXTwTiitCbon8WE6ROrCaQi6N/GxdFjX9XtzwWkIukS8/cHPmuKfnKD1W6kTdMnM2x/8qC0+VhNIPciGoEts7+nb75ro53cm4nCJ3L0ZkrqRvWSXRwokBZR9M9SzeJoOR82SziHYe5C6kA/A2cZB8E/PsXfh+zgqLt4+DgIl2cotsivEdizJlD0aZ84ymOy/G5nd5FhyJukQwHby8td60jW3hULpxP8Wu605O+vQrEaIQqDtZ20nePG+OStJz+xW+MkJpP2s4QQqvmTmizZDUSdsg7jSCVzii7bDHkK4PF5VEzjFFx+IOAip/lsSArf4YgCxZkl6iZQQ/zKAVJ/AnQ5S4lkA0Jog3Msv3OK5HBBdHZjj300TZxvOdjcoCYHrjlHMAT0HAAAAAAAAAAAAAAAAAAAAANwzFP47jBQAgFvHDyRnPtj60cBDAAAAAElFTkSuQmCC";

var img$5 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZG9S8NQFMVPW8Wi1Q46SHHIUMWhhaIgjlLBLtWhrWDVJXlN2kKShpcUKa6Ci0PBQXTxa/A/0FVwVRAERRBx8R/wa5ES72sKLdLe8PJ+nHfP5eUE8Kd1Zth9CcAwHZ5JJaW1/Lo08A4fRhBEHBGZ2dZydimHnvXzSN1UD3Exq3df1xoqqDYDfEHiOWZxh3iBOL3lWIL3iMdYSS4QnxDHOF2Q+Fboisdvgosefwnmucwi4BczpWIHKx3MStwgniaOGnqVte4jviSkmqtZ2iO0JmAjgxSSkKCgijJ0OJRLGSZl1t2XaPpWUCEPo7eFGjg5iiiRN0ZqlaaqtGukq/ToqInc/+dpa7Mz3vRQEuh/dd3PSWBgH2jUXff31HUbZ0DgBbg22/4K5TT/TXq9rUWPgfAOcHnT1pQD4GoXGH+2ZC43pQAtv6YBHxfAcB4YvQcGN7ysWuc4fwJy2/SL7oDDI2CK+sObf/JNaAQfxWcoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB30lEQVR42u2bzXKDIBCAw+ql6cnqpQ/Q93+f9gF60aan9GKwmkqHsXZA5Wd3YWcyySFO+D4WCLKKU+R4qush5u/DKfHIAlIXIFIDXs45eQhkAYlHiaUhTdMMcvgZniDcTE397Xb9vFweKQgoFfwU+ue1kFJ+AcDDf6J+RQKcqWRAv+cikyhqc4Ax71WPT73Pbg746Lpd/0uO7iVIrwIuNlJkBIyrhJddJBkBbdt62UIDp7Qf5xExL5PvLAXYwM+rxDM7AbbwLIeAL3gSAnzCoxfgGx61gBDwaAWEgkcpICQ8OgGh4VEJiAGPRkAseBQCPMF3JAQo+LV7e3vh9esGKd9M3xeppT2Kk6GYY/5PBiwb47sBmOCDZwA2eCsBVVW9Tg0fX63TsadNfLHgrQQIgBebHtza8+pQIyb81iFQc0n7YHMAdnivAijAexNABd6LAErwzgVQg3cqgCK8MwFU4Z0IoAx/WAB1+EMCOMBvEqAfOXOB3yRAHTlzgne6DOrwy3IW9gKWPa+Xs7AXQDHt9ThcJ7h2p8eiglPMdYF85oCpfvf+ble+OpDMAFNx8o7f7tELGHv2WhbF2SQGisJYv7soh+9JZICp3p565EdmsoDEQ8R+dpfSwUgeAlkAw/gGgdL3j4c6UpkAAAAASUVORK5CYII=";

var img$6 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcmlDQ1BpY2MAACiRdZE9S8NQFIbftkpFWwrqIOKQoYpCC0VBHKWCXapDW8GqS3KbtEKShpsUKa6Ci0PBQXTxa/Af6Cq4KgiCIoi4+Af8WqTEc5tCi7Qn3JyH9573cO+5gD+tM8PuSQCG6fBMKimt5tek4Dt8GEQYQ5iSmW0tZRdz6Bo/j1RN8RAXvbrXdYyBgmozwNdHPMss7hDPE6e3HEvwHvEwK8kF4hPiGKcDEt8KXfH4TXDR4y/BPJdZAPyip1RsY6WNWYkbxJPEUUOvsOZ5xE1CqrmSpTxKaww2MkghCQkKKtiEDgdxyibNrLMv0fAto0weRn8LVXByFFEib4zUCnVVKWukq/TpqIq5/5+nrc1Me91DSaD31XU/x4HgPlCvue7vqevWz4DAC3BttvxlmtPcN+m1lhY9BiI7wOVNS1MOgKtdYOTZkrnckAK0/JoGfFwA4TwwdA/0r3uzau7j/AnIbdMT3QGHR8AE1Uc2/gDt82gCvNGYhAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAcpJREFUeNrtWwFuwyAMjBEPWNf8/4XpugesoWMKUppBYidQ5cAnVZWaRtGdDxscoC6Bvu9d7PfRue6sMETJa8MwRC8Slzi6ACkhiEu8FgGWQpiucdBW9FNj5wiWzyvxjOk5/muVm30n8Xfjl8NfkNeEMLHo10Cem/CbyAHeCZMb/sGePfqTfXfh5/Hovu/3F25Lx9ujiURad6WIld1xHDtjTLLshXv8f7Zgka2dY04ClQNCxDmR5eL0Dvi63Vavf16vh1xjzzy13YKUPPQQWFaDHOShBJjX8VzkIRdDa+RDvvBlskoBOOSlVcLURr7KIVCKPIQAJclDJsGc5FkzwdBUqJE8pANykocTIDd59mKI2zIv0Q8oSR7GAaXIQwhQkjx0GVQBGI5xjEWRrTGqkmGjQ0AFUAFUABVABVAB2sXmRMi3pEbnSDLJyNm3h3MAEvnsAqCRZw0Bb/l5Q2THjg1qaghoFVABVAAVQAVQAVQAFUCCI9thxYSJXj5WcspCHaACNNgP+LhcTr+gySqAX/nNX2nP99ujI/aaX3NAbAPDkQ0RSNFfPTUWbkA/QLUVTNoT9RpOj+rJ0aUDJE5AdkDy8LRECEQBUrnsCeUexwK5uUFRAAAAAElFTkSuQmCC";

var img$7 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABcWlDQ1BpY2MAACiRdZE9S8NQFIbfpkpFqx3qIMUhQxWHFoqCOEoFu1SHtoJVl+Q2aYQkDUmKFFfBxaHgILr4NfgPdBVcFQRBEURc/AN+LVLiuU2hRdoTbs7De897uPdcQMjqzHD6UoBhunYukxZXi2ti6B0BxDACAVGJOdZSfrGAnvHzSNUUD0neq3dd1xgqKQ4DAgPEs8yyXeJ54uyWa3HeIx5lmlQiPiFO2HRA4luuyz6/cS77/MXZLuQWAIH3FMsdLHcw02yDeIo4buhV1joPv0lYMVfylGO0xuEghwzSECGjik3ocJGkbNLMuvtSTd8yKuRh9LdQg02OMjTyJkitUleFskq6Qp+OGp/7/3k66sy03z2cBvpfPe9zAgjtA4265/2eel7jDAi+ANdm21+hOc19k15va/FjILIDXN60NfkAuNoFxp4tyZaaUpCWoKrAxwUwXASi98Dguj+r1j7On4DCNj3RHXB4BExSfWTjD603Z+Sp2ztrAAAACXBIWXMAAAsTAAALEwEAmpwYAAADGklEQVR42uVbC47jIAytESeY6f1P2NkjLCOqInmoP5g4BChSpLZJAT8/G9sQuDHtfr+Tv/9P6WZp/35+tP6lDsEyXgBg7z0eD3qAVsE9AWgU/s8cOQG+vr+bAOCAiK2Cn9CS4TnwGrTIWYAItw9voGmfo56DJlI1DnD38jx75qGxOvcZRwuuCV++V888zaCmLyUkvlc+S0BE6uZBtBMDKHjYbvnMzVG6Rz0bvbSaByWo+0frR0GQWCSZicSE0Kv93Fm5mAl10V/4PSkrSGpRkgrAUXoatWbq8yVA8ujfFQBOg56UbxXQCoIXACytvUHwBjkepffL+Q0PYGqQseaxw5WWyScDcmyPr6uEYOzdnT3YcTcxwMsBtsTlXv1aVoJwpv0bNH16tDl8FThTmwygXeYSBtn61YAmLn6YlgFW0Bg/UgueatMYWQ+AWRiFQZjSBOql6kwneWlF6MyaA8E+6EqHtUleEQUeMD2ofcJH1QRPS4cno7tp/NjoMGbSIljpL4EfPo3ybwzAOzd5aRC0DSOTllEgBEPykBSAlmzBkjkhILyWJLb2Vy7qP54heW89oGu/rgiEKskiRdGETyurBUr7L08L0sA9FdhpTYBaZopmpMKjBwjO+5KiuVD9xVYPSuzXTRdAtdQRc90TnyMIBxBetuHib+jQxjYgPNnQ68m3igOsjm0nEALl4Q2BzvIgRC3Qwaewciu5A9pzr4sM65nAQRYszYioxPzqQUXsDzJbOMZMDwAX6GQB6vM522WDStKzdYt1HlCzQNrBXZEROAxuDYS2YUGtrAwGmw1+SmsNhdMm2n87Wxha1/PdvH/xa8GQg69eEL3ufMBszg+zPBjD2jRwgmfavv7CxC7rvqbcgA89E4cKYQNfkCTlDt0XmGDZezNt1QmuGBgJwvNvjeE/t5Siy3ncq/f9LcJTrA1Wp7GAQ2SFJ0+ItGx5C0XQNJPmhYIuiG+Otm5P9QzQypwjpmSlPR4TNDoTr6iRA40+ak/l95QD1+RaemdIE96UDqMDCUuBYBW+lhM0O1VC4nQl/SkW1MJrcvwCJhH28gf87HUAAAAASUVORK5CYII=";

var img$8 = "data:image/png;base64,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";

var img$9 = "data:image/png;base64,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";

const styles = `
  <style>
    :host {
      --color-primary-final: var(--color-primary, rgba(40,40,40,1));
      --color-primary-tr-final: var(--color-primary-tr, rgba(40,40,40,0.9));
      --color-secondary-final: var(--color-secondary, rgba(60,60,60,1));
      --color-secondary-tr-final: var(--color-secondary-tr, rgba(60,60,60,0.9));
      --color-accent-final: var(--color-accent, rgba(96,96,96,1));
      --color-shadow-final: var(--color-shadow, rgba(0,0,0,0.75));
      --color-bg-final: var(--color-bg, rgba(128,128,128,1));
      --color-fg-primary-final: var(--color-fg-primary, rgba(255,255,255,1));
      --color-fg-secondary-final: var(--color-fg-secondary, rgba(187,187,187,1));
      --color-fg-accent-final: var(--color-fg-accent, rgba(255,255,255,1));
      --color-text-selection-final: var(--color-text-selection, rgba(104,104,128,0.3));
    }

    .disabled {
      pointer-events: none;
    }

    .relative {
      position: relative;
    }
    .absolute {
      position: absolute;
    }
    .abs-stretch {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
    }
    .abs-topleft {
      position: absolute;
      left: 0;
      top: 0;
    }
    .stretch {
      width: 100%;
      height: 100%;
    }

    #main-container {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      align-items: stretch;
      width: 100%;
      height: 100%;
      background: var(--color-bg-final);
    }
  
    #panel-top {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      width: 100%;
      height: 50px;
      background: var(--color-primary-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: height 0.25s ease-out 0.1s;
    }
    .hide-panels #panel-top {
      height: 0;
      transition: height 0.25s ease-in 0.2s;
    }
  
    #panel-bottom {
      position: absolute;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      left: calc(50% - 160px);
      bottom: 20px;
      width: 320px;
      height: 50px;  
      background: var(--color-primary-tr-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
    }
    .hide-panels #panel-bottom {
      bottom: 0;
      height: 0;
      transition: bottom 0.1s linear 0.1s, height 0.25s ease-in 0.2s;
    }

    .panel-v-separator {
      width: 1px;
      height: 30px;
      background-color: var(--color-fg-secondary-final);
    }
  
    .panel-button {
      cursor: pointer;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
    .panel-button:hover,
    .panel-button.on {
      background-color: var(--color-accent-final);
    }
    .panel-button img {
      width: 20px;
      height: 20px;
      filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--color-fg-primary-final)) saturate(1000%);
    }  
    .panel-button:hover img,
    .panel-button.on img {
      filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--color-fg-accent-final)) saturate(1000%);
    }  
  
    .subpanel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin: 0 4px;
    }    
    
    .panel-item {
      transform: scale(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-panels .panel-item {
      cursor: default;      
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #paginator {  
      user-select: none;
      font-family: sans-serif;
      font-size: 16px;
      color: var(--color-fg-primary-final);
    }
    #paginator-input {
      text-align: center; 
      font-size: 16px;
      width: 30px;
      height: 30px;
      margin: 2px;
      padding: 0;
      outline: none;
      border: none;
      color: var(--color-fg-primary-final);
      background-color: var(--color-primary-final);
    }
    #paginator-total {
      margin: 4px;
    }

    #toggle-previewer {
      margin: 4px;
    }
      
    #previewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow-y: auto;
      left: 0;
      top: 50px;
      bottom: 0;
      width: 160px; 
      padding-top: 0px;
      background: var(--color-secondary-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
      z-index: 1;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, width 0.25s ease-out;
    } 
    .hide-panels #previewer {
      top: 0;
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
    }   
    .mobile #previewer {
      background: var(--color-secondary-tr-final);
    } 
    .hide-previewer #previewer {
      width: 0;
      transition: width 0.25s ease-in 0.1s;
    }
    #previewer .page-preview {      
      transform: scaleX(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-previewer #previewer .page-preview {
      opacity: 0;
      transform: scaleX(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #viewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: auto;
      left: 160px;
      right: 0;
      top: 50px;
      bottom: 0;
      padding-top: 0px;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-out;
    }
    #viewer.hand {
      cursor: grab !important;
      user-select: none !important;
    }
    .hide-panels #viewer {
      top: 0;
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
    }      
    .hide-panels.mobile #viewer,
    .hide-panels.hide-previewer #viewer {
      top: 0;
      padding-top: 50px;
      left: 0;
      transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s, left 0.25s ease-in;
    }   
    .mobile #viewer,
    .hide-previewer #viewer {
      top: 50px;
      padding-top: 0px;
      left: 0;
      transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-in;
    } 
  
    .page {    
      position: relative;
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 10px auto;
      background-color: white;
      box-shadow: 0 0 10px var(--color-shadow-final);
    }
    .page-preview {   
      cursor: pointer; 
      position: relative;
      display: flex;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 0 auto;
      background-color: white;
      background-clip: content-box;
      border-style: solid;
      border-width: 10px 10px 20px 10px;
      border-color: transparent;
    }
    .page-preview:hover,
    .page-preview.current {
      border-color: var(--color-accent-final);
    }
    .page-preview::after {
      display: inline-block;
      position: absolute;
      top: calc(100% + 3px);
      width: 100%;
      text-align: center;
      font-family: sans-serif;
      font-size: 14px;
      line-height: 1;
      color: var(--color-fg-primary-final);
      content: attr(data-page-number) " ";
    }

    .page-canvas {
      background-color: white;
    } 
    
    .page-text {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      line-height: 1;
    }
    .page-text span {
      cursor: text;
      position: absolute;
      white-space: pre;
      color: transparent;
      transform-origin: 0% 0%;
    }
    .page-text ::selection {
      background: var(--color-text-selection-final);
    }
    .hand .page-text span {
      cursor: grab;
    }
    
    .page-annotations {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    .page-annotations.passive {
      pointer-events: none;
    }
    
    #password-dialog {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: var(--color-secondary-tr-final);
      z-index: 2;
    }
    #password-dialog .form {
      position: absolute;
      display: flex;
      flex-direction: row;
      justify-content: stretch;
      align-items: stretch;
      flex-grow: 0;
      flex-shrink: 0;
      left: calc(50% - 160px);
      top: calc(50% - 25px);
      width: 320px;
      height: 50px;  
      background: var(--color-primary-tr-final);
      box-shadow: 0 0 10px var(--color-shadow-final);
    }
    #password-dialog input {
      width: 220px;
      margin: 10px 0 10px 10px;
      padding: 5px;
      font-size: 16px;
      outline: none;
      border: none;
      color: var(--color-fg-primary-final);
      background-color: var(--color-primary-final);
    }
    #password-dialog input::placeholder {
      font-size: 14px;
      font-style: italic;
      color: var(--color-fg-primary-final);
    }
    #password-dialog .buttons {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      flex-grow: 1;
      flex-shrink: 1;
      width: 100px;
    } 

    .svg-annotation-rect {
      cursor: pointer;
    } 
    .svg-annotation-rect.selected {
      cursor: grab;
    } 
    .svg-annotation-rect.selected .svg-rect-bg {
      stroke: var(--color-secondary-tr-final);
      stroke-dasharray: 3 3;
    } 
    .svg-annotation-rect.selected .svg-rect-handle {
      r: 3;
      fill: var(--color-primary-final);
      cursor: pointer;
    }
  </style>
`;
const html = `
  <div id="main-container" class="hide-previewer" ondragstart="return false;" ondrop="return false;">
    <div id="viewer"></div>
    <div id="previewer"></div>
    <div id="panel-top"> 
      <div class="subpanel panel-item">
        <div id="toggle-previewer" class="panel-button panel-item">
          <img src="${img$6}"/>
        </div> 
        <div id="toggle-hand" class="panel-button panel-item">
          <img src="${img$7}"/>
        </div> 
      </div>
      <div id="annotator" class="subpanel panel-item">
      </div>
    </div>
    <div id="panel-bottom" class="disabled">
      <div id="paginator" class="subpanel panel-item">
        <div id="paginator-prev" class="panel-button">
          <img src="${img}"/>
        </div>
        <div id="paginator-next" class="panel-button">
          <img src="${img$1}"/>
        </div>
        <input id="paginator-input" type="text">
        <span>&nbsp/&nbsp</span>
        <span id="paginator-total">0</span>
      </div>
      <div class="panel-v-separator panel-item"></div>
      <div id="zoomer" class="subpanel panel-item">
        <div id="zoom-out" class="panel-button">
          <img src="${img$2}"/>
        </div>
        <div id="zoom-in" class="panel-button">
          <img src="${img$3}"/>
        </div>
        <div id="zoom-fit-viewer" class="panel-button">
          <img src="${img$4}"/>
        </div>
        <div id="zoom-fit-page" class="panel-button">
          <img src="${img$5}"/>
        </div>
      </div>
    </div>
  </div>
`;
const passwordDialogHtml = `
    <div class="form">
      <input id="password-input" type="password" maxlength="127"/>
      <div class="buttons">
        <div id="password-ok" class="panel-button">
          <img src="${img$8}"/>
        </div>
        <div id="password-cancel" class="panel-button">
          <img src="${img$9}"/>
        </div>
      </div>
    </div>
`;

function getRandomUuid() {
    return v4();
}
function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}
class LinkedListNode {
    constructor(data) {
        this.data = data;
    }
}
class LinkedList {
    constructor(head) {
        this._length = 0;
        if (head) {
            this.push(head);
        }
    }
    get head() {
        return this._head.data;
    }
    get length() {
        return this._length;
    }
    get tail() {
        return this.get(this._length - 1);
    }
    push(value) {
        const node = new LinkedListNode(value);
        let current;
        if (!this._head) {
            this._head = node;
        }
        else {
            current = this._head;
            while (current.next) {
                current = current.next;
            }
            current.next = node;
        }
        this._length++;
    }
    insert(value, n) {
        if (n < 0 || n > this._length - 1) {
            return null;
        }
        const node = new LinkedListNode(value);
        let previous;
        let current = this._head;
        let i = 0;
        if (!n) {
            this._head = node;
        }
        else {
            while (i++ < n) {
                previous = current;
                current = current.next;
            }
            previous.next = node;
        }
        node.next = current;
        this._length++;
        return node.data;
    }
    replace(value, n) {
        if (n < 0 || n > this._length - 1) {
            return null;
        }
        const node = new LinkedListNode(value);
        let previous;
        let current = this._head;
        let i = 0;
        if (!n) {
            this._head = node;
        }
        else {
            while (i++ < n) {
                previous = current;
                current = current.next;
            }
            previous.next = node;
        }
        node.next = current.next;
        return current.data;
    }
    remove(n) {
        if (n < 0 || n > this._length - 1) {
            return null;
        }
        let previous;
        let current = this._head;
        let i = 0;
        if (!n) {
            this._head = current.next;
        }
        else {
            while (i++ < n) {
                previous = current;
                current = current.next;
            }
            previous.next = current.next;
        }
        this._length--;
        return current.data;
    }
    clear() {
        this._head = null;
        this._length = 0;
    }
    get(n) {
        if (n < 0 || n > this._length - 1) {
            return null;
        }
        let current = this._head;
        let i = 0;
        while (i++ < n) {
            current = current.next;
        }
        return current.data;
    }
    pop() {
        return this.remove(this._length - 1);
    }
    has(value, comparator) {
        if (!this._length) {
            return false;
        }
        comparator || (comparator = (a, b) => a === b);
        let current = this._head;
        let i = 0;
        while (i < this._length) {
            if (comparator(value, current.data)) {
                return true;
            }
            current = current.next;
            i++;
        }
        return false;
    }
    findIndex(value, comparator) {
        if (!this._length) {
            return -1;
        }
        comparator || (comparator = (a, b) => a === b);
        let current = this._head;
        let i = 0;
        while (i < this._length) {
            if (comparator(value, current.data)) {
                return i;
            }
            current = current.next;
            i++;
        }
        return -1;
    }
    *[Symbol.iterator]() {
        let current = this._head;
        while (current) {
            yield current.data;
            current = current.next;
        }
    }
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(v, max));
}
class Vec2 {
    constructor(x = 0, y = 0) {
        this.length = 2;
        this.x = x;
        this.y = y;
    }
    static multiplyByScalar(v, s) {
        return new Vec2(v.x * s, v.y * s);
    }
    static addScalar(v, s) {
        return new Vec2(v.x + s, v.y + s);
    }
    static normalize(v) {
        return new Vec2().setFromVec2(v).normalize();
    }
    static add(v1, v2) {
        return new Vec2(v1.x + v2.x, v1.y + v2.y);
    }
    static substract(v1, v2) {
        return new Vec2(v1.x - v2.x, v1.y - v2.y);
    }
    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
    static applyMat3(v, m) {
        return v.clone().applyMat3(m);
    }
    static lerp(v1, v2, t) {
        return v1.clone().lerp(v2, t);
    }
    static rotate(v, center, theta) {
        return v.clone().rotate(center, theta);
    }
    static equals(v1, v2, precision = 6) {
        return v1.equals(v2);
    }
    static getDistance(v1, v2) {
        const x = v2.x - v1.x;
        const y = v2.y - v1.y;
        return Math.sqrt(x * x + y * y);
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    setFromVec2(vec2) {
        this.x = vec2.x;
        this.y = vec2.y;
        return this;
    }
    multiplyByScalar(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    addScalar(s) {
        this.x += s;
        this.y += s;
        return this;
    }
    getMagnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const m = this.getMagnitude();
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    substract(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    dotProduct(v) {
        return Vec2.dotProduct(this, v);
    }
    applyMat3(m) {
        if (m.length !== 9) {
            throw new Error("Matrix must contain 9 elements");
        }
        const { x, y } = this;
        const [x_x, x_y, , y_x, y_y, , z_x, z_y,] = m;
        this.x = x * x_x + y * y_x + z_x;
        this.y = x * x_y + y * y_y + z_y;
        return this;
    }
    lerp(v, t) {
        this.x += t * (v.x - this.x);
        this.y += t * (v.y - this.y);
        return this;
    }
    rotate(center, theta) {
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        const x = this.x - center.x;
        const y = this.y - center.y;
        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;
        return this;
    }
    equals(v, precision = 6) {
        return +this.x.toFixed(precision) === +v.x.toFixed(precision)
            && +this.y.toFixed(precision) === +v.y.toFixed(precision);
    }
    toArray() {
        return [this.x, this.y];
    }
    toIntArray() {
        return new Int32Array(this);
    }
    toFloatArray() {
        return new Float32Array(this);
    }
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
    }
}
class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.length = 3;
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static multiplyByScalar(v, s) {
        return new Vec3(v.x * s, v.y * s, v.z * s);
    }
    static addScalar(v, s) {
        return new Vec3(v.x + s, v.y + s, v.z + s);
    }
    static normalize(v) {
        return new Vec3().setFromVec3(v).normalize();
    }
    static add(v1, v2) {
        return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }
    static substract(v1, v2) {
        return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }
    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }
    static crossProduct(v1, v2) {
        return new Vec3(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
    }
    static onVector(v1, v2) {
        return v1.clone().onVector(v2);
    }
    static onPlane(v, planeNormal) {
        return v.clone().onPlane(planeNormal);
    }
    static applyMat3(v, m) {
        return v.clone().applyMat3(m);
    }
    static lerp(v1, v2, t) {
        return v1.clone().lerp(v2, t);
    }
    static equals(v1, v2, precision = 6) {
        if (!v1) {
            return false;
        }
        return v1.equals(v2, precision);
    }
    static getDistance(v1, v2) {
        const x = v2.x - v1.x;
        const y = v2.y - v1.y;
        const z = v2.z - v1.z;
        return Math.sqrt(x * x + y * y + z * z);
    }
    static getAngle(v1, v2) {
        return v1.getAngle(v2);
    }
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    setFromVec3(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    multiplyByScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    addScalar(s) {
        this.x += s;
        this.y += s;
        this.z += s;
        return this;
    }
    getMagnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    getAngle(v) {
        const d = this.getMagnitude() * v.getMagnitude();
        if (!d) {
            return Math.PI / 2;
        }
        const cos = this.dotProduct(v) / d;
        return Math.acos(clamp(cos, -1, 1));
    }
    normalize() {
        const m = this.getMagnitude();
        if (m) {
            this.x /= m;
            this.y /= m;
            this.z /= m;
        }
        return this;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    substract(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    dotProduct(v) {
        return Vec3.dotProduct(this, v);
    }
    crossProduct(v) {
        this.x = this.y * v.z - this.z * v.y;
        this.y = this.z * v.x - this.x * v.z;
        this.z = this.x * v.y - this.y * v.x;
        return this;
    }
    onVector(v) {
        const magnitude = this.getMagnitude();
        if (!magnitude) {
            return this.set(0, 0, 0);
        }
        return v.clone().multiplyByScalar(v.clone().dotProduct(this) / (magnitude * magnitude));
    }
    onPlane(planeNormal) {
        return this.substract(this.clone().onVector(planeNormal));
    }
    applyMat3(m) {
        if (m.length !== 9) {
            throw new Error("Matrix must contain 9 elements");
        }
        const { x, y, z } = this;
        const [x_x, x_y, x_z, y_x, y_y, y_z, z_x, z_y, z_z] = m;
        this.x = x * x_x + y * y_x + z * z_x;
        this.y = x * x_y + y * y_y + z * z_y;
        this.z = x * x_z + y * y_z + z * z_z;
        return this;
    }
    lerp(v, t) {
        this.x += t * (v.x - this.x);
        this.y += t * (v.y - this.y);
        this.z += t * (v.z - this.z);
        return this;
    }
    equals(v, precision = 6) {
        if (!v) {
            return false;
        }
        return +this.x.toFixed(precision) === +v.x.toFixed(precision)
            && +this.y.toFixed(precision) === +v.y.toFixed(precision)
            && +this.z.toFixed(precision) === +v.z.toFixed(precision);
    }
    toArray() {
        return [this.x, this.y, this.z];
    }
    toIntArray() {
        return new Int32Array(this);
    }
    toFloatArray() {
        return new Float32Array(this);
    }
    *[Symbol.iterator]() {
        yield this.x;
        yield this.y;
        yield this.z;
    }
}
class Mat3 {
    constructor() {
        this.length = 9;
        this._matrix = new Array(this.length);
        this._matrix[0] = 1;
        this._matrix[1] = 0;
        this._matrix[2] = 0;
        this._matrix[3] = 0;
        this._matrix[4] = 1;
        this._matrix[5] = 0;
        this._matrix[6] = 0;
        this._matrix[7] = 0;
        this._matrix[8] = 1;
    }
    get x_x() {
        return this._matrix[0];
    }
    get x_y() {
        return this._matrix[1];
    }
    get x_z() {
        return this._matrix[2];
    }
    get y_x() {
        return this._matrix[3];
    }
    get y_y() {
        return this._matrix[4];
    }
    get y_z() {
        return this._matrix[5];
    }
    get z_x() {
        return this._matrix[6];
    }
    get z_y() {
        return this._matrix[7];
    }
    get z_z() {
        return this._matrix[8];
    }
    static fromMat3(m) {
        return new Mat3().setFromMat3(m);
    }
    static multiply(m1, m2) {
        const [a11, a12, a13, a21, a22, a23, a31, a32, a33] = m1._matrix;
        const [b11, b12, b13, b21, b22, b23, b31, b32, b33] = m2._matrix;
        const m = new Mat3();
        m.set(a11 * b11 + a12 * b21 + a13 * b31, a11 * b12 + a12 * b22 + a13 * b32, a11 * b13 + a12 * b23 + a13 * b33, a21 * b11 + a22 * b21 + a23 * b31, a21 * b12 + a22 * b22 + a23 * b32, a21 * b13 + a22 * b23 + a23 * b33, a31 * b11 + a32 * b21 + a33 * b31, a31 * b12 + a32 * b22 + a33 * b32, a31 * b13 + a32 * b23 + a33 * b33);
        return m;
    }
    static multiplyScalar(m, s) {
        const res = new Mat3();
        for (let i = 0; i < this.length; i++) {
            res._matrix[i] = m._matrix[i] * s;
        }
        return res;
    }
    static transpose(m) {
        const res = new Mat3();
        res.set(m.x_x, m.y_x, m.z_x, m.x_y, m.y_y, m.z_y, m.x_z, m.y_z, m.z_z);
        return res;
    }
    static invert(m) {
        const mTemp = new Mat3();
        mTemp.set(m.y_y * m.z_z - m.z_y * m.y_z, m.y_x * m.z_z - m.z_x * m.y_z, m.y_x * m.z_y - m.z_x * m.y_y, m.x_y * m.z_z - m.z_y * m.x_z, m.x_x * m.z_z - m.z_x * m.x_z, m.x_x * m.z_y - m.z_x * m.x_y, m.x_y * m.y_z - m.y_y * m.x_z, m.x_x * m.y_z - m.y_x * m.x_z, m.x_x * m.y_y - m.y_x * m.x_y);
        mTemp.set(mTemp.x_x, -mTemp.x_y, mTemp.x_z, -mTemp.y_x, mTemp.y_y, -mTemp.y_z, mTemp.z_x, -mTemp.z_y, mTemp.z_z);
        const det = m.x_x * mTemp.x_x + m.x_y * mTemp.x_y + m.x_z * mTemp.x_z;
        const inversed = new Mat3();
        if (!det) {
            inversed.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
        else {
            const detInv = 1 / 10;
            inversed.set(detInv * mTemp.x_x, detInv * mTemp.y_x, detInv * mTemp.z_x, detInv * mTemp.x_y, detInv * mTemp.y_y, detInv * mTemp.z_y, detInv * mTemp.x_z, detInv * mTemp.y_z, detInv * mTemp.z_z);
        }
        return inversed;
    }
    static buildScale(x, y = undefined) {
        y !== null && y !== void 0 ? y : (y = x);
        return new Mat3().set(x, 0, 0, 0, y, 0, 0, 0, 1);
    }
    static buildRotation(theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new Mat3().set(c, s, 0, -s, c, 0, 0, 0, 1);
    }
    static buildTranslate(x, y) {
        return new Mat3().set(1, 0, 0, 0, 1, 0, x, y, 1);
    }
    static equals(m1, m2, precision = 6) {
        return m1.equals(m2, precision);
    }
    clone() {
        return new Mat3().set(this.x_x, this.x_y, this.x_z, this.y_x, this.y_y, this.y_z, this.z_x, this.z_y, this.z_z);
    }
    set(x_x, x_y, x_z, y_x, y_y, y_z, z_x, z_y, z_z) {
        this._matrix[0] = x_x;
        this._matrix[1] = x_y;
        this._matrix[2] = x_z;
        this._matrix[3] = y_x;
        this._matrix[4] = y_y;
        this._matrix[5] = y_z;
        this._matrix[6] = z_x;
        this._matrix[7] = z_y;
        this._matrix[8] = z_z;
        return this;
    }
    reset() {
        this._matrix[0] = 1;
        this._matrix[1] = 0;
        this._matrix[2] = 0;
        this._matrix[3] = 0;
        this._matrix[4] = 1;
        this._matrix[5] = 0;
        this._matrix[6] = 0;
        this._matrix[7] = 0;
        this._matrix[8] = 1;
        return this;
    }
    setFromMat3(m) {
        for (let i = 0; i < this.length; i++) {
            this._matrix[i] = m._matrix[i];
        }
        return this;
    }
    multiply(m) {
        const [a11, a12, a13, a21, a22, a23, a31, a32, a33] = this._matrix;
        const [b11, b12, b13, b21, b22, b23, b31, b32, b33] = m._matrix;
        this._matrix[0] = a11 * b11 + a12 * b21 + a13 * b31;
        this._matrix[1] = a11 * b12 + a12 * b22 + a13 * b32;
        this._matrix[2] = a11 * b13 + a12 * b23 + a13 * b33;
        this._matrix[3] = a21 * b11 + a22 * b21 + a23 * b31;
        this._matrix[4] = a21 * b12 + a22 * b22 + a23 * b32;
        this._matrix[5] = a21 * b13 + a22 * b23 + a23 * b33;
        this._matrix[6] = a31 * b11 + a32 * b21 + a33 * b31;
        this._matrix[7] = a31 * b12 + a32 * b22 + a33 * b32;
        this._matrix[8] = a31 * b13 + a32 * b23 + a33 * b33;
        return this;
    }
    multiplyScalar(s) {
        for (let i = 0; i < this.length; i++) {
            this._matrix[i] *= s;
        }
        return this;
    }
    transpose() {
        const temp = new Mat3().setFromMat3(this);
        this.set(temp.x_x, temp.y_x, temp.z_x, temp.x_y, temp.y_y, temp.z_y, temp.x_z, temp.y_z, temp.z_z);
        return this;
    }
    invert() {
        const mTemp = new Mat3();
        mTemp.set(this.y_y * this.z_z - this.z_y * this.y_z, this.y_x * this.z_z - this.z_x * this.y_z, this.y_x * this.z_y - this.z_x * this.y_y, this.x_y * this.z_z - this.z_y * this.x_z, this.x_x * this.z_z - this.z_x * this.x_z, this.x_x * this.z_y - this.z_x * this.x_y, this.x_y * this.y_z - this.y_y * this.x_z, this.x_x * this.y_z - this.y_x * this.x_z, this.x_x * this.y_y - this.y_x * this.x_y);
        mTemp.set(mTemp.x_x, -mTemp.x_y, mTemp.x_z, -mTemp.y_x, mTemp.y_y, -mTemp.y_z, mTemp.z_x, -mTemp.z_y, mTemp.z_z);
        const det = this.x_x * mTemp.x_x + this.x_y * mTemp.x_y + this.x_z * mTemp.x_z;
        if (!det) {
            this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
        else {
            const detInv = 1 / 10;
            this.set(detInv * mTemp.x_x, detInv * mTemp.y_x, detInv * mTemp.z_x, detInv * mTemp.x_y, detInv * mTemp.y_y, detInv * mTemp.z_y, detInv * mTemp.x_z, detInv * mTemp.y_z, detInv * mTemp.z_z);
        }
        return this;
    }
    getDeterminant() {
        const [a, b, c, d, e, f, g, h, i] = this._matrix;
        return a * e * i - a * f * h + b * f * g - b * d * i + c * d * h - c * e * g;
    }
    getTRS() {
        const t = new Vec2(this.z_x, this.z_y);
        const s_x = Math.sqrt(this.x_x * this.x_x + this.x_y * this.x_y);
        const s_y = Math.sqrt(this.y_x * this.y_x + this.y_y * this.y_y);
        const s = new Vec2(s_x, s_y);
        const rCos = this.x_x / s_x;
        const r = Math.acos(rCos);
        return { t, r, s };
    }
    equals(m, precision = 6) {
        for (let i = 0; i < this.length; i++) {
            if (+this._matrix[i].toFixed(precision) !== +m._matrix[i].toFixed(precision)) {
                return false;
            }
        }
        return true;
    }
    applyScaling(x, y = undefined) {
        const m = Mat3.buildScale(x, y);
        return this.multiply(m);
    }
    applyTranslation(x, y) {
        const m = Mat3.buildTranslate(x, y);
        return this.multiply(m);
    }
    applyRotation(theta) {
        const m = Mat3.buildRotation(theta);
        return this.multiply(m);
    }
    toArray() {
        return this._matrix.slice();
    }
    toIntArray() {
        return new Int32Array(this);
    }
    toIntShortArray() {
        return new Int32Array([
            this._matrix[0],
            this._matrix[1],
            this._matrix[3],
            this._matrix[4],
            this._matrix[6],
            this._matrix[7],
        ]);
    }
    toFloatArray() {
        return new Float32Array(this);
    }
    toFloatShortArray() {
        return new Float32Array([
            this._matrix[0],
            this._matrix[1],
            this._matrix[3],
            this._matrix[4],
            this._matrix[6],
            this._matrix[7],
        ]);
    }
    *[Symbol.iterator]() {
        for (let i = 0; i < 9; i++) {
            yield this._matrix[i];
        }
    }
}
function mat3From4Vec2(aMin, aMax, bMin, bMax, noRotation = false) {
    const mat = new Mat3();
    mat.applyTranslation(-aMin.x, -aMin.y);
    const aLen = Vec2.substract(aMax, aMin).getMagnitude();
    const bLen = Vec2.substract(bMax, bMin).getMagnitude();
    const scale = bLen / aLen;
    mat.applyScaling(scale);
    if (!noRotation) {
        const aTheta = Math.atan2(aMax.y - aMin.y, aMax.x - aMin.x);
        const bTheta = Math.atan2(bMax.y - bMin.y, bMax.x - bMin.x);
        const rotation = bTheta - aTheta;
        mat.applyRotation(rotation);
    }
    mat.applyTranslation(bMin.x, bMin.y);
    return mat;
}
function vecMinMax(...values) {
    const min = new Vec2(Math.min(...values.map(x => x.x)), Math.min(...values.map(x => x.y)));
    const max = new Vec2(Math.max(...values.map(x => x.x)), Math.max(...values.map(x => x.y)));
    return { min, max };
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PageAnnotationView {
    constructor(annotationData, pageId, pageDimensions) {
        this._svgByAnnotation = new Map();
        if (!annotationData || isNaN(pageId) || !pageDimensions) {
            throw new Error("Required argument not found");
        }
        this._pageId = pageId;
        this._pageDimensions = pageDimensions;
        this._container = document.createElement("div");
        this._container.classList.add("page-annotations");
        this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this._svg.classList.add("stretch");
        this._svg.setAttribute("data-page-id", pageId + "");
        this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
        this._svg.setAttribute("transform", "scale(1, -1)");
        this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this._container.append(this._svg);
        this._annotations = annotationData.getPageAnnotations(pageId);
        this.switchEditMode(true);
    }
    destroy() {
        this.remove();
        this._container = null;
    }
    remove() {
        var _a;
        this.switchEditMode(false);
        (_a = this._container) === null || _a === void 0 ? void 0 : _a.remove();
    }
    appendAsync(parent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._rendered) {
                yield this.renderAnnotationsAsync();
                this._rendered = true;
            }
            parent.append(this._container);
        });
    }
    switchSelectedAnnotation(annotation) {
        if (!this._editModeOn || annotation === this._selectedAnnotation) {
            return;
        }
        if (this._selectedAnnotation) {
            const oldSelectedSvg = this._svgByAnnotation.get(this._selectedAnnotation);
            oldSelectedSvg === null || oldSelectedSvg === void 0 ? void 0 : oldSelectedSvg.classList.remove("selected");
        }
        const newSelectedSvg = this._svgByAnnotation.get(annotation);
        if (!newSelectedSvg) {
            return;
        }
        newSelectedSvg.classList.add("selected");
        this._svg.append(newSelectedSvg);
        this._selectedAnnotation = annotation;
    }
    switchEditMode(value) {
        value = value !== null && value !== void 0 ? value : !this._editModeOn;
        this._editModeOn = value;
        if (value) {
            this._container.classList.remove("passive");
        }
        else {
            this._container.classList.add("passive");
            this.switchSelectedAnnotation(null);
        }
    }
    renderAnnotation(annotation) {
        const svgWithBox = annotation.render();
        if (!svgWithBox) {
            return;
        }
        const { svg, clipPaths } = svgWithBox;
        this._svgByAnnotation.set(annotation, svg);
        svg.addEventListener("pointerdown", () => this.switchSelectedAnnotation(annotation));
        this._svg.append(svg);
        clipPaths === null || clipPaths === void 0 ? void 0 : clipPaths.forEach(x => this._defs.append(x));
    }
    renderAnnotationsAsync() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.clear();
            const promises = [];
            for (let i = 0; i < ((_a = this._annotations) === null || _a === void 0 ? void 0 : _a.length) || 0; i++) {
                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        this.renderAnnotation(this._annotations[i]);
                        resolve();
                    }, 0);
                }));
            }
            yield Promise.all(promises);
            this._svg.append(this._defs);
            return true;
        });
    }
    clear() {
        this._svg.innerHTML = "";
        this._svgByAnnotation.clear();
    }
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PageTextView {
    constructor(pageProxy) {
        this.onMouseDown = (e) => {
            var _a;
            if (this._divModeTimer) {
                clearTimeout(this._divModeTimer);
                this._divModeTimer = null;
            }
            (_a = this._renderTask) === null || _a === void 0 ? void 0 : _a.expandTextDivs(true);
        };
        this.onMouseUp = (e) => {
            this._divModeTimer = setTimeout(() => {
                var _a;
                (_a = this._renderTask) === null || _a === void 0 ? void 0 : _a.expandTextDivs(false);
                this._divModeTimer = null;
            }, 300);
        };
        if (!pageProxy) {
            throw new Error("Page proxy is not defined");
        }
        this._pageProxy = pageProxy;
        this._container = document.createElement("div");
        this._container.classList.add("page-text");
        this._container.addEventListener("mousedown", this.onMouseDown);
        this._container.addEventListener("mouseup", this.onMouseUp);
    }
    static appendPageTextAsync(pageProxy, parent, scale) {
        return __awaiter$1(this, void 0, void 0, function* () {
            const textObj = new PageTextView(pageProxy);
            yield textObj.renderTextLayerAsync(scale);
            parent.append(textObj._container);
            return textObj;
        });
    }
    destroy() {
        this.destroyRenderTask();
        if (this._container) {
            this._container.remove();
            this._container = null;
        }
    }
    renderTextLayerAsync(scale) {
        return __awaiter$1(this, void 0, void 0, function* () {
            this.clear();
            this.destroyRenderTask();
            const viewport = this._pageProxy.getViewport({ scale });
            const textContentStream = this._pageProxy.streamTextContent();
            this._renderTask = renderTextLayer({
                container: this._container,
                textContentStream,
                viewport,
                enhanceTextSelection: true,
            });
            try {
                yield this._renderTask.promise;
            }
            catch (error) {
                if (error.message === "TextLayer task cancelled.") {
                    return false;
                }
                else {
                    throw error;
                }
            }
            return true;
        });
    }
    clear() {
        this._container.innerHTML = "";
    }
    destroyRenderTask() {
        if (this._renderTask) {
            this._renderTask.cancel();
            this._renderTask = null;
        }
    }
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PageView {
    constructor(pageProxy, annotationData, maxScale, previewWidth) {
        if (!pageProxy) {
            throw new Error("Page proxy is not defined");
        }
        if (!annotationData) {
            throw new Error("Annotation data is not defined");
        }
        this._pageProxy = pageProxy;
        this._viewport = pageProxy.getViewport({ scale: 1 });
        this._maxScale = Math.max(maxScale, 1);
        this._annotationData = annotationData;
        this.number = pageProxy.pageNumber;
        this.id = pageProxy.ref["num"];
        this.generation = pageProxy.ref["gen"];
        const { width, height } = this._viewport;
        previewWidth = Math.max(previewWidth !== null && previewWidth !== void 0 ? previewWidth : 0, 50);
        const previewHeight = previewWidth * (height / width);
        this._dimensions = { width, height, previewWidth, previewHeight };
        this._previewContainer = document.createElement("div");
        this._previewContainer.classList.add("page-preview");
        this._previewContainer.setAttribute("data-page-number", this.number + "");
        this._previewContainer.setAttribute("data-page-id", this.id + "");
        this._previewContainer.setAttribute("data-page-gen", this.generation + "");
        this._previewContainer.style.width = this._dimensions.previewWidth + "px";
        this._previewContainer.style.height = this._dimensions.previewHeight + "px";
        this._viewContainer = document.createElement("div");
        this._viewContainer.classList.add("page");
        this._viewContainer.setAttribute("data-page-number", this.number + "");
        this._viewContainer.setAttribute("data-page-id", this.id + "");
        this._viewContainer.setAttribute("data-page-gen", this.generation + "");
        this.scale = 1;
    }
    get previewContainer() {
        return this._previewContainer;
    }
    get viewContainer() {
        return this._viewContainer;
    }
    set _viewRendered(value) {
        this.$viewRendered = value;
        this._viewContainer.setAttribute("data-loaded", value + "");
    }
    get _viewRendered() {
        return this.$viewRendered;
    }
    set scale(value) {
        if (value <= 0 || this._scale === value) {
            return;
        }
        this._scale = value;
        const dpr = window.devicePixelRatio;
        this._dimensions.scaledWidth = this._dimensions.width * this._scale;
        this._dimensions.scaledHeight = this._dimensions.height * this._scale;
        this._dimensions.scaledDprWidth = this._dimensions.scaledWidth * dpr;
        this._dimensions.scaledDprHeight = this._dimensions.scaledHeight * dpr;
        this._viewContainer.style.width = this._dimensions.scaledWidth + "px";
        this._viewContainer.style.height = this._dimensions.scaledHeight + "px";
        if (this._viewCanvas) {
            this._viewCanvas.style.width = this._dimensions.scaledWidth + "px";
            this._viewCanvas.style.height = this._dimensions.scaledHeight + "px";
        }
        this._scaleIsValid = false;
    }
    get viewValid() {
        return this._scaleIsValid && this._viewRendered;
    }
    destroy() {
        this._previewContainer.remove();
        this._viewContainer.remove();
        this._pageProxy.cleanup();
    }
    renderPreviewAsync(force = false) {
        return __awaiter$2(this, void 0, void 0, function* () {
            if (this._renderPromise) {
                if (force) {
                    this.cancelRenderTask();
                }
                yield this._renderPromise;
            }
            if (!force && this._previewRendered) {
                return;
            }
            this._renderPromise = this.runPreviewRenderAsync();
            return this._renderPromise;
        });
    }
    renderViewAsync(force = false) {
        return __awaiter$2(this, void 0, void 0, function* () {
            if (this._renderPromise) {
                if (force) {
                    this.cancelRenderTask();
                }
                yield this._renderPromise;
            }
            if (!force && this.viewValid) {
                return;
            }
            this._renderPromise = this.runViewRenderAsync();
            return this._renderPromise;
        });
    }
    clearPreview() {
        this._previewContainer.innerHTML = "";
    }
    clearView() {
        var _a, _b, _c;
        (_a = this._annotations) === null || _a === void 0 ? void 0 : _a.destroy();
        this._annotations = null;
        (_b = this._text) === null || _b === void 0 ? void 0 : _b.destroy();
        this._text = null;
        (_c = this._viewCanvas) === null || _c === void 0 ? void 0 : _c.remove();
        this._viewRendered = false;
    }
    cancelRenderTask() {
        if (this._renderTask) {
            this._renderTask.cancel();
            this._renderTask = null;
        }
    }
    runRenderTaskAsync(renderParams) {
        return __awaiter$2(this, void 0, void 0, function* () {
            this.cancelRenderTask();
            this._renderTask = this._pageProxy.render(renderParams);
            try {
                yield this._renderTask.promise;
            }
            catch (error) {
                if (error instanceof RenderingCancelledException) {
                    return false;
                }
                else {
                    throw error;
                }
            }
            finally {
                this._renderTask = null;
            }
            return true;
        });
    }
    createPreviewCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("page-canvas");
        const dpr = window.devicePixelRatio;
        const { previewWidth: width, previewHeight: height } = this._dimensions;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        return canvas;
    }
    createViewCanvas() {
        const canvas = document.createElement("canvas");
        canvas.classList.add("page-canvas");
        canvas.style.width = this._dimensions.scaledWidth + "px";
        canvas.style.height = this._dimensions.scaledHeight + "px";
        canvas.width = this._dimensions.scaledDprWidth;
        canvas.height = this._dimensions.scaledDprHeight;
        return canvas;
    }
    scaleCanvasImage(sourceCanvas, targetCanvas) {
        let ratio = this._scale / this._maxScale;
        let tempSource = sourceCanvas;
        let tempTarget;
        while (ratio < 0.5) {
            tempTarget = document.createElement("canvas");
            tempTarget.width = tempSource.width * 0.5;
            tempTarget.height = tempSource.height * 0.5;
            tempTarget.getContext("2d").drawImage(tempSource, 0, 0, tempTarget.width, tempTarget.height);
            tempSource = tempTarget;
            ratio *= 2;
        }
        targetCanvas.getContext("2d").drawImage(tempSource, 0, 0, targetCanvas.width, targetCanvas.height);
    }
    runPreviewRenderAsync() {
        return __awaiter$2(this, void 0, void 0, function* () {
            const canvas = this.createPreviewCanvas();
            const params = {
                canvasContext: canvas.getContext("2d"),
                viewport: this._viewport.clone({ scale: canvas.width / this._dimensions.width }),
            };
            const result = yield this.runRenderTaskAsync(params);
            if (!result) {
                this._previewRendered = false;
                return;
            }
            this._previewContainer.innerHTML = "";
            this._previewContainer.append(canvas);
            this._previewRendered = true;
        });
    }
    runViewRenderAsync() {
        var _a, _b;
        return __awaiter$2(this, void 0, void 0, function* () {
            const scale = this._scale;
            (_a = this._text) === null || _a === void 0 ? void 0 : _a.destroy();
            this._text = null;
            const canvas = this.createViewCanvas();
            const params = {
                canvasContext: canvas.getContext("2d"),
                viewport: this._viewport.clone({ scale: scale * window.devicePixelRatio }),
                enableWebGL: true,
            };
            const result = yield this.runRenderTaskAsync(params);
            if (!result || scale !== this._scale) {
                return;
            }
            (_b = this._viewCanvas) === null || _b === void 0 ? void 0 : _b.remove();
            this._viewContainer.append(canvas);
            this._viewCanvas = canvas;
            this._viewRendered = true;
            this._text = yield PageTextView.appendPageTextAsync(this._pageProxy, this._viewContainer, scale);
            if (!this._annotations) {
                const { width: x, height: y } = this._dimensions;
                this._annotations = new PageAnnotationView(this._annotationData, this.id, new Vec2(x, y));
            }
            yield this._annotations.appendAsync(this.viewContainer);
            if (scale === this._scale) {
                this._scaleIsValid = true;
            }
        });
    }
}

const codes = {
    NULL: 0,
    BACKSPACE: 8,
    HORIZONTAL_TAB: 9,
    LINE_FEED: 10,
    VERTICAL_TAB: 11,
    FORM_FEED: 12,
    CARRIAGE_RETURN: 13,
    WHITESPACE: 32,
    EXCLAMATION_MARK: 33,
    DOUBLE_QUOTE: 34,
    HASH: 35,
    DOLLAR: 36,
    PERCENT: 37,
    AMPERSAND: 38,
    QUOTE: 39,
    L_PARENTHESE: 40,
    R_PARENTHESE: 41,
    ASTERISK: 42,
    PLUS: 43,
    COMMA: 44,
    MINUS: 45,
    DOT: 46,
    SLASH: 47,
    D_0: 48,
    D_1: 49,
    D_2: 50,
    D_3: 51,
    D_4: 52,
    D_5: 53,
    D_6: 54,
    D_7: 55,
    D_8: 56,
    D_9: 57,
    COLON: 58,
    SEMICOLON: 59,
    LESS: 60,
    EQUAL: 61,
    GREATER: 62,
    QUESTION_MARK: 63,
    AT: 64,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    L_BRACKET: 91,
    BACKSLASH: 92,
    R_BRACKET: 93,
    CARET: 94,
    UNDERSCORE: 95,
    BACKTICK: 96,
    a: 97,
    b: 98,
    c: 99,
    d: 100,
    e: 101,
    f: 102,
    g: 103,
    h: 104,
    i: 105,
    j: 106,
    k: 107,
    l: 108,
    m: 109,
    n: 110,
    o: 111,
    p: 112,
    q: 113,
    r: 114,
    s: 115,
    t: 116,
    u: 117,
    v: 118,
    w: 119,
    x: 120,
    y: 121,
    z: 122,
    L_BRACE: 123,
    VERTICAL_LINE: 124,
    R_BRACE: 125,
    TILDE: 126,
};
const keywordCodes = {
    NULL: [codes.n, codes.u, codes.l, codes.l],
    OBJ: [codes.o, codes.b, codes.j],
    OBJ_END: [codes.e, codes.n, codes.d, codes.o, codes.b, codes.j],
    STREAM_START: [codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],
    STREAM_END: [codes.e, codes.n, codes.d,
        codes.s, codes.t, codes.r, codes.e, codes.a, codes.m],
    DICT_START: [codes.LESS, codes.LESS],
    DICT_END: [codes.GREATER, codes.GREATER],
    ARRAY_START: [codes.L_BRACKET],
    ARRAY_END: [codes.R_BRACKET],
    STR_LITERAL_START: [codes.L_PARENTHESE],
    STR_LITERAL_END: [codes.R_PARENTHESE],
    STR_HEX_START: [codes.LESS],
    STR_HEX_END: [codes.GREATER],
    VERSION: [codes.PERCENT, codes.P, codes.D, codes.F, codes.MINUS],
    PREV: [codes.SLASH, codes.P, codes.r, codes.e, codes.v],
    TYPE: [codes.SLASH, codes.T, codes.y, codes.p, codes.e],
    SUBTYPE: [codes.SLASH, codes.S, codes.u, codes.b, codes.t, codes.y, codes.p, codes.e],
    XREF_TABLE: [codes.x, codes.r, codes.e, codes.f],
    XREF_STREAM: [codes.SLASH, codes.X, codes.R, codes.e, codes.f],
    XREF_HYBRID: [codes.X, codes.R, codes.e, codes.f, codes.S, codes.t, codes.m],
    XREF_START: [codes.s, codes.t, codes.a, codes.r, codes.t,
        codes.x, codes.r, codes.e, codes.f],
    TRAILER: [codes.t, codes.r, codes.a, codes.i, codes.l, codes.e, codes.r],
    END_OF_FILE: [codes.PERCENT, codes.PERCENT, codes.E, codes.O, codes.F],
    END_OF_LINE: [codes.CARRIAGE_RETURN, codes.LINE_FEED],
    TRUE: [codes.t, codes.r, codes.u, codes.e],
    FALSE: [codes.f, codes.a, codes.l, codes.s, codes.e],
};
const DELIMITER_CHARS = new Set([
    codes.PERCENT,
    codes.L_PARENTHESE,
    codes.R_PARENTHESE,
    codes.SLASH,
    codes.LESS,
    codes.GREATER,
    codes.L_BRACKET,
    codes.R_BRACKET,
    codes.L_BRACE,
    codes.R_BRACE,
]);
const SPACE_CHARS = new Set([
    codes.NULL,
    codes.HORIZONTAL_TAB,
    codes.LINE_FEED,
    codes.FORM_FEED,
    codes.CARRIAGE_RETURN,
    codes.WHITESPACE,
]);
const DIGIT_CHARS = new Set([
    codes.D_0,
    codes.D_1,
    codes.D_2,
    codes.D_3,
    codes.D_4,
    codes.D_5,
    codes.D_6,
    codes.D_7,
    codes.D_8,
    codes.D_9,
]);
function isRegularChar(code) {
    return !DELIMITER_CHARS.has(code) && !SPACE_CHARS.has(code);
}
function isDigit(code) {
    return DIGIT_CHARS.has(code);
}

function parseIntFromBytes(bytes) {
    if (!(bytes === null || bytes === void 0 ? void 0 : bytes.length)) {
        return 0;
    }
    if (bytes.length === 1) {
        return bytes[0];
    }
    const hex = Array.from(bytes, (byte) => ("0" + (byte & 0xFF).toString(16)).slice(-2)).join("");
    return parseInt(hex, 16);
}
function int8ToBytes(int) {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setInt8(0, int);
    return new Uint8Array(buffer);
}
function int16ToBytes(int, le = false) {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setInt16(0, int, le);
    return new Uint8Array(buffer);
}
function int32ToBytes(int, le = false) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setInt32(0, int, le);
    return new Uint8Array(buffer);
}
function int32ArrayToBytes(ints, le = false) {
    const buffer = new ArrayBuffer(ints.length * 4);
    const view = new DataView(buffer);
    for (let i = 0; i < ints.length; i++) {
        view.setInt32(i * 4, ints[i], le);
    }
    return new Uint8Array(buffer);
}
function xorBytes(bytes, n) {
    const result = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        result[i] = bytes[i] ^ n;
    }
    return result;
}
function arraysEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
function findSubarrayIndex(arr, sub) {
    if ((arr === null || arr === void 0 ? void 0 : arr.length) && (sub === null || sub === void 0 ? void 0 : sub.length)) {
        let j;
        outer_loop: for (let i = 0; i <= arr.length; i++) {
            let overlap = false;
            for (j = 0; j < sub.length; j++) {
                if (i + j < arr.length) {
                    if (arr[i + j] !== sub[j]) {
                        continue outer_loop;
                    }
                    overlap = true;
                }
                else if (overlap) {
                    return i;
                }
                else {
                    break outer_loop;
                }
            }
        }
    }
    return -1;
}
function hexStringToBytes(hexString) {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0, j = 0; i < hexString.length; i += 2, j++) {
        bytes[j] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
}

const objectTypes = {
    UNKNOWN: 0,
    NULL: 1,
    BOOLEAN: 2,
    NUMBER: 3,
    STRING_LITERAL: 4,
    STRING_HEX: 5,
    NAME: 6,
    ARRAY: 7,
    DICTIONARY: 8,
    STREAM: 9,
};
const xRefTypes = {
    TABLE: 0,
    STREAM: 1,
    HYBRID: 2,
};
const xRefEntryTypes = {
    FREE: 0,
    NORMAL: 1,
    COMPRESSED: 2,
};
const streamFilters = {
    ASCII85: "/ASCII85Decode",
    ASCIIHEX: "/ASCIIHexDecode",
    CCF: "/CCITTFaxDecode",
    CRYPT: "/Crypt",
    DCT: "/DCTDecode",
    FLATE: "/FlateDecode",
    JBIG2: "/JBIG2Decode",
    JPX: "/JPXDecode",
    LZW: "/LZWDecode",
    RLX: "/RunLengthDecode",
};
const flatePredictors = {
    NONE: 1,
    TIFF: 2,
    PNG_NONE: 10,
    PNG_SUB: 11,
    PNG_UP: 12,
    PNG_AVERAGE: 13,
    PNG_PAETH: 14,
    PNG_OPTIMUM: 15,
};
const cryptVersions = {
    RC4_40: 1,
    RC4_128: 2,
    AES_128: 4,
    AES_256: 5,
};
const cryptRevisions = {
    RC4_40: 2,
    RC4_128: 3,
    AES_128: 4,
    AES_256: 5,
    AES_256_V2: 6,
};
const cryptMethods = {
    NONE: "/None",
    RC4: "/V2",
    AES_128: "/AESV2",
    AES_256: "/AESV3",
};
const authEvents = {
    DOC_OPEN: "/DocOpen",
    EMBEDDED_OPEN: "/EFOpen",
};
const justificationTypes = {
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2,
};
const streamTypes = {
    XREF: "/XRef",
    OBJECT_STREAM: "/ObjStm",
    FORM_XOBJECT: "/XObject",
    METADATA_STREAM: "/Metadata",
};
const dictTypes = {
    XREF: "/XRef",
    XOBJECT: "/XObject",
    CATALOG: "/Catalog",
    PAGE_TREE: "/Pages",
    PAGE: "/Page",
    ANNOTATION: "/Annot",
    BORDER_STYLE: "/Border",
    OPTIONAL_CONTENT_GROUP: "/OCG",
    OPTIONAL_CONTENT_MD: "/OCMD",
    EXTERNAL_DATA: "/ExDATA",
    ACTION: "/Action",
    MEASURE: "/Measure",
    DEV_EXTENSIONS: "/DeveloperExtensions",
    GRAPHICS_STATE: "/ExtGState",
    CRYPT_FILTER: "/CryptFilter",
    SOFT_MASK: "/Mask",
    GROUP: "/Group",
    FONT: "/Font",
    EMPTY: "",
};
const groupDictTypes = {
    TRANSPARENCY: "/Transparency",
};
const valueTypes = {
    UNKNOWN: 0,
    NULL: 1,
    BOOLEAN: 2,
    NUMBER: 3,
    STRING_LITERAL: 4,
    STRING_HEX: 5,
    NAME: 6,
    ARRAY: 7,
    DICTIONARY: 8,
    STREAM: 9,
    REF: 10,
    COMMENT: 11,
};
const annotationTypes = {
    TEXT: "/Text",
    LINK: "/Link",
    FREE_TEXT: "/FreeText",
    LINE: "/Line",
    SQUARE: "/Square",
    CIRCLE: "/Circle",
    POLYGON: "/Polygon",
    POLYLINE: "/PolyLine",
    HIGHLIGHT: "/Highlight",
    UNDERLINE: "/Underline",
    SQUIGGLY: "/Squiggly",
    STRIKEOUT: "/StrikeOut",
    STAMP: "/Stamp",
    CARET: "/Caret",
    INK: "/Ink",
    POPUP: "/Popup",
    FILE_ATTACHMENT: "/FileAttachment",
    SOUND: "/Sound",
    MOVIE: "/Movie",
    WIDGET: "/Widget",
    SCREEN: "/Screen",
    PRINTER_MARK: "/PrinterMark",
    TRAPNET: "/TrapNet",
    WATERMARK: "/Watermark",
    THREED: "/3D",
    REDACT: "/Redact",
    PROJECTION: "/Projection",
    RICH_MEDIA: "/RichMedia",
};
const annotationStateModelTypes = {
    MARKED: "/Marked",
    REVIEW: "/Review",
};
const annotationMarkedStates = {
    MARKED: "/Marked",
    UNMARKED: "/Unmarked",
};
const annotationReviewStates = {
    ACCEPTED: "/Accepted",
    REJECTED: "/Rejected",
    CANCELLED: "/Cancelled",
    COMPLETED: "/Completed",
    NONE: "/None",
};
const annotationIconTypes = {
    COMMENT: "/Comment",
    KEY: "/Key",
    NOTE: "/Note",
    HELP: "/Help",
    NEW_PARAGRAPH: "/NewParagraph",
    PARAGRAPH: "/Paragraph",
    INSERT: "/Insert",
};
const lineEndingTypes = {
    SQUARE: "/Square",
    CIRCLE: "/Circle",
    DIAMOND: "/Diamond",
    ARROW_OPEN: "/OpenArrow",
    ARROW_CLOSED: "/ClosedArrow",
    NONE: "/None",
    BUTT: "/Butt",
    ARROW_OPEN_R: "/ROpenArrow",
    ARROW_CLOSED_R: "/RClosedArrow",
    SLASH: "/Slash",
};
const lineCapStyles = {
    BUTT: 0,
    ROUND: 1,
    SQUARE: 2,
};
const lineJoinStyles = {
    MITER: 0,
    ROUND: 1,
    BEVEL: 2,
};
const renderingIntents = {
    ABSOLUTE: "/AbsoluteColorimetric",
    RELATIVE: "/RelativeColorimetric",
    SATURATION: "/Saturation",
    PERCEPTUAL: "/Perceptual",
};
const blendModes = {
    NORMAL: "/Normal",
    COMPATIBLE: "/Compatible",
    MULTIPLY: "/Multiply",
    SCREEN: "/Screen",
    OVERLAY: "/Overlay",
    DARKEN: "/Darken",
    LIGHTEN: "/Lighten",
    COLOR_DODGE: "/ColorDodge",
    COLOR_BURN: "/ColorBurn",
    HARD_LIGHT: "/HardLight",
    SOFT_LIGHT: "/SoftLight",
    DIFFERENCE: "/Difference",
    EXCLUSION: "/Exclusion",
};
const textRenderModes = {
    FILL: 0,
    STROKE: 1,
    FILL_STROKE: 2,
    INVISIBLE: 3,
    FILL_USE_AS_CLIP: 4,
    STROKE_USE_AS_CLIP: 5,
    FILL_STROKE_USE_AS_CLIP: 6,
    USE_AS_CLIP: 7,
};
const colorSpaces = {
    GRAYSCALE: "/DeviceGray",
    RGB: "/DeviceRGB",
    CMYK: "/DeviceCMYK",
};
const softMaskTypes = {
    ALPHA: "/Alpha",
    LUMINOSITY: "/Luminosity",
};
const supportedFilters = new Set([
    streamFilters.FLATE,
]);
const maxGeneration = 65535;

function toWordArray(data) {
    return Crypto.lib.WordArray.create(data);
}
function wordArrayToBytes(wordArray) {
    return int32ArrayToBytes(wordArray.words).slice(0, wordArray.sigBytes);
}
function md5(data) {
    if (data instanceof Uint8Array) {
        data = toWordArray(data);
    }
    const result = Crypto.MD5(data);
    return result;
}
function rc4(data, key) {
    if (data instanceof Uint8Array) {
        data = toWordArray(data);
    }
    if (key instanceof Uint8Array) {
        key = toWordArray(key);
    }
    const result = Crypto.RC4.encrypt(data, key).ciphertext;
    return result;
}
function aes(data, key, decrypt = false) {
    if (data instanceof Uint8Array) {
        data = toWordArray(data);
    }
    if (key instanceof Uint8Array) {
        key = toWordArray(key);
    }
    if (decrypt) {
        const ivWordArray = Crypto.lib.WordArray.create(data.words.slice(0, 4));
        const d = Crypto.algo.AES.createDecryptor(key, {
            mode: Crypto.mode.CBC,
            iv: ivWordArray,
            padding: Crypto.pad.Pkcs7,
        });
        const result = d.finalize(data);
        return result;
    }
    else {
        const ivWordArray = Crypto.lib.WordArray.random(16);
        const e = Crypto.algo.AES.createEncryptor(key, {
            mode: Crypto.mode.CBC,
            iv: ivWordArray,
            padding: Crypto.pad.Pkcs7,
        });
        const result = e.finalize(data);
        return result;
    }
}

const AESV2_KEY_PADDING = [
    0x73, 0x41, 0x6C, 0x54,
];
class AESV2DataCryptor {
    constructor(key) {
        if (!key) {
            throw new Error("Empty key");
        }
        if (key.length !== 16) {
            throw new Error(`Invalid key length: ${key.length} (shall be 16)`);
        }
        this._n = key.length;
        this._key = key;
        this._tempKey = new Uint8Array(key.length + 9);
    }
    encrypt(data, ref) {
        return this.run(data, ref.id, ref.generation);
    }
    decrypt(data, ref) {
        return this.run(data, ref.id, ref.generation, true);
    }
    run(data, id, generation, decrypt = false) {
        const idBytes = int32ToBytes(id, true);
        const genBytes = int32ToBytes(generation, true);
        this._tempKey.set(this._key, 0);
        this._tempKey.set(idBytes.subarray(0, 3), this._n);
        this._tempKey.set(genBytes.subarray(0, 2), this._n + 3);
        this._tempKey.set(AESV2_KEY_PADDING, this._n + 5);
        const hash = wordArrayToBytes(md5(this._tempKey));
        const n = Math.min(this._n + 5, 16);
        const key = hash.slice(0, n);
        const result = wordArrayToBytes(aes(data, key, decrypt));
        return decrypt
            ? result.slice(16)
            : result;
    }
}

class AESV3DataCryptor {
    constructor(key) {
        if (!key) {
            throw new Error("Empty key");
        }
        if (key.length !== 32) {
            throw new Error(`Invalid key length: ${key.length} (shall be 16)`);
        }
        this._n = key.length;
        this._key = key;
    }
    encrypt(data, ref) {
        return this.run(data, ref.id, ref.generation);
    }
    decrypt(data, ref) {
        return this.run(data, ref.id, ref.generation, true);
    }
    run(data, id, generation, decrypt = false) {
        const result = wordArrayToBytes(aes(data, this._key, decrypt));
        return decrypt
            ? result.slice(16)
            : result;
    }
}

class IdentityDataCryptor {
    constructor() {
    }
    encrypt(data, ref) {
        return data;
    }
    decrypt(data, ref) {
        return data;
    }
}

class RC4DataCryptor {
    constructor(key) {
        if (!key) {
            throw new Error("Empty key");
        }
        if (key.length < 5 || key.length > 16) {
            throw new Error(`Invalid key length: ${key.length} (shall be a multiple in range from 40 to 128)`);
        }
        this._n = key.length;
        this._key = key;
        this._tempKey = new Uint8Array(key.length + 5);
    }
    encrypt(data, ref) {
        const idBytes = int32ToBytes(ref.id, true);
        const genBytes = int32ToBytes(ref.generation, true);
        this._tempKey.set(this._key, 0);
        this._tempKey.set(idBytes.slice(0, 3), this._n);
        this._tempKey.set(genBytes.slice(0, 2), this._n + 3);
        const hash = wordArrayToBytes(md5(this._tempKey));
        const n = Math.min(this._n + 5, 16);
        const key = hash.slice(0, n);
        const encrypted = wordArrayToBytes(rc4(data, key));
        return encrypted;
    }
    decrypt(data, ref) {
        return this.encrypt(data, ref);
    }
}

const PASSWORD_32_PADDING = [
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
    0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
    0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
    0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A,
];
class DataCryptHandler {
    constructor(options, fileId) {
        const { filter, version, revision, permissions, encryptMetadata, keyLength, stringKeyLength, streamKeyLength, stringMethod, streamMethod, oPasswordHash, uPasswordHash, oEncPasswordHash, uEncPasswordHash, perms } = options;
        if (filter !== "/Standard") {
            throw new Error(`Unsupported filter name: ${filter}`);
        }
        if (![1, 2, 4, 5].includes(version)) {
            throw new Error(`Unsupported algorithm version: ${version}`);
        }
        if (![2, 3, 4, 5, 6].includes(revision)) {
            throw new Error(`Unsupported algorithm revision: ${revision}`);
        }
        if (isNaN(permissions)) {
            throw new Error("Permissions not provided");
        }
        if (!oPasswordHash || !uPasswordHash) {
            throw new Error("Password hash not provided");
        }
        this._filter = filter;
        this._version = version;
        this._revision = revision;
        this._permissions = permissions;
        this._keyLength = keyLength;
        this._encryptMetadata = encryptMetadata;
        this._stringKeyLength = stringKeyLength;
        this._streamKeyLength = streamKeyLength;
        this._stringMethod = stringMethod;
        this._streamMethod = streamMethod;
        this._oPasswordHash = oPasswordHash;
        this._uPasswordHash = uPasswordHash;
        this._oEncPasswordHash = oEncPasswordHash;
        this._uEncPasswordHash = uEncPasswordHash;
        this._perms = perms;
        this._fileId = fileId;
    }
    authenticate(password) {
        const version = this._version;
        const stringMethod = this._stringMethod;
        const streamMethod = this._streamMethod;
        let owner = false;
        const ownerAuthenticated = this.authOwnerPassword(password);
        if (ownerAuthenticated) {
            owner = true;
        }
        else {
            const userAuthenticated = this.authUserPassword(password);
            if (!userAuthenticated) {
                return null;
            }
        }
        const key = this._lastEncryptionKey;
        switch (version) {
            case 1:
                const rc4_40 = new RC4DataCryptor(key);
                return {
                    owner,
                    stringCryptor: rc4_40,
                    streamCryptor: rc4_40,
                };
            case 2:
                const rc4_128 = new RC4DataCryptor(key);
                return {
                    owner,
                    stringCryptor: rc4_128,
                    streamCryptor: rc4_128,
                };
            case 4:
                let v4stringCryptor;
                if (!stringMethod || stringMethod === cryptMethods.NONE) {
                    v4stringCryptor = new IdentityDataCryptor();
                }
                else if (stringMethod === cryptMethods.RC4) {
                    v4stringCryptor = new RC4DataCryptor(key);
                }
                else if (stringMethod === cryptMethods.AES_128) {
                    v4stringCryptor = new AESV2DataCryptor(key);
                }
                else {
                    throw new Error(`Invalid crypt method: ${stringMethod}`);
                }
                let v4streamCryptor;
                if (!streamMethod || streamMethod === cryptMethods.NONE) {
                    v4streamCryptor = new IdentityDataCryptor();
                }
                else if (streamMethod === cryptMethods.RC4) {
                    v4streamCryptor = new RC4DataCryptor(key);
                }
                else if (streamMethod === cryptMethods.AES_128) {
                    v4streamCryptor = new AESV2DataCryptor(key);
                }
                else {
                    throw new Error(`Invalid crypt method: ${streamMethod}`);
                }
                return {
                    owner,
                    stringCryptor: v4stringCryptor,
                    streamCryptor: v4streamCryptor,
                };
            case 5:
                let v5stringCryptor;
                if (!stringMethod || stringMethod === cryptMethods.NONE) {
                    v4stringCryptor = new IdentityDataCryptor();
                }
                else if (stringMethod === cryptMethods.AES_256) {
                    v4stringCryptor = new AESV3DataCryptor(key);
                }
                else {
                    throw new Error(`Invalid crypt method: ${stringMethod}`);
                }
                let v5streamCryptor;
                if (!streamMethod || streamMethod === cryptMethods.NONE) {
                    v4streamCryptor = new IdentityDataCryptor();
                }
                else if (streamMethod === cryptMethods.AES_256) {
                    v4streamCryptor = new AESV3DataCryptor(key);
                }
                else {
                    throw new Error(`Invalid crypt method: ${streamMethod}`);
                }
                return {
                    owner,
                    stringCryptor: v5stringCryptor,
                    streamCryptor: v5streamCryptor,
                };
        }
    }
    padPassword32(password) {
        if (!password) {
            return new Uint8Array(PASSWORD_32_PADDING);
        }
        const bytes = new TextEncoder().encode(password);
        const padded = new Uint8Array(32);
        padded.set(bytes.slice(0, 32));
        if (bytes.length < 32) {
            padded.set(PASSWORD_32_PADDING.slice(0, 32 - bytes.length), bytes.length);
        }
        return padded;
    }
    computeEncryptionKey(password) {
        if ([2, 3, 4].includes(this._revision)) {
            const paddedPassword = this.padPassword32(password);
            const permissionsLe = int32ToBytes(this._permissions, true);
            const metadata = this._revision >= 4 && !this._encryptMetadata
                ? new Uint8Array([255, 255, 255, 255])
                : new Uint8Array(0);
            const dataToHash = new Uint8Array([
                ...paddedPassword,
                ...this._oPasswordHash,
                ...permissionsLe,
                ...this._fileId,
                ...metadata,
            ]);
            let hash = wordArrayToBytes(md5(dataToHash));
            const keyLength = this._keyLength >> 3;
            if (this._revision >= 3) {
                for (let i = 0; i < 50; i++) {
                    hash = wordArrayToBytes(md5(hash.slice(0, keyLength)));
                }
            }
            const encryptionKey = hash.slice(0, keyLength);
            this._lastEncryptionKey = encryptionKey;
            return encryptionKey;
        }
        else if (this._revision === 5) {
            throw new Error("Not implemented yet");
        }
        else if (this._revision === 6) {
            throw new Error("Not implemented yet");
        }
    }
    computeOHashEncryptionKey_R2R3R4(password) {
        const paddedPassword = this.padPassword32(password);
        let hash = md5(paddedPassword);
        if (this._revision >= 3) {
            for (let i = 0; i < 50; i++) {
                hash = md5(hash);
            }
        }
        const hashArray = wordArrayToBytes(hash);
        const keyLength = this._keyLength >> 3;
        return hashArray.slice(0, keyLength);
    }
    computeOHash_R2R3R4(oPassword, uPassword) {
        const key = this.computeOHashEncryptionKey_R2R3R4(oPassword || uPassword);
        const paddedUPassword = this.padPassword32(uPassword);
        let hash = rc4(paddedUPassword, key);
        if (this._revision >= 3) {
            for (let i = 1; i < 20; i++) {
                hash = rc4(hash, xorBytes(key, i));
            }
        }
        return wordArrayToBytes(hash);
    }
    computeUHash_R2(password) {
        const key = this.computeEncryptionKey(password);
        const padding = new Uint8Array(PASSWORD_32_PADDING);
        const u = wordArrayToBytes(rc4(padding, key));
        return u;
    }
    computeUHash_R3R4(password) {
        const key = this.computeEncryptionKey(password);
        const dataToHash = new Uint8Array([
            ...PASSWORD_32_PADDING,
            ...this._fileId,
        ]);
        let hash = md5(dataToHash);
        hash = rc4(hash, key);
        for (let i = 1; i < 20; i++) {
            hash = rc4(hash, xorBytes(key, i));
        }
        return wordArrayToBytes(hash);
    }
    authOwnerPassword(password) {
        if ([2, 3, 4].includes(this._revision)) {
            const ownerEncryptionKey = this.computeOHashEncryptionKey_R2R3R4(password);
            let userPasswordPadded;
            if (this._revision === 2) {
                userPasswordPadded = wordArrayToBytes(rc4(this._oPasswordHash, ownerEncryptionKey));
            }
            else {
                let hash = toWordArray(this._oPasswordHash);
                for (let i = 19; i >= 0; i--) {
                    hash = rc4(hash, xorBytes(ownerEncryptionKey, i));
                }
                userPasswordPadded = wordArrayToBytes(hash);
            }
            const j = findSubarrayIndex(userPasswordPadded, new Uint8Array(PASSWORD_32_PADDING));
            const userPassword = new TextDecoder().decode(j === -1
                ? userPasswordPadded
                : userPasswordPadded.subarray(0, j));
            return this.authUserPassword(userPassword);
        }
        else if (this._revision === 5) {
            throw new Error("Not implemented yet");
        }
        else if (this._revision === 6) {
            throw new Error("Not implemented yet");
        }
    }
    authUserPassword(password) {
        let u;
        if (this._revision === 2) {
            u = this.computeUHash_R2(password);
            return arraysEqual(this._uPasswordHash, u);
        }
        else if (this._revision === 3 || this._revision === 4) {
            u = this.computeUHash_R3R4(password);
            return arraysEqual(this._uPasswordHash.subarray(0, 16), u);
        }
        else if (this._revision === 5) {
            throw new Error("Not implemented yet");
        }
        else if (this._revision === 6) {
            throw new Error("Not implemented yet");
        }
    }
}

class LiteralString {
    constructor(literal, bytes) {
        this.literal = literal;
        this.bytes = bytes;
    }
    static parse(parser, start, cryptInfo = null, skipEmpty = true) {
        const bounds = parser.getLiteralBounds(start, skipEmpty);
        if (!bounds) {
            return;
        }
        let bytes = LiteralString.unescape(parser.subCharCodes(bounds.start + 1, bounds.end - 1));
        if ((cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.stringCryptor) {
            bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
        }
        const result = LiteralString.fromBytes(bytes);
        return { value: result, start: bounds.start, end: bounds.end };
    }
    static fromBytes(bytes) {
        const decoder = bytes[0] === 254 && bytes[1] === 255
            ? new TextDecoder("utf-16be")
            : new TextDecoder();
        const literal = decoder.decode(bytes);
        return new LiteralString(literal, bytes);
    }
    static fromString(source) {
        const bytes = [];
        bytes.push(254, 255);
        for (let i = 0; i < source.length; i++) {
            const charCode = source.charCodeAt(i);
            bytes.push((charCode & 0xFF00) >>> 8);
            bytes.push(charCode & 0xFF);
        }
        return new LiteralString(source, new Uint8Array(bytes));
    }
    static escape(bytes) {
        const result = [];
        for (let i = 0; i < bytes.length; i++) {
            switch (bytes[i]) {
                case codes.LINE_FEED:
                    result.push(codes.BACKSLASH);
                    result.push(codes.n);
                    break;
                case codes.CARRIAGE_RETURN:
                    result.push(codes.BACKSLASH);
                    result.push(codes.r);
                    break;
                case codes.HORIZONTAL_TAB:
                    result.push(codes.BACKSLASH);
                    result.push(codes.t);
                    break;
                case codes.BACKSPACE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.b);
                    break;
                case codes.FORM_FEED:
                    result.push(codes.BACKSLASH);
                    result.push(codes.f);
                    break;
                case codes.L_PARENTHESE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.L_PARENTHESE);
                    break;
                case codes.R_PARENTHESE:
                    result.push(codes.BACKSLASH);
                    result.push(codes.R_PARENTHESE);
                    break;
                case codes.BACKSLASH:
                    result.push(codes.BACKSLASH);
                    result.push(codes.BACKSLASH);
                    break;
                default:
                    result.push(bytes[i]);
                    break;
            }
        }
        return new Uint8Array(result);
    }
    static unescape(bytes) {
        const result = [];
        let escaped = false;
        for (let i = 0; i < bytes.length; i++) {
            if (escaped) {
                switch (bytes[i]) {
                    case codes.n:
                        result.push(codes.LINE_FEED);
                        break;
                    case codes.r:
                        result.push(codes.CARRIAGE_RETURN);
                        break;
                    case codes.t:
                        result.push(codes.HORIZONTAL_TAB);
                        break;
                    case codes.b:
                        result.push(codes.BACKSPACE);
                        break;
                    case codes.f:
                        result.push(codes.FORM_FEED);
                        break;
                    case codes.L_PARENTHESE:
                        result.push(codes.L_PARENTHESE);
                        break;
                    case codes.R_PARENTHESE:
                        result.push(codes.R_PARENTHESE);
                        break;
                    case codes.BACKSLASH:
                        result.push(codes.BACKSLASH);
                        break;
                    default:
                        result.push(bytes[i]);
                        break;
                }
                escaped = false;
                continue;
            }
            if (bytes[i] === codes.BACKSLASH) {
                escaped = true;
                continue;
            }
            result.push(bytes[i]);
        }
        return new Uint8Array(result);
    }
    toArray(cryptInfo) {
        const bytes = (cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.stringCryptor
            ? cryptInfo.stringCryptor.encrypt(this.bytes, cryptInfo.ref)
            : this.bytes;
        return new Uint8Array([
            ...keywordCodes.STR_LITERAL_START,
            ...LiteralString.escape(bytes),
            ...keywordCodes.STR_LITERAL_END,
        ]);
    }
}

class DateString {
    constructor(source, date) {
        this.source = source;
        this.date = date;
    }
    static parse(parser, start, cryptInfo = null, skipEmpty = true) {
        if (skipEmpty) {
            start = parser.skipEmpty(start);
        }
        if (parser.isOutside(start) || parser.getCharCode(start) !== codes.L_PARENTHESE) {
            return null;
        }
        const end = parser.findCharIndex(codes.R_PARENTHESE, "straight", start);
        if (end === -1) {
            return null;
        }
        let bytes = parser.subCharCodes(start + 1, end - 1);
        if ((cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.stringCryptor) {
            bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
        }
        try {
            const date = DateString.fromArray(bytes);
            return { value: date, start, end };
        }
        catch (_a) {
            return null;
        }
    }
    static fromDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        const source = `D:${year}${month}${day}${hours}${minutes}${seconds}`;
        return new DateString(source, date);
    }
    static fromString(source) {
        const result = /D:(?<Y>\d{4})(?<M>\d{2})(?<D>\d{2})(?<h>\d{2})(?<m>\d{2})(?<s>\d{2})/.exec(source);
        const date = new Date(+result.groups.Y, +result.groups.M - 1, +result.groups.D, +result.groups.h, +result.groups.m, +result.groups.s);
        return new DateString(source, date);
    }
    static fromArray(arr) {
        const source = new TextDecoder().decode(arr);
        return DateString.fromString(source);
    }
    toArray(cryptInfo) {
        let bytes = new TextEncoder().encode(this.source);
        if ((cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.stringCryptor) {
            bytes = cryptInfo.stringCryptor.encrypt(bytes, cryptInfo.ref);
        }
        return new Uint8Array([
            ...keywordCodes.STR_LITERAL_START,
            ...bytes,
            ...keywordCodes.STR_LITERAL_END,
        ]);
    }
}

class ObjectId {
    constructor(id, generation) {
        this.id = id !== null && id !== void 0 ? id : 0;
        this.generation = generation !== null && generation !== void 0 ? generation : 0;
    }
    static parse(parser, start, skipEmpty = true) {
        if (skipEmpty) {
            start = parser.findRegularIndex("straight", start);
        }
        if (start < 0 || start > parser.maxIndex) {
            return null;
        }
        const id = parser.parseNumberAt(start, false, false);
        if (!id || isNaN(id.value)) {
            return null;
        }
        const generation = parser.parseNumberAt(id.end + 2, false, false);
        if (!generation || isNaN(generation.value)) {
            return null;
        }
        return {
            value: new ObjectId(id.value, generation.value),
            start,
            end: generation.end,
        };
    }
    static parseRef(parser, start, skipEmpty = true) {
        const id = ObjectId.parse(parser, start, skipEmpty);
        if (!id) {
            return null;
        }
        const rIndexSupposed = id.end + 2;
        const rIndex = parser.findSubarrayIndex([codes.R], { minIndex: rIndexSupposed, closedOnly: true });
        if (!rIndex || rIndex.start !== rIndexSupposed) {
            return null;
        }
        return {
            value: id.value,
            start: id.start,
            end: rIndex.end,
        };
    }
    static parseRefArray(parser, start, skipEmpty = true) {
        const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const ids = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = ObjectId.parseRef(parser, i, true);
            if (!current) {
                break;
            }
            ids.push(current.value);
            i = current.end + 1;
        }
        return { value: ids, start: arrayBounds.start, end: arrayBounds.end };
    }
    equals(other) {
        return this.id === other.id
            && this.generation === other.generation;
    }
    toArray(cryptInfo) {
        return new TextEncoder().encode(`${this.id} ${this.generation} R`);
    }
    toString() {
        return this.id + "|" + this.generation;
    }
}

class PdfObject {
    constructor() {
    }
    get ref() {
        return this._ref;
    }
    get id() {
        var _a;
        return (_a = this._ref) === null || _a === void 0 ? void 0 : _a.id;
    }
    get generation() {
        var _a;
        return (_a = this._ref) === null || _a === void 0 ? void 0 : _a.generation;
    }
}

class PdfDict extends PdfObject {
    constructor(type) {
        super();
        this.Type = type;
    }
    get streamId() {
        return this._streamId;
    }
    toArray(cryptInfo) {
        const encoder = new TextEncoder();
        const bytes = [...keywordCodes.DICT_START];
        if (this.Type) {
            bytes.push(...keywordCodes.TYPE, ...encoder.encode(this.Type));
        }
        bytes.push(...keywordCodes.DICT_END);
        return new Uint8Array(bytes);
    }
    tryParseProps(parseInfo) {
        var _a;
        if (!parseInfo) {
            return false;
        }
        this._ref = (_a = parseInfo.cryptInfo) === null || _a === void 0 ? void 0 : _a.ref;
        this._streamId = parseInfo.streamId;
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Type":
                        const type = parser.parseNameAt(i);
                        if (type) {
                            if (this.Type && this.Type !== type.value) {
                                return false;
                            }
                            return true;
                        }
                        throw new Error("Can't parse /Type property value");
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class DecodeParamsDict extends PdfDict {
    constructor() {
        super(dictTypes.EMPTY);
        this._intPropMap = new Map();
        this._boolPropMap = new Map();
        this._namePropMap = new Map();
        this._refPropMap = new Map();
    }
    static parse(parseInfo) {
        const dict = new DecodeParamsDict();
        const parseResult = dict.tryParseProps(parseInfo);
        return parseResult
            ? { value: dict, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    static parseArray(parser, start, cryptInfo = null, skipEmpty = true) {
        const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const paramsDicts = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            const paramsBounds = parser.getDictBoundsAt(i);
            current = DecodeParamsDict.parse({ parser, bounds: paramsBounds, cryptInfo });
            if (!current) {
                break;
            }
            paramsDicts.push(current.value);
            i = current.end + 1;
        }
        return { value: paramsDicts, start: arrayBounds.start, end: arrayBounds.end };
    }
    getIntProp(name) {
        return this._intPropMap.get(name);
    }
    getBoolProp(name) {
        return this._boolPropMap.get(name);
    }
    getNameProp(name) {
        return this._namePropMap.get(name);
    }
    getRefProp(name) {
        return this._refPropMap.get(name);
    }
    setIntProp(name, value) {
        return this._intPropMap.set(name, value);
    }
    setBoolProp(name, value) {
        return this._boolPropMap.set(name, value);
    }
    setNameProp(name, value) {
        return this._namePropMap.set(name, value);
    }
    setRefProp(name, value) {
        return this._refPropMap.set(name, value);
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        this._intPropMap.forEach((v, k) => bytes.push(...encoder.encode(k), ...encoder.encode(" " + v)));
        this._boolPropMap.forEach((v, k) => bytes.push(...encoder.encode(k), ...encoder.encode(" " + v)));
        this._namePropMap.forEach((v, k) => bytes.push(...encoder.encode(k), ...encoder.encode(v)));
        this._refPropMap.forEach((v, k) => bytes.push(...encoder.encode(k), ...v.toArray(cryptInfo)));
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                const valueType = parser.getValueTypeAt(i);
                switch (valueType) {
                    case valueTypes.NUMBER:
                        const intValue = parser.parseNumberAt(i, false);
                        if (intValue) {
                            this._intPropMap.set(name, intValue.value);
                            i = intValue.end + 1;
                            continue;
                        }
                        break;
                    case valueTypes.BOOLEAN:
                        const boolValue = parser.parseBoolAt(i);
                        if (boolValue) {
                            this._boolPropMap.set(name, boolValue.value);
                            i = boolValue.end + 1;
                            continue;
                        }
                        break;
                    case valueTypes.NAME:
                        const nameValue = parser.parseNameAt(i);
                        if (nameValue) {
                            this._namePropMap.set(name, nameValue.value);
                            i = nameValue.end + 1;
                            continue;
                        }
                        break;
                    case valueTypes.REF:
                        const refValue = ObjectId.parseRef(parser, i);
                        if (refValue) {
                            this._refPropMap.set(name, refValue.value);
                            i = refValue.end + 1;
                            continue;
                        }
                        break;
                }
                i = parser.skipToNextName(i, end - 1);
            }
            else {
                break;
            }
        }
        return true;
    }
}

class DecodedStream {
    constructor(encodedStream) {
        this._minBufferLength = 512;
        this._bufferLength = 0;
        this._current = 0;
        this._ended = false;
        this._sourceStream = encodedStream;
    }
    get length() {
        return this._buffer.length;
    }
    ensureBuffer(size) {
        const buffer = this._buffer;
        if (buffer && size <= buffer.byteLength) {
            return buffer;
        }
        let length = this._minBufferLength;
        while (length < size) {
            length *= 2;
        }
        const enlargedBuffer = new Uint8Array(length);
        if (buffer) {
            enlargedBuffer.set(buffer);
        }
        return (this._buffer = enlargedBuffer);
    }
    takeByte() {
        const current = this._current;
        while (this._bufferLength <= current) {
            if (this._ended) {
                return -1;
            }
            this._readBlock();
        }
        return this._buffer[this._current++];
    }
    takeBytes(length) {
        let end;
        const position = this._current;
        if (length) {
            this.ensureBuffer(position + length);
            end = position + length;
            while (!this._ended && this._bufferLength < end) {
                this._readBlock();
            }
            if (end > this._bufferLength) {
                end = this._bufferLength;
            }
        }
        else {
            while (!this._ended) {
                this._readBlock();
            }
            end = this._bufferLength;
        }
        this._current = end;
        const subarray = this._buffer.subarray(position, end);
        return subarray;
    }
    takeUint16() {
        const byte_0 = this.takeByte();
        const byte_1 = this.takeByte();
        if (byte_0 === -1 || byte_1 === -1) {
            return -1;
        }
        return (byte_0 << 8) + byte_1;
    }
    takeInt32() {
        const byte_0 = this.takeByte();
        const byte_1 = this.takeByte();
        const byte_2 = this.takeByte();
        const byte_3 = this.takeByte();
        return (byte_0 << 24) + (byte_1 << 16) + (byte_2 << 8) + byte_3;
    }
    peekByte() {
        const peekedByte = this.takeByte();
        if (peekedByte !== -1) {
            this._current--;
        }
        return peekedByte;
    }
    peekBytes(length) {
        const bytes = this.takeBytes(length);
        this._current -= bytes.length;
        return bytes;
    }
    skip(n) {
        this._current += n || 1;
    }
    reset() {
        this._current = 0;
    }
}

class FlateStream extends DecodedStream {
    constructor(encodedStream) {
        super(encodedStream);
        this._codeSize = 0;
        this._codeBuf = 0;
        const cmf = encodedStream.takeByte();
        const flg = encodedStream.takeByte();
        if (cmf === -1 || flg === -1) {
            throw new Error(`Invalid header in flate stream: ${cmf}, ${flg}`);
        }
        if ((cmf & 0x0f) !== 0x08) {
            throw new Error(`Unknown compression method in flate stream: ${cmf}, ${flg}`);
        }
        if (((cmf << 8) + flg) % 31 !== 0) {
            throw new Error(`Bad FCHECK in flate stream: ${cmf}, ${flg}`);
        }
        if (flg & 0x20) {
            throw new Error(`FDICT bit set in flate stream: ${cmf}, ${flg}`);
        }
        this._codeSize = 0;
        this._codeBuf = 0;
    }
    _readBlock() {
        let buffer;
        let len;
        const str = this._sourceStream;
        let header = this.getBits(3);
        if (header & 1) {
            this._ended = true;
        }
        header >>= 1;
        if (header === 0) {
            let b;
            if ((b = str.takeByte()) === -1) {
                throw new Error("Bad block header in flate stream");
            }
            let blockLen = b;
            if ((b = str.takeByte()) === -1) {
                throw new Error("Bad block header in flate stream");
            }
            blockLen |= b << 8;
            if ((b = str.takeByte()) === -1) {
                throw new Error("Bad block header in flate stream");
            }
            let check = b;
            if ((b = str.takeByte()) === -1) {
                throw new Error("Bad block header in flate stream");
            }
            check |= b << 8;
            if (check !== (~blockLen & 0xffff) && (blockLen !== 0 || check !== 0)) {
                throw new Error("Bad uncompressed block length in flate stream");
            }
            this._codeBuf = 0;
            this._codeSize = 0;
            const bufferLength = this._bufferLength, end = bufferLength + blockLen;
            buffer = this.ensureBuffer(end);
            this._bufferLength = end;
            if (blockLen === 0) {
                if (str.peekByte() === -1) {
                    this._ended = true;
                }
            }
            else {
                const block = str.takeBytes(blockLen);
                buffer.set(block, bufferLength);
                if (block.length < blockLen) {
                    this._ended = true;
                }
            }
            return;
        }
        let litCodeTable;
        let distCodeTable;
        if (header === 1) {
            litCodeTable = FlateStream.fixedLitCodeTab;
            distCodeTable = FlateStream.fixedDistCodeTab;
        }
        else if (header === 2) {
            const numLitCodes = this.getBits(5) + 257;
            const numDistCodes = this.getBits(5) + 1;
            const numCodeLenCodes = this.getBits(4) + 4;
            const codeLenCodeLengths = new Uint8Array(FlateStream.codeLenCodeMap.length);
            let i;
            for (i = 0; i < numCodeLenCodes; i++) {
                codeLenCodeLengths[FlateStream.codeLenCodeMap[i]] = this.getBits(3);
            }
            const codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths);
            len = 0;
            i = 0;
            const codes = numLitCodes + numDistCodes;
            const codeLengths = new Uint8Array(codes);
            let bitsLength;
            let bitsOffset;
            let what;
            while (i < codes) {
                const code = this.getCode(codeLenCodeTab);
                if (code === 16) {
                    bitsLength = 2;
                    bitsOffset = 3;
                    what = len;
                }
                else if (code === 17) {
                    bitsLength = 3;
                    bitsOffset = 3;
                    what = len = 0;
                }
                else if (code === 18) {
                    bitsLength = 7;
                    bitsOffset = 11;
                    what = len = 0;
                }
                else {
                    codeLengths[i++] = len = code;
                    continue;
                }
                let repeatLength = this.getBits(bitsLength) + bitsOffset;
                while (repeatLength-- > 0) {
                    codeLengths[i++] = what;
                }
            }
            litCodeTable = this.generateHuffmanTable(codeLengths.subarray(0, numLitCodes));
            distCodeTable = this.generateHuffmanTable(codeLengths.subarray(numLitCodes, codes));
        }
        else {
            throw new Error("Unknown block type in flate stream");
        }
        buffer = this._buffer;
        let limit = buffer ? buffer.length : 0;
        let pos = this._bufferLength;
        while (true) {
            let code1 = this.getCode(litCodeTable);
            if (code1 < 256) {
                if (pos + 1 >= limit) {
                    buffer = this.ensureBuffer(pos + 1);
                    limit = buffer.length;
                }
                buffer[pos++] = code1;
                continue;
            }
            if (code1 === 256) {
                this._bufferLength = pos;
                return;
            }
            code1 -= 257;
            code1 = FlateStream.lengthDecode[code1];
            let code2 = code1 >> 16;
            if (code2 > 0) {
                code2 = this.getBits(code2);
            }
            len = (code1 & 0xffff) + code2;
            code1 = this.getCode(distCodeTable);
            code1 = FlateStream.distDecode[code1];
            code2 = code1 >> 16;
            if (code2 > 0) {
                code2 = this.getBits(code2);
            }
            const dist = (code1 & 0xffff) + code2;
            if (pos + len >= limit) {
                buffer = this.ensureBuffer(pos + len);
                limit = buffer.length;
            }
            for (let k = 0; k < len; ++k, ++pos) {
                buffer[pos] = buffer[pos - dist];
            }
        }
    }
    ;
    getBits(n) {
        const stream = this._sourceStream;
        let size = this._codeSize;
        let buf = this._codeBuf;
        let value;
        while (size < n) {
            if ((value = stream.takeByte()) === -1) {
                throw new Error("Bad encoding in flate stream");
            }
            buf |= value << size;
            size += 8;
        }
        value = buf & ((1 << n) - 1);
        this._codeBuf = buf >> n;
        this._codeSize = size -= n;
        return value;
    }
    ;
    getCode(table) {
        const stream = this._sourceStream;
        const [codes, maxLength] = table;
        let size = this._codeSize;
        let buf = this._codeBuf;
        let value;
        while (size < maxLength) {
            if ((value = stream.takeByte()) === -1) {
                break;
            }
            buf |= value << size;
            size += 8;
        }
        const code = codes[buf & ((1 << maxLength) - 1)];
        const codeLen = code >> 16;
        const codeVal = code & 0xffff;
        if (codeLen < 1 || size < codeLen) {
            throw new Error("Bad encoding in flate stream");
        }
        this._codeBuf = buf >> codeLen;
        this._codeSize = size - codeLen;
        return codeVal;
    }
    ;
    generateHuffmanTable(lengths) {
        const n = lengths.length;
        let maxLength = 0;
        let i;
        for (i = 0; i < n; i++) {
            if (lengths[i] > maxLength) {
                maxLength = lengths[i];
            }
        }
        const size = 1 << maxLength;
        const codes = new Int32Array(size);
        for (let length = 1, code = 0, skip = 2; length <= maxLength; length++, code <<= 1, skip <<= 1) {
            for (let value = 0; value < n; value++) {
                if (lengths[value] === length) {
                    let code2 = 0;
                    let t = code;
                    for (i = 0; i < length; i++) {
                        code2 = (code2 << 1) | (t & 1);
                        t >>= 1;
                    }
                    for (i = code2; i < size; i += skip) {
                        codes[i] = (length << 16) | value;
                    }
                    code++;
                }
            }
        }
        return [codes, maxLength];
    }
    ;
}
FlateStream.codeLenCodeMap = new Int32Array([
    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15
]);
FlateStream.lengthDecode = new Int32Array([
    0x00003, 0x00004, 0x00005, 0x00006, 0x00007, 0x00008, 0x00009, 0x0000a,
    0x1000b, 0x1000d, 0x1000f, 0x10011, 0x20013, 0x20017, 0x2001b, 0x2001f,
    0x30023, 0x3002b, 0x30033, 0x3003b, 0x40043, 0x40053, 0x40063, 0x40073,
    0x50083, 0x500a3, 0x500c3, 0x500e3, 0x00102, 0x00102, 0x00102
]);
FlateStream.distDecode = new Int32Array([
    0x00001, 0x00002, 0x00003, 0x00004, 0x10005, 0x10007, 0x20009, 0x2000d,
    0x30011, 0x30019, 0x40021, 0x40031, 0x50041, 0x50061, 0x60081, 0x600c1,
    0x70101, 0x70181, 0x80201, 0x80301, 0x90401, 0x90601, 0xa0801, 0xa0c01,
    0xb1001, 0xb1801, 0xc2001, 0xc3001, 0xd4001, 0xd6001
]);
FlateStream.fixedLitCodeTab = [new Int32Array([
        0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c0,
        0x70108, 0x80060, 0x80020, 0x900a0, 0x80000, 0x80080, 0x80040, 0x900e0,
        0x70104, 0x80058, 0x80018, 0x90090, 0x70114, 0x80078, 0x80038, 0x900d0,
        0x7010c, 0x80068, 0x80028, 0x900b0, 0x80008, 0x80088, 0x80048, 0x900f0,
        0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c8,
        0x7010a, 0x80064, 0x80024, 0x900a8, 0x80004, 0x80084, 0x80044, 0x900e8,
        0x70106, 0x8005c, 0x8001c, 0x90098, 0x70116, 0x8007c, 0x8003c, 0x900d8,
        0x7010e, 0x8006c, 0x8002c, 0x900b8, 0x8000c, 0x8008c, 0x8004c, 0x900f8,
        0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c4,
        0x70109, 0x80062, 0x80022, 0x900a4, 0x80002, 0x80082, 0x80042, 0x900e4,
        0x70105, 0x8005a, 0x8001a, 0x90094, 0x70115, 0x8007a, 0x8003a, 0x900d4,
        0x7010d, 0x8006a, 0x8002a, 0x900b4, 0x8000a, 0x8008a, 0x8004a, 0x900f4,
        0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cc,
        0x7010b, 0x80066, 0x80026, 0x900ac, 0x80006, 0x80086, 0x80046, 0x900ec,
        0x70107, 0x8005e, 0x8001e, 0x9009c, 0x70117, 0x8007e, 0x8003e, 0x900dc,
        0x7010f, 0x8006e, 0x8002e, 0x900bc, 0x8000e, 0x8008e, 0x8004e, 0x900fc,
        0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c2,
        0x70108, 0x80061, 0x80021, 0x900a2, 0x80001, 0x80081, 0x80041, 0x900e2,
        0x70104, 0x80059, 0x80019, 0x90092, 0x70114, 0x80079, 0x80039, 0x900d2,
        0x7010c, 0x80069, 0x80029, 0x900b2, 0x80009, 0x80089, 0x80049, 0x900f2,
        0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900ca,
        0x7010a, 0x80065, 0x80025, 0x900aa, 0x80005, 0x80085, 0x80045, 0x900ea,
        0x70106, 0x8005d, 0x8001d, 0x9009a, 0x70116, 0x8007d, 0x8003d, 0x900da,
        0x7010e, 0x8006d, 0x8002d, 0x900ba, 0x8000d, 0x8008d, 0x8004d, 0x900fa,
        0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c6,
        0x70109, 0x80063, 0x80023, 0x900a6, 0x80003, 0x80083, 0x80043, 0x900e6,
        0x70105, 0x8005b, 0x8001b, 0x90096, 0x70115, 0x8007b, 0x8003b, 0x900d6,
        0x7010d, 0x8006b, 0x8002b, 0x900b6, 0x8000b, 0x8008b, 0x8004b, 0x900f6,
        0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900ce,
        0x7010b, 0x80067, 0x80027, 0x900ae, 0x80007, 0x80087, 0x80047, 0x900ee,
        0x70107, 0x8005f, 0x8001f, 0x9009e, 0x70117, 0x8007f, 0x8003f, 0x900de,
        0x7010f, 0x8006f, 0x8002f, 0x900be, 0x8000f, 0x8008f, 0x8004f, 0x900fe,
        0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c1,
        0x70108, 0x80060, 0x80020, 0x900a1, 0x80000, 0x80080, 0x80040, 0x900e1,
        0x70104, 0x80058, 0x80018, 0x90091, 0x70114, 0x80078, 0x80038, 0x900d1,
        0x7010c, 0x80068, 0x80028, 0x900b1, 0x80008, 0x80088, 0x80048, 0x900f1,
        0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c9,
        0x7010a, 0x80064, 0x80024, 0x900a9, 0x80004, 0x80084, 0x80044, 0x900e9,
        0x70106, 0x8005c, 0x8001c, 0x90099, 0x70116, 0x8007c, 0x8003c, 0x900d9,
        0x7010e, 0x8006c, 0x8002c, 0x900b9, 0x8000c, 0x8008c, 0x8004c, 0x900f9,
        0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c5,
        0x70109, 0x80062, 0x80022, 0x900a5, 0x80002, 0x80082, 0x80042, 0x900e5,
        0x70105, 0x8005a, 0x8001a, 0x90095, 0x70115, 0x8007a, 0x8003a, 0x900d5,
        0x7010d, 0x8006a, 0x8002a, 0x900b5, 0x8000a, 0x8008a, 0x8004a, 0x900f5,
        0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cd,
        0x7010b, 0x80066, 0x80026, 0x900ad, 0x80006, 0x80086, 0x80046, 0x900ed,
        0x70107, 0x8005e, 0x8001e, 0x9009d, 0x70117, 0x8007e, 0x8003e, 0x900dd,
        0x7010f, 0x8006e, 0x8002e, 0x900bd, 0x8000e, 0x8008e, 0x8004e, 0x900fd,
        0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c3,
        0x70108, 0x80061, 0x80021, 0x900a3, 0x80001, 0x80081, 0x80041, 0x900e3,
        0x70104, 0x80059, 0x80019, 0x90093, 0x70114, 0x80079, 0x80039, 0x900d3,
        0x7010c, 0x80069, 0x80029, 0x900b3, 0x80009, 0x80089, 0x80049, 0x900f3,
        0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900cb,
        0x7010a, 0x80065, 0x80025, 0x900ab, 0x80005, 0x80085, 0x80045, 0x900eb,
        0x70106, 0x8005d, 0x8001d, 0x9009b, 0x70116, 0x8007d, 0x8003d, 0x900db,
        0x7010e, 0x8006d, 0x8002d, 0x900bb, 0x8000d, 0x8008d, 0x8004d, 0x900fb,
        0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c7,
        0x70109, 0x80063, 0x80023, 0x900a7, 0x80003, 0x80083, 0x80043, 0x900e7,
        0x70105, 0x8005b, 0x8001b, 0x90097, 0x70115, 0x8007b, 0x8003b, 0x900d7,
        0x7010d, 0x8006b, 0x8002b, 0x900b7, 0x8000b, 0x8008b, 0x8004b, 0x900f7,
        0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900cf,
        0x7010b, 0x80067, 0x80027, 0x900af, 0x80007, 0x80087, 0x80047, 0x900ef,
        0x70107, 0x8005f, 0x8001f, 0x9009f, 0x70117, 0x8007f, 0x8003f, 0x900df,
        0x7010f, 0x8006f, 0x8002f, 0x900bf, 0x8000f, 0x8008f, 0x8004f, 0x900ff
    ]), 9];
FlateStream.fixedDistCodeTab = [new Int32Array([
        0x50000, 0x50010, 0x50008, 0x50018, 0x50004, 0x50014, 0x5000c, 0x5001c,
        0x50002, 0x50012, 0x5000a, 0x5001a, 0x50006, 0x50016, 0x5000e, 0x00000,
        0x50001, 0x50011, 0x50009, 0x50019, 0x50005, 0x50015, 0x5000d, 0x5001d,
        0x50003, 0x50013, 0x5000b, 0x5001b, 0x50007, 0x50017, 0x5000f, 0x00000
    ]), 5];

class Stream {
    constructor(bytes, start = 0, length) {
        if (length && length < 0) {
            throw new Error("Stream length can't be negative");
        }
        this._bytes = bytes instanceof Uint8Array
            ? bytes
            : new Uint8Array(bytes);
        this._start = start;
        this._current = start;
        this._end = start + length || bytes.length;
    }
    get length() {
        return this._end - this._start;
    }
    takeByte() {
        if (this._current >= this._end) {
            return -1;
        }
        return this._bytes[this._current++];
    }
    takeBytes(length) {
        const bytes = this._bytes;
        const position = this._current;
        const bytesEnd = this._end;
        if (!length) {
            const subarray = bytes.subarray(position, bytesEnd);
            return subarray;
        }
        else {
            let end = position + length;
            if (end > bytesEnd) {
                end = bytesEnd;
            }
            this._current = end;
            const subarray = bytes.subarray(position, end);
            return subarray;
        }
    }
    takeUint16() {
        const b0 = this.takeByte();
        const b1 = this.takeByte();
        if (b0 === -1 || b1 === -1) {
            return -1;
        }
        return (b0 << 8) + b1;
    }
    takeInt32() {
        const b0 = this.takeByte();
        const b1 = this.takeByte();
        const b2 = this.takeByte();
        const b3 = this.takeByte();
        return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
    }
    peekByte() {
        const peekedByte = this.takeByte();
        if (peekedByte !== -1) {
            this._current--;
        }
        return peekedByte;
    }
    peekBytes(length) {
        const bytes = this.takeBytes(length);
        this._current -= bytes.length;
        return bytes;
    }
    getByte(index) {
        return this._bytes[index];
    }
    getByteRange(start, end) {
        return this._bytes.subarray(Math.max(start, 0), Math.min(end, this._end));
    }
    skip(n) {
        this._current += n || 1;
    }
    reset() {
        this._current = this._start;
    }
}

class FlateDecoder {
    static Decode(input, predictor = flatePredictors.NONE, columns = 1, components = 1, bpc = 8) {
        const stream = new Stream(input, 0, input.length);
        const flate = new FlateStream(stream);
        const inflated = flate.takeBytes(null);
        switch (predictor) {
            case (flatePredictors.NONE):
                return inflated;
            case (flatePredictors.PNG_NONE):
            case (flatePredictors.PNG_SUB):
            case (flatePredictors.PNG_UP):
            case (flatePredictors.PNG_AVERAGE):
            case (flatePredictors.PNG_PAETH):
            case (flatePredictors.PNG_OPTIMUM):
                const unfiltered = FlateDecoder.removePngFilter(inflated, columns, components, bpc);
                return unfiltered;
            case (flatePredictors.TIFF):
                throw new Error("Unsupported filter predictor");
        }
    }
    static Encode(input, predictor = flatePredictors.PNG_UP, columns = 5, components = 1, bpc = 8) {
        let filtered;
        switch (predictor) {
            case (flatePredictors.NONE):
                filtered = input;
                break;
            case (flatePredictors.PNG_NONE):
            case (flatePredictors.PNG_SUB):
            case (flatePredictors.PNG_UP):
            case (flatePredictors.PNG_AVERAGE):
            case (flatePredictors.PNG_PAETH):
            case (flatePredictors.PNG_OPTIMUM):
                filtered = FlateDecoder.applyPngFilter(input, predictor, columns, components, bpc);
                break;
            case (flatePredictors.TIFF):
                throw new Error("Unsupported filter predictor");
        }
        const deflated = Pako.deflate(filtered);
        return deflated;
    }
    static removePngFilter(input, columns, components, bpc) {
        const interval = Math.ceil(components * bpc / 8);
        const lineLen = columns * interval;
        const lineLen_filtered = lineLen + 1;
        if (!!(input.length % lineLen_filtered)) {
            throw new Error("Data length doesn't match filter columns");
        }
        const output = new Uint8Array(input.length / lineLen_filtered * lineLen);
        const previous = new Array(lineLen).fill(0);
        const current = new Array(lineLen).fill(0);
        const getLeft = (j) => j - interval < 0
            ? 0
            : current[j - interval];
        const getAbove = (j) => previous[j];
        const getUpperLeft = (j) => j - interval < 0
            ? 0
            : previous[j - interval];
        let x = 0;
        let y = 0;
        let k = 0;
        let rowStart = 0;
        let filterType = 0;
        let result = 0;
        for (let i = 0; i < input.length; i++) {
            if (i % lineLen_filtered === 0) {
                filterType = input[i];
                x = 0;
                if (i) {
                    for (k = 0; k < lineLen; k++) {
                        previous[k] = output[rowStart + k];
                    }
                }
                rowStart = y;
            }
            else {
                current[x] = input[i];
                switch (filterType) {
                    case 0:
                        result = current[x];
                        break;
                    case 1:
                        result = (current[x] + getLeft(x)) % 256;
                        break;
                    case 2:
                        result = (current[x] + getAbove(x)) % 256;
                        break;
                    case 3:
                        result = (current[x] + Math.floor((getAbove(x) + getLeft(x)) / 2)) % 256;
                        break;
                    case 4:
                        result = (current[x] + this.paethPredictor(getLeft(x), getAbove(x), getUpperLeft(x))) % 256;
                        break;
                }
                output[y++] = result;
                x++;
            }
        }
        return output;
    }
    static applyPngFilter(input, predictor = 12, columns = 5, components = 1, bpc = 8) {
        let filterType;
        switch (predictor) {
            case flatePredictors.PNG_NONE:
                filterType = 0;
                break;
            case flatePredictors.PNG_SUB:
                filterType = 1;
                break;
            case flatePredictors.PNG_UP:
                filterType = 2;
                break;
            case flatePredictors.PNG_AVERAGE:
                filterType = 3;
                break;
            case flatePredictors.PNG_PAETH:
                filterType = 4;
                break;
            default:
                throw new Error("Invalid PNG filter type");
        }
        const interval = Math.ceil(components * bpc / 8);
        const lineLen = columns * interval;
        const lineLen_filtered = lineLen + 1;
        const lineCount = Math.ceil(input.length / lineLen);
        const lenFiltered = lineCount * lineLen_filtered;
        const output = new Uint8Array(lenFiltered);
        const previous = new Array(lineLen).fill(0);
        const current = new Array(lineLen).fill(0);
        const getLeft = (j) => j - interval < 0
            ? 0
            : current[j - interval];
        const getAbove = (j) => previous[j];
        const getUpperLeft = (j) => j - interval < 0
            ? 0
            : previous[j - interval];
        let x = 0;
        let y = 0;
        let k = 0;
        let rowStart = 0;
        let result = 0;
        for (let i = 0; i < lenFiltered; i++) {
            if (i % lineLen_filtered === 0) {
                x = 0;
                if (i) {
                    for (k = 0; k < lineLen; k++) {
                        previous[k] = input[rowStart + k];
                    }
                }
                rowStart = y;
                output[i] = filterType;
            }
            else {
                current[x] = input[y++] || 0;
                switch (filterType) {
                    case 0:
                        result = current[x];
                        break;
                    case 1:
                        result = (current[x] - getLeft(x)) % 256;
                        break;
                    case 2:
                        result = (current[x] - getAbove(x)) % 256;
                        break;
                    case 3:
                        result = (current[x] - Math.floor((getAbove(x) + getLeft(x)) / 2)) % 256;
                        break;
                    case 4:
                        result = (current[x] - this.paethPredictor(getLeft(x), getAbove(x), getUpperLeft(x))) % 256;
                        break;
                }
                output[i] = result;
                x++;
            }
        }
        return output;
    }
    static paethPredictor(a, b, c) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        if (pa <= pb && pa <= pc) {
            return a;
        }
        else if (pb <= pc) {
            return b;
        }
        else {
            return c;
        }
    }
}

class PdfStream extends PdfObject {
    constructor(type = null) {
        super();
        this.Type = type;
    }
    get streamData() {
        return this._streamData;
    }
    set streamData(data) {
        this.setStreamData(data);
    }
    get decodedStreamData() {
        if (!this._decodedStreamData) {
            this.decodeStreamData();
        }
        return this._decodedStreamData;
    }
    toArray(cryptInfo) {
        const streamData = (cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.streamCryptor
            ? cryptInfo.streamCryptor.encrypt(this.streamData, cryptInfo.ref)
            : this.streamData;
        const encoder = new TextEncoder();
        const bytes = [...keywordCodes.DICT_START];
        bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + streamData.length));
        if (this.Type) {
            bytes.push(...keywordCodes.TYPE, ...encoder.encode(this.Type));
        }
        if (this.Filter) {
            bytes.push(...encoder.encode("/Filter"), ...encoder.encode(this.Filter));
        }
        if (this.DecodeParms) {
            bytes.push(...encoder.encode("/DecodeParms"), ...this.DecodeParms.toArray(cryptInfo));
        }
        bytes.push(...keywordCodes.DICT_END, ...keywordCodes.END_OF_LINE, ...keywordCodes.STREAM_START, ...keywordCodes.END_OF_LINE, ...streamData, ...keywordCodes.END_OF_LINE, ...keywordCodes.STREAM_END, ...keywordCodes.END_OF_LINE);
        return new Uint8Array(bytes);
    }
    tryParseProps(parseInfo) {
        var _a, _b;
        if (!parseInfo) {
            return false;
        }
        this._ref = (_a = parseInfo.cryptInfo) === null || _a === void 0 ? void 0 : _a.ref;
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        const streamEndIndex = parser.findSubarrayIndex(keywordCodes.STREAM_END, {
            direction: "reverse",
            minIndex: start,
            maxIndex: end,
            closedOnly: true
        });
        if (!streamEndIndex) {
            return false;
        }
        const streamStartIndex = parser.findSubarrayIndex(keywordCodes.STREAM_START, {
            direction: "reverse",
            minIndex: start,
            maxIndex: streamEndIndex.start - 1,
            closedOnly: true
        });
        if (!streamStartIndex) {
            return false;
        }
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Type":
                        const type = parser.parseNameAt(i);
                        if (type) {
                            if (this.Type && this.Type !== type.value) {
                                return false;
                            }
                            i = type.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Type property value");
                        }
                        break;
                    case "/Length":
                        const length = parser.parseNumberAt(i, false);
                        if (length) {
                            this.Length = length.value;
                            i = length.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Length property value");
                        }
                        break;
                    case "/Filter":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.NAME) {
                            const filter = parser.parseNameAt(i);
                            if (filter && supportedFilters.has(filter.value)) {
                                this.Filter = filter.value;
                                i = filter.end + 1;
                                break;
                            }
                            else {
                                throw new Error(`Unsupported /Filter property value: ${filter.value}`);
                            }
                        }
                        else if (entryType === valueTypes.ARRAY) {
                            const filterNames = parser.parseNameArrayAt(i);
                            if (filterNames) {
                                const filterArray = filterNames.value;
                                if (filterArray.length === 1 && supportedFilters.has(filterArray[0])) {
                                    this.Filter = filterArray[0];
                                    i = filterNames.end + 1;
                                    break;
                                }
                                else {
                                    throw new Error(`Unsupported /Filter property value: ${filterArray.toString()}`);
                                }
                            }
                        }
                        throw new Error(`Unsupported /Filter property value type: ${entryType}`);
                    case "/DecodeParms":
                        const paramsEntryType = parser.getValueTypeAt(i);
                        if (paramsEntryType === valueTypes.DICTIONARY) {
                            const decodeParamsBounds = parser.getDictBoundsAt(i);
                            if (decodeParamsBounds) {
                                const params = DecodeParamsDict.parse({ parser,
                                    bounds: decodeParamsBounds, cryptInfo: parseInfo.cryptInfo });
                                if (params) {
                                    this.DecodeParms = params.value;
                                    i = decodeParamsBounds.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /DecodeParms property value");
                        }
                        else if (paramsEntryType === valueTypes.ARRAY) {
                            const paramsDicts = DecodeParamsDict.parseArray(parser, i, parseInfo.cryptInfo);
                            if (paramsDicts) {
                                const paramsArray = paramsDicts.value;
                                if (paramsArray.length === 1) {
                                    this.DecodeParms = paramsArray[0];
                                    i = paramsDicts.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /DecodeParms property value");
                        }
                        throw new Error(`Unsupported /DecodeParms property value type: ${paramsEntryType}`);
                    case "/DL":
                        const dl = parser.parseNumberAt(i, false);
                        if (dl) {
                            this.DL = dl.value;
                            i = dl.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /DL property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                break;
            }
        }
        const streamStart = parser.findNewLineIndex("straight", streamStartIndex.end + 1);
        const streamEnd = parser.findNewLineIndex("reverse", streamEndIndex.start - 1);
        const streamBytes = parser.sliceCharCodes(streamStart, streamEnd);
        const encodedData = ((_b = parseInfo.cryptInfo) === null || _b === void 0 ? void 0 : _b.ref) && parseInfo.cryptInfo.streamCryptor
            ? parseInfo.cryptInfo.streamCryptor.decrypt(streamBytes, parseInfo.cryptInfo.ref)
            : streamBytes;
        this._streamData = encodedData;
        return true;
    }
    setStreamData(data) {
        let encodedData;
        if (this.DecodeParms) {
            const params = this.DecodeParms;
            encodedData = FlateDecoder.Encode(data, params.getIntProp("/Predictor") || flatePredictors.NONE, params.getIntProp("/Columns") || 1, params.getIntProp("/Colors") || 1, params.getIntProp("/BitsPerComponent") || 8);
        }
        else {
            encodedData = FlateDecoder.Encode(data);
        }
        this._streamData = encodedData;
        this.Length = encodedData.length;
        this.DL = data.length;
        this._decodedStreamData = data;
    }
    decodeStreamData() {
        let decodedData;
        switch (this.Filter) {
            case streamFilters.FLATE:
                if (this.DecodeParms) {
                    const params = this.DecodeParms;
                    decodedData = FlateDecoder.Decode(this._streamData, params.getIntProp("/Predictor") || flatePredictors.NONE, params.getIntProp("/Columns") || 1, params.getIntProp("/Colors") || 1, params.getIntProp("/BitsPerComponent") || 8);
                }
                else {
                    decodedData = FlateDecoder.Decode(this._streamData);
                }
                break;
            default:
                decodedData = new Uint8Array(this._streamData);
                break;
        }
        this._decodedStreamData = decodedData;
    }
}

class TextStream extends PdfStream {
    constructor(type = null) {
        super(type);
    }
    static parse(parseInfo) {
        const stream = new TextStream();
        const parseResult = stream.tryParseProps(parseInfo);
        return parseResult
            ? { value: stream, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    getText() {
        return null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        return superBytes;
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        return true;
    }
}

const borderStyles = {
    SOLID: "/S",
    DASHED: "/D",
    BEVELED: "/B",
    INSET: "/I",
    UNDERLINE: "/U",
};
class BorderStyleDict extends PdfDict {
    constructor() {
        super(dictTypes.BORDER_STYLE);
        this.W = 1;
        this.S = borderStyles.SOLID;
        this.D = [3, 0];
    }
    static parse(parseInfo) {
        const borderStyle = new BorderStyleDict();
        const parseResult = borderStyle.tryParseProps(parseInfo);
        return parseResult
            ? { value: borderStyle, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.W) {
            bytes.push(...encoder.encode("/W"), ...encoder.encode(" " + this.W));
        }
        if (this.S) {
            bytes.push(...encoder.encode("/S"), ...encoder.encode(this.S));
        }
        if (this.D) {
            bytes.push(...encoder.encode("/D"), codes.L_BRACKET, ...encoder.encode(this.D[0] + ""), codes.WHITESPACE, ...encoder.encode(this.D[1] + ""), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        var _a, _b;
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/W":
                        const width = parser.parseNumberAt(i, true);
                        if (width) {
                            this.W = width.value;
                            i = width.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /W property value");
                        }
                        break;
                    case "/S":
                        const style = parser.parseNameAt(i, true);
                        if (style && Object.values(borderStyles).includes(style.value)) {
                            this.S = style.value;
                            i = style.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /S property value");
                        }
                        break;
                    case "/D":
                        const dashGap = parser.parseNumberArrayAt(i, true);
                        if (dashGap) {
                            this.D = [
                                (_a = dashGap.value[0]) !== null && _a !== void 0 ? _a : 3,
                                (_b = dashGap.value[1]) !== null && _b !== void 0 ? _b : 0,
                            ];
                            i = dashGap.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /D property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class DataParser {
    constructor(data) {
        if (!(data === null || data === void 0 ? void 0 : data.length)) {
            throw new Error("Data is empty");
        }
        this._data = data;
        this._maxIndex = data.length - 1;
    }
    get maxIndex() {
        return this._maxIndex;
    }
    getPdfVersion() {
        var _a;
        const i = this.findSubarrayIndex(keywordCodes.VERSION);
        if (!i) {
            throw new Error("PDF not valid. Version not found");
        }
        const version = (_a = this.parseNumberAt(i.end + 1, true)) === null || _a === void 0 ? void 0 : _a.value;
        if (!version) {
            throw new Error("Error parsing version number");
        }
        return version.toFixed(1);
    }
    getLastXrefIndex() {
        const xrefStartIndex = this.findSubarrayIndex(keywordCodes.XREF_START, { maxIndex: this.maxIndex, direction: "reverse" });
        if (!xrefStartIndex) {
            return null;
        }
        const xrefIndex = this.parseNumberAt(xrefStartIndex.end + 1);
        if (!xrefIndex) {
            return null;
        }
        return xrefIndex;
    }
    findSubarrayIndex(sub, options) {
        var _a, _b;
        const arr = this._data;
        if (!(sub === null || sub === void 0 ? void 0 : sub.length)) {
            return null;
        }
        const direction = (options === null || options === void 0 ? void 0 : options.direction) || "straight";
        const minIndex = Math.max(Math.min((_a = options === null || options === void 0 ? void 0 : options.minIndex) !== null && _a !== void 0 ? _a : 0, this._maxIndex), 0);
        const maxIndex = Math.max(Math.min((_b = options === null || options === void 0 ? void 0 : options.maxIndex) !== null && _b !== void 0 ? _b : this._maxIndex, this._maxIndex), 0);
        const allowOpened = !(options === null || options === void 0 ? void 0 : options.closedOnly);
        let i = direction === "straight"
            ? minIndex
            : maxIndex;
        let j;
        if (direction === "straight") {
            outer_loop: for (i; i <= maxIndex; i++) {
                for (j = 0; j < sub.length; j++) {
                    if (arr[i + j] !== sub[j]) {
                        continue outer_loop;
                    }
                }
                if (allowOpened || !isRegularChar(arr[i + j])) {
                    return { start: i, end: i + j - 1 };
                }
            }
        }
        else {
            const subMaxIndex = sub.length - 1;
            outer_loop: for (i; i >= minIndex; i--) {
                for (j = 0; j < sub.length; j++) {
                    if (arr[i - j] !== sub[subMaxIndex - j]) {
                        continue outer_loop;
                    }
                }
                if (allowOpened || !isRegularChar(arr[i - j])) {
                    return { start: i - j + 1, end: i };
                }
            }
        }
        return null;
    }
    findCharIndex(charCode, direction = "straight", start) {
        return this.findSingleCharIndex((value) => charCode === value, direction, start);
    }
    findNewLineIndex(direction = "straight", start) {
        let lineBreakIndex = this.findSingleCharIndex((value) => value === codes.CARRIAGE_RETURN || value === codes.LINE_FEED, direction, start);
        if (lineBreakIndex === -1) {
            return -1;
        }
        if (direction === "straight") {
            if (this._data[lineBreakIndex] === codes.CARRIAGE_RETURN
                && this._data[lineBreakIndex + 1] === codes.LINE_FEED) {
                lineBreakIndex++;
            }
            return Math.min(lineBreakIndex + 1, this._maxIndex);
        }
        else {
            if (this._data[lineBreakIndex] === codes.LINE_FEED
                && this._data[lineBreakIndex - 1] === codes.CARRIAGE_RETURN) {
                lineBreakIndex--;
            }
            return Math.max(lineBreakIndex - 1, 0);
        }
    }
    findSpaceIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => SPACE_CHARS.has(value), direction, start);
    }
    findNonSpaceIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !SPACE_CHARS.has(value), direction, start);
    }
    findDelimiterIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => DELIMITER_CHARS.has(value), direction, start);
    }
    findNonDelimiterIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !DELIMITER_CHARS.has(value), direction, start);
    }
    findIrregularIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => !isRegularChar(value), direction, start);
    }
    findRegularIndex(direction = "straight", start) {
        return this.findSingleCharIndex((value) => isRegularChar(value), direction, start);
    }
    getValueTypeAt(start, skipEmpty = true) {
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
                    if (refEndIndex !== -1 && refEndIndex > i && !isRegularChar(arr[refEndIndex + 1])) {
                        return valueTypes.REF;
                    }
                }
                return valueTypes.NUMBER;
            case codes.DOT:
            case codes.MINUS:
                if (isDigit(arr[i + 1])) {
                    return valueTypes.NUMBER;
                }
                return valueTypes.UNKNOWN;
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
    getIndirectObjectBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)) {
            return null;
        }
        const objStartIndex = this.findSubarrayIndex(keywordCodes.OBJ, { minIndex: start, closedOnly: true });
        if (!objStartIndex) {
            return null;
        }
        let contentStart = this.findNonSpaceIndex("straight", objStartIndex.end + 1);
        if (contentStart === -1) {
            return null;
        }
        const objEndIndex = this.findSubarrayIndex(keywordCodes.OBJ_END, { minIndex: contentStart, closedOnly: true });
        if (!objEndIndex) {
            return null;
        }
        let contentEnd = this.findNonSpaceIndex("reverse", objEndIndex.start - 1);
        if (this.getCharCode(contentStart) === codes.LESS
            && this.getCharCode(contentStart + 1) === codes.LESS
            && this.getCharCode(contentEnd - 1) === codes.GREATER
            && this.getCharCode(contentEnd) === codes.GREATER) {
            contentStart += 2;
            contentEnd -= 2;
        }
        return {
            start: objStartIndex.start,
            end: objEndIndex.end,
            contentStart,
            contentEnd,
        };
    }
    getXrefTableBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.x) {
            return null;
        }
        const xrefStart = this.findSubarrayIndex(keywordCodes.XREF_TABLE, { minIndex: start });
        if (!xrefStart) {
            return null;
        }
        const contentStart = this.findNonSpaceIndex("straight", xrefStart.end + 1);
        if (contentStart === -1) {
            return null;
        }
        const xrefEnd = this.findSubarrayIndex(keywordCodes.TRAILER, { minIndex: xrefStart.end + 1 });
        if (!xrefEnd) {
            return null;
        }
        const contentEnd = this.findNonSpaceIndex("reverse", xrefEnd.start - 1);
        if (contentEnd < contentStart) {
            return null;
        }
        return {
            start: xrefStart.start,
            end: xrefEnd.end,
            contentStart,
            contentEnd,
        };
    }
    getDictBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)
            || this._data[start] !== codes.LESS
            || this._data[start + 1] !== codes.LESS) {
            return null;
        }
        const contentStart = this.findNonSpaceIndex("straight", start + 2);
        if (contentStart === -1) {
            return null;
        }
        let dictOpened = 1;
        let dictBound = true;
        let literalOpened = 0;
        let i = contentStart;
        let code;
        let prevCode;
        while (dictOpened) {
            prevCode = code;
            code = this._data[i++];
            if (code === codes.L_PARENTHESE
                && (!literalOpened || prevCode !== codes.BACKSLASH)) {
                literalOpened++;
            }
            if (code === codes.R_PARENTHESE
                && (literalOpened && prevCode !== codes.BACKSLASH)) {
                literalOpened--;
            }
            if (literalOpened) {
                continue;
            }
            if (!dictBound) {
                if (code === codes.LESS && code === prevCode) {
                    dictOpened++;
                    dictBound = true;
                }
                else if (code === codes.GREATER && code === prevCode) {
                    dictOpened--;
                    dictBound = true;
                }
            }
            else {
                dictBound = false;
            }
        }
        const end = i - 1;
        const contentEnd = this.findNonSpaceIndex("reverse", end - 2);
        if (contentEnd < contentStart) {
            return {
                start,
                end,
            };
        }
        return {
            start,
            end,
            contentStart,
            contentEnd,
        };
    }
    getArrayBoundsAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this._data[start] !== codes.L_BRACKET) {
            return null;
        }
        let subArrayOpened = 0;
        let i = start + 1;
        let code;
        while (subArrayOpened || code !== codes.R_BRACKET) {
            code = this._data[i++];
            if (code === codes.L_BRACKET) {
                subArrayOpened++;
            }
            else if (subArrayOpened && code === codes.R_BRACKET) {
                subArrayOpened--;
            }
        }
        const arrayEnd = i - 1;
        if (arrayEnd - start < 1) {
            return null;
        }
        return { start, end: arrayEnd };
    }
    getHexBounds(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this.getCharCode(start) !== codes.LESS) {
            return null;
        }
        const end = this.findCharIndex(codes.GREATER, "straight", start + 1);
        if (end === -1) {
            return null;
        }
        return { start, end };
    }
    getLiteralBounds(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start) || this.getCharCode(start) !== codes.L_PARENTHESE) {
            return null;
        }
        let i = start + 1;
        let prevCode;
        let code;
        let opened = 0;
        while (opened || code !== codes.R_PARENTHESE || prevCode === codes.BACKSLASH) {
            if (i > this._maxIndex) {
                return null;
            }
            if (!isNaN(code)) {
                prevCode = code;
            }
            code = this.getCharCode(i++);
            if (prevCode !== codes.BACKSLASH) {
                if (code === codes.L_PARENTHESE) {
                    opened += 1;
                }
                else if (opened && code === codes.R_PARENTHESE) {
                    opened -= 1;
                }
            }
        }
        return { start, end: i - 1 };
    }
    parseNumberAt(start, float = false, skipEmpty = true) {
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
            numberStr += "-";
            value = this._data[++i];
        }
        else if (value === codes.DOT) {
            numberStr += "0.";
            value = this._data[++i];
        }
        while (DIGIT_CHARS.has(value)
            || (float && value === codes.DOT)) {
            numberStr += String.fromCharCode(value);
            value = this._data[++i];
        }
        return numberStr
            ? { value: +numberStr, start, end: i - 1 }
            : null;
    }
    parseNameAt(start, includeSlash = true, skipEmpty = true) {
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
        }
        return result.length > 1
            ? { value: result, start, end: i - 1 }
            : null;
    }
    parseStringAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)) {
            return null;
        }
        let i = start;
        let result = "";
        let value = this._data[i];
        while (isRegularChar(value)) {
            result += String.fromCharCode(value);
            value = this._data[++i];
        }
        return result.length !== 0
            ? { value: result, start, end: i - 1 }
            : null;
    }
    parseBoolAt(start, skipEmpty = true) {
        if (skipEmpty) {
            start = this.skipEmpty(start);
        }
        if (this.isOutside(start)) {
            return null;
        }
        const isTrue = this.findSubarrayIndex(keywordCodes.TRUE, { minIndex: start });
        if (isTrue) {
            return { value: true, start, end: isTrue.end };
        }
        const isFalse = this.findSubarrayIndex(keywordCodes.FALSE, { minIndex: start });
        if (isFalse) {
            return { value: true, start, end: isFalse.end };
        }
        return null;
    }
    parseNumberArrayAt(start, float = true, skipEmpty = true) {
        const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const numbers = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = this.parseNumberAt(i, float, true);
            if (!current) {
                break;
            }
            numbers.push(current.value);
            i = current.end + 1;
        }
        return { value: numbers, start: arrayBounds.start, end: arrayBounds.end };
    }
    parseNameArrayAt(start, includeSlash = true, skipEmpty = true) {
        const arrayBounds = this.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const names = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = this.parseNameAt(i, includeSlash, true);
            if (!current) {
                break;
            }
            names.push(current.value);
            i = current.end + 1;
        }
        return { value: names, start: arrayBounds.start, end: arrayBounds.end };
    }
    parseDictType(bounds) {
        return this.parseDictNameProperty(keywordCodes.TYPE, bounds);
    }
    parseDictSubtype(bounds) {
        return this.parseDictNameProperty(keywordCodes.SUBTYPE, bounds);
    }
    parseDictNameProperty(subarray, bounds) {
        const typeProp = this.findSubarrayIndex(subarray, { minIndex: bounds.start, maxIndex: bounds.end });
        if (!typeProp) {
            return null;
        }
        const type = this.parseNameAt(typeProp.end + 1);
        if (!type) {
            return null;
        }
        return type.value;
    }
    skipEmpty(start) {
        let index = this.findNonSpaceIndex("straight", start);
        if (index === -1) {
            return -1;
        }
        if (this._data[index] === codes.PERCENT) {
            const afterComment = this.findNewLineIndex("straight", index + 1);
            if (afterComment === -1) {
                return -1;
            }
            index = this.findNonSpaceIndex("straight", afterComment);
        }
        return index;
    }
    skipToNextName(start, max) {
        start || (start = 0);
        max = max
            ? Math.min(max, this._maxIndex)
            : 0;
        if (max < start) {
            return -1;
        }
        let i = start;
        while (i <= max) {
            const value = this.getValueTypeAt(i, true);
            if (value) {
                let skipValueBounds;
                switch (value) {
                    case valueTypes.DICTIONARY:
                        skipValueBounds = this.getDictBoundsAt(i, false);
                        break;
                    case valueTypes.ARRAY:
                        skipValueBounds = this.getArrayBoundsAt(i, false);
                        break;
                    case valueTypes.STRING_LITERAL:
                        skipValueBounds = this.getLiteralBounds(i, false);
                        break;
                    case valueTypes.STRING_HEX:
                        skipValueBounds = this.getHexBounds(i, false);
                        break;
                    case valueTypes.NUMBER:
                        const numberParseResult = this.parseNumberAt(i, true, false);
                        if (numberParseResult) {
                            skipValueBounds = numberParseResult;
                        }
                        break;
                    case valueTypes.BOOLEAN:
                        const boolParseResult = this.parseBoolAt(i, false);
                        if (boolParseResult) {
                            skipValueBounds = boolParseResult;
                        }
                        break;
                    case valueTypes.COMMENT:
                        break;
                    case valueTypes.NAME:
                        return i;
                    default:
                        i++;
                        continue;
                }
                if (skipValueBounds) {
                    i = skipValueBounds.end + 1;
                    skipValueBounds = null;
                    continue;
                }
            }
            i++;
        }
        return -1;
    }
    getCharCode(index) {
        return this._data[index];
    }
    getChar(index) {
        const code = this._data[index];
        if (!isNaN(code)) {
            return String.fromCharCode(code);
        }
        return null;
    }
    sliceCharCodes(start, end) {
        return this._data.slice(start, (end || start) + 1);
    }
    sliceChars(start, end) {
        return String.fromCharCode(...this._data.slice(start, (end || start) + 1));
    }
    subCharCodes(start, end) {
        return this._data.subarray(start, (end || start) + 1);
    }
    isOutside(index) {
        return (index < 0 || index > this._maxIndex);
    }
    getValidStartIndex(direction, start) {
        return !isNaN(start)
            ? Math.max(Math.min(start, this._maxIndex), 0)
            : direction === "straight"
                ? 0
                : this._maxIndex;
    }
    findSingleCharIndex(filter, direction = "straight", start) {
        const arr = this._data;
        let i = this.getValidStartIndex(direction, start);
        if (direction === "straight") {
            for (i; i <= this._maxIndex; i++) {
                if (filter(arr[i])) {
                    return i;
                }
            }
        }
        else {
            for (i; i >= 0; i--) {
                if (filter(arr[i])) {
                    return i;
                }
            }
        }
        return -1;
    }
}

class ObjectMapDict extends PdfDict {
    constructor() {
        super(null);
        this._objectIdMap = new Map();
        this._dictParserMap = new Map();
    }
    static parse(parseInfo) {
        const objectMap = new ObjectMapDict();
        const parseResult = objectMap.tryParseProps(parseInfo);
        return parseResult
            ? { value: objectMap, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    getObjectId(name) {
        return this._objectIdMap.get(name);
    }
    *getObjectIds() {
        for (const pair of this._objectIdMap) {
            yield pair;
        }
        return;
    }
    getDictParser(name) {
        return this._dictParserMap.get(name);
    }
    *getDictParsers() {
        for (const pair of this._dictParserMap) {
            yield pair;
        }
        return;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        this._objectIdMap.forEach((v, k) => {
            bytes.push(...encoder.encode(k), ...v.toArray(cryptInfo));
        });
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    default:
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.REF) {
                            const id = ObjectId.parseRef(parser, i);
                            if (id) {
                                this._objectIdMap.set(name, id.value);
                                i = id.end + 1;
                                break;
                            }
                        }
                        else if (entryType === valueTypes.DICTIONARY) {
                            const dictBounds = parser.getDictBoundsAt(i);
                            if (dictBounds) {
                                const dictParseInfo = {
                                    parser: new DataParser(parser.sliceCharCodes(dictBounds.start, dictBounds.end)),
                                    bounds: {
                                        start: 0,
                                        end: dictBounds.end - dictBounds.start,
                                        contentStart: dictBounds.contentStart - dictBounds.start,
                                        contentEnd: dictBounds.contentEnd - dictBounds.start,
                                    },
                                    cryptInfo: parseInfo.cryptInfo,
                                };
                                this._dictParserMap.set(name, dictParseInfo);
                                i = dictBounds.end + 1;
                                break;
                            }
                        }
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class ImageStream extends PdfStream {
    constructor() {
        super(streamTypes.FORM_XOBJECT);
        this.Subtype = "/Image";
        this.ImageMask = false;
        this.Interpolate = false;
        this.SMaskInData = 0;
    }
    set streamData(data) {
        this.setStreamData(data);
    }
    get decodedStreamData() {
        if (!this._decodedStreamData) {
            this.decodeStreamData();
        }
        return this._decodedStreamData;
    }
    static parse(parseInfo) {
        const xForm = new ImageStream();
        const parseResult = xForm.tryParseProps(parseInfo);
        return parseResult
            ? { value: xForm, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Subtype) {
            bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
        }
        if (this.Width) {
            bytes.push(...encoder.encode("/Width"), ...encoder.encode(" " + this.Width));
        }
        if (this.Height) {
            bytes.push(...encoder.encode("/Width"), ...encoder.encode(" " + this.Height));
        }
        if (this.ColorSpace) {
            bytes.push(...encoder.encode("/ColorSpace"), ...encoder.encode(this.ColorSpace));
        }
        if (this.BitsPerComponent) {
            bytes.push(...encoder.encode("/BitsPerComponent"), ...encoder.encode(" " + this.BitsPerComponent));
        }
        bytes.push(...encoder.encode("/ImageMask"), ...encoder.encode(" " + !!this.ImageMask));
        if (this.Mask) {
            bytes.push(...encoder.encode("/Mask"), codes.L_BRACKET);
            this.Mask.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.Decode) {
            bytes.push(...encoder.encode("/Decode"), codes.L_BRACKET);
            this.Decode.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        bytes.push(...encoder.encode("/Interpolate"), ...encoder.encode(" " + !!this.Interpolate));
        if (this.SMask) {
            bytes.push(...encoder.encode("/SMask"), ...this.SMask.toArray(cryptInfo));
        }
        if (this.SMaskInData) {
            bytes.push(...encoder.encode("/SMaskInData"), ...encoder.encode(" " + this.SMaskInData));
        }
        if (this.Matte) {
            bytes.push(...encoder.encode("/Matte"), codes.L_BRACKET);
            this.Matte.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.StructParent) {
            bytes.push(...encoder.encode("/StructParent"), ...encoder.encode(" " + this.StructParent));
        }
        if (this.Metadata) {
            bytes.push(...encoder.encode("/Metadata"), codes.WHITESPACE, ...this.Metadata.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        if (this.Type !== streamTypes.FORM_XOBJECT) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Subtype":
                        const subtype = parser.parseNameAt(i);
                        if (subtype) {
                            if (this.Subtype && this.Subtype !== subtype.value) {
                                return false;
                            }
                            i = subtype.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subtype property value");
                        }
                        break;
                    case "/Width":
                        const width = parser.parseNumberAt(i, false);
                        if (width) {
                            this.Width = width.value;
                            i = width.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Width property value");
                        }
                        break;
                    case "/Height":
                        const height = parser.parseNumberAt(i, false);
                        if (height) {
                            this.Height = height.value;
                            i = height.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Height property value");
                        }
                        break;
                    case "/ColorSpace":
                        const colorSpaceEntryType = parser.getValueTypeAt(i);
                        if (colorSpaceEntryType === valueTypes.NAME) {
                            const colorSpaceName = parser.parseNameAt(i);
                            if (colorSpaceName) {
                                this.ColorSpace = colorSpaceName.value;
                                i = colorSpaceName.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /ColorSpace property name");
                        }
                        else if (colorSpaceEntryType === valueTypes.ARRAY) {
                            const colorSpaceArrayBounds = parser.getArrayBoundsAt(i);
                            if (colorSpaceArrayBounds) {
                                i = colorSpaceArrayBounds.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /ColorSpace value dictionary");
                        }
                        throw new Error(`Unsupported /ColorSpace property value type: ${colorSpaceEntryType}`);
                    case "/BitsPerComponent":
                        const bitsPerComponent = parser.parseNumberAt(i, false);
                        if (bitsPerComponent) {
                            this.BitsPerComponent = bitsPerComponent.value;
                            i = bitsPerComponent.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /BitsPerComponent property value");
                        }
                        break;
                    case "/ImageMask":
                        const imageMask = parser.parseBoolAt(i, false);
                        if (imageMask) {
                            this.ImageMask = imageMask.value;
                            i = imageMask.end + 1;
                            if (this.ImageMask) {
                                this.BitsPerComponent = 1;
                            }
                        }
                        else {
                            throw new Error("Can't parse /ImageMask property value");
                        }
                        break;
                    case "/Mask":
                        const maskEntryType = parser.getValueTypeAt(i);
                        if (maskEntryType === valueTypes.REF) {
                            const maskStreamId = ObjectId.parseRef(parser, i);
                            if (!maskStreamId) {
                                throw new Error("Can't parse /Mask value reference: failed to parse ref");
                            }
                            const maskParseInfo = parseInfo.parseInfoGetter(maskStreamId.value.id);
                            if (!maskParseInfo) {
                                throw new Error("Can't parse /Mask value reference: failed to get image parse info");
                            }
                            const maskStream = ImageStream.parse(maskParseInfo);
                            if (!maskStream) {
                                throw new Error("Can't parse /Mask value reference: failed to parse image stream");
                            }
                            const maskStreamParser = new DataParser(new Uint8Array([
                                codes.L_BRACKET,
                                ...maskStream.value.decodedStreamData,
                                codes.R_BRACKET,
                            ]));
                            if (!maskStreamParser) {
                                throw new Error("Can't parse /Mask value reference: failed to get decoded image data");
                            }
                            const maskArray = maskStreamParser.parseNumberArrayAt(0, false);
                            if (!maskArray) {
                                throw new Error("Can't parse /Mask value reference: failed to parse decoded image data");
                            }
                            this.Mask = maskArray.value;
                            i = maskStreamId.end + 1;
                            break;
                        }
                        else if (maskEntryType === valueTypes.ARRAY) {
                            const maskArray = parser.parseNumberArrayAt(i, false);
                            if (maskArray) {
                                this.Mask = maskArray.value;
                                i = maskArray.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /Mask property value");
                        }
                        throw new Error(`Unsupported /Mask property value type: ${maskEntryType}`);
                    case "/Decode":
                        const decode = parser.parseNumberArrayAt(i, false);
                        if (decode) {
                            this.Decode = decode.value;
                            i = decode.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Decode property value");
                        }
                        break;
                    case "/Interpolate":
                        const interpolate = parser.parseBoolAt(i, false);
                        if (interpolate) {
                            this.Interpolate = interpolate.value;
                            i = interpolate.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Interpolate property value");
                        }
                        break;
                    case "/SMask":
                        const sMaskId = ObjectId.parseRef(parser, i);
                        if (sMaskId) {
                            this.SMask = sMaskId.value;
                            i = sMaskId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /SMask property value");
                        }
                        break;
                    case "/SMaskInData":
                        const smaskInData = parser.parseNumberAt(i, false);
                        if (smaskInData) {
                            this.SMaskInData = smaskInData.value;
                            i = smaskInData.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /SMaskInData property value");
                        }
                        break;
                    case "/Matte":
                        const matte = parser.parseNumberArrayAt(i, false);
                        if (matte) {
                            this.Matte = matte.value;
                            i = matte.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Matte property value");
                        }
                        break;
                    case "/StructParent":
                        const parentKey = parser.parseNumberAt(i, false);
                        if (parentKey) {
                            this.StructParent = parentKey.value;
                            i = parentKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StructParent property value");
                        }
                        break;
                    case "/Metadata":
                        const metaId = ObjectId.parseRef(parser, i);
                        if (metaId) {
                            this.Metadata = metaId.value;
                            i = metaId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Metadata property value");
                        }
                        break;
                    case "/OC":
                    case "/Intent":
                    case "/Alternates":
                    case "/ID":
                    case "/OPI":
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Width && !this.Height) {
            return false;
        }
        if (this.ImageMask && (this.BitsPerComponent !== 1 || this.ColorSpace)) {
            return false;
        }
        if (!this.Decode && !(this.Filter === streamFilters.JPX && !this.ImageMask)) {
            switch (this.ColorSpace) {
                case colorSpaces.GRAYSCALE:
                    this.Decode = [0, 1];
                    break;
                case colorSpaces.RGB:
                    this.Decode = [0, 1, 0, 1, 0, 1];
                    break;
                case colorSpaces.CMYK:
                    this.Decode = [0, 1, 0, 1, 0, 1, 0, 1];
                    break;
            }
        }
        if (!this.DecodeParms) {
            this.DecodeParms = new DecodeParamsDict();
        }
        this.DecodeParms.setIntProp("/BitsPerComponent", this.BitsPerComponent);
        this.DecodeParms.setIntProp("/Columns", this.Width);
        switch (this.ColorSpace) {
            case colorSpaces.GRAYSCALE:
                this.DecodeParms.setIntProp("/Colors", 1);
                break;
            case colorSpaces.RGB:
                this.DecodeParms.setIntProp("/Colors", 3);
                break;
            case colorSpaces.CMYK:
                this.DecodeParms.setIntProp("/Colors", 4);
                break;
        }
        return true;
    }
}

class FontDict extends PdfDict {
    constructor() {
        super(dictTypes.FONT);
    }
    static parse(parseInfo) {
        const dict = new FontDict();
        const parseResult = dict.tryParseProps(parseInfo);
        return parseResult
            ? { value: dict, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Subtype) {
            bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(" " + this.Subtype));
        }
        if (this.BaseFont) {
            bytes.push(...encoder.encode("/BaseFont"), ...encoder.encode(" " + this.BaseFont));
        }
        if (this.Encoding) {
            bytes.push(...encoder.encode("/Encoding"), ...encoder.encode(" " + this.Encoding));
        }
        if (this.ToUnicode) {
            bytes.push(...encoder.encode("/G"), codes.WHITESPACE, ...this.ToUnicode.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Subtype":
                        const subtype = parser.parseNameAt(i, true);
                        if (subtype) {
                            if (subtype.value === "/Type1" || subtype.value === "/TrueType") {
                                this.Subtype = subtype.value;
                                i = subtype.end + 1;
                                break;
                            }
                            return false;
                        }
                        throw new Error("Can't parse /Subtype property value");
                    case "/BaseFont":
                        const baseFont = parser.parseNameAt(i, true);
                        if (baseFont) {
                            this.BaseFont = baseFont.value;
                            i = baseFont.end + 1;
                            break;
                        }
                        throw new Error("Can't parse /BaseFont property value");
                    case "/Encoding":
                        const encoding = parser.parseNameAt(i, true);
                        if (encoding) {
                            this.Encoding = encoding.value;
                            i = encoding.end + 1;
                            break;
                        }
                        throw new Error("Can't parse /Encoding property value");
                    case "/ToUnicode":
                        const cMapId = ObjectId.parseRef(parser, i);
                        if (cMapId) {
                            this.ToUnicode = cMapId.value;
                            i = cMapId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /ToUnicode property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class SoftMaskDict extends PdfDict {
    constructor() {
        super(dictTypes.SOFT_MASK);
        this.TR = "/Identity";
    }
    static parse(parseInfo) {
        const graphicsState = new SoftMaskDict();
        const parseResult = graphicsState.tryParseProps(parseInfo);
        return parseResult
            ? { value: graphicsState, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.S) {
            bytes.push(...encoder.encode("/S"), ...encoder.encode(this.S));
        }
        if (this.G) {
            bytes.push(...encoder.encode("/G"), codes.WHITESPACE, ...this.G.toArray(cryptInfo));
        }
        if (this.BC) {
            bytes.push(...encoder.encode("/BC"), codes.L_BRACKET);
            this.BC.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.TR) {
            bytes.push(...encoder.encode("/TR"), ...encoder.encode(" " + this.TR));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/S":
                        const softMaskType = parser.parseNameAt(i, true);
                        if (softMaskType && Object.values(softMaskTypes)
                            .includes(softMaskType.value)) {
                            this.S = softMaskType.value;
                            i = softMaskType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /S property value");
                        }
                        break;
                    case "/G":
                        const transparencyGroupId = ObjectId.parseRef(parser, i);
                        if (transparencyGroupId) {
                            this.G = transparencyGroupId.value;
                            i = transparencyGroupId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /G property value");
                        }
                        break;
                    case "/BC":
                        const backdropArray = parser.parseNumberArrayAt(i, false);
                        if (backdropArray) {
                            this.BC = backdropArray.value;
                            i = backdropArray.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /BC property value");
                        }
                        break;
                    case "/TR":
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class GraphicsStateDict extends PdfDict {
    constructor() {
        super(dictTypes.GRAPHICS_STATE);
    }
    static parse(parseInfo) {
        const graphicsState = new GraphicsStateDict();
        const parseResult = graphicsState.tryParseProps(parseInfo);
        return parseResult
            ? { value: graphicsState, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.LW) {
            bytes.push(...encoder.encode("/LW"), ...encoder.encode(" " + this.LW));
        }
        if (this.LC) {
            bytes.push(...encoder.encode("/LC"), ...encoder.encode(" " + this.LC));
        }
        if (this.LJ) {
            bytes.push(...encoder.encode("/LJ"), ...encoder.encode(" " + this.LJ));
        }
        if (this.ML) {
            bytes.push(...encoder.encode("/ML"), ...encoder.encode(" " + this.ML));
        }
        if (this.D) {
            bytes.push(...encoder.encode("/D"), codes.L_BRACKET, codes.L_BRACKET, ...encoder.encode("" + this.D[0][0]), ...encoder.encode(" " + this.D[0][1]), codes.R_BRACKET, ...encoder.encode(" " + this.D[1]), codes.R_BRACKET);
        }
        if (this.RI) {
            bytes.push(...encoder.encode("/RI"), ...encoder.encode(this.RI));
        }
        if (this.OP) {
            bytes.push(...encoder.encode("/OP"), ...encoder.encode(" " + this.OP));
        }
        if (this.op) {
            bytes.push(...encoder.encode("/op"), ...encoder.encode(" " + this.op));
        }
        if (this.OPM) {
            bytes.push(...encoder.encode("/OPM"), ...encoder.encode(" " + this.OPM));
        }
        if (this.Font) {
            bytes.push(...encoder.encode("/Font"), codes.L_BRACKET, ...this.Font[0].toArray(cryptInfo), ...encoder.encode(" " + this.Font[1]), codes.R_BRACKET);
        }
        if (this.FL) {
            bytes.push(...encoder.encode("/FL"), ...encoder.encode(" " + this.FL));
        }
        if (this.SM) {
            bytes.push(...encoder.encode("/SM"), ...encoder.encode(" " + this.SM));
        }
        if (this.SA) {
            bytes.push(...encoder.encode("/SA"), ...encoder.encode(" " + this.SA));
        }
        if (this.BM) {
            bytes.push(...encoder.encode("/BM"), ...encoder.encode(this.BM));
        }
        if (this.SMask) {
            if (this.SMask instanceof SoftMaskDict) {
                bytes.push(...encoder.encode("/SMask"), ...this.SMask.toArray(cryptInfo));
            }
            else {
                bytes.push(...encoder.encode("/SMask"), ...encoder.encode(this.SMask));
            }
        }
        if (this.CA) {
            bytes.push(...encoder.encode("/CA"), ...encoder.encode(" " + this.CA));
        }
        if (this.ca) {
            bytes.push(...encoder.encode("/ca"), ...encoder.encode(" " + this.ca));
        }
        if (this.AIS) {
            bytes.push(...encoder.encode("/AIS"), ...encoder.encode(" " + this.AIS));
        }
        if (this.TK) {
            bytes.push(...encoder.encode("/AIS"), ...encoder.encode(" " + this.TK));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    toParams() {
        const params = {};
        if (!isNaN(this.LW)) {
            params.strokeWidth = this.LW;
        }
        if (!isNaN(this.LC)) {
            switch (this.LC) {
                case lineCapStyles.BUTT:
                    params.strokeLineCap = "butt";
                    break;
                case lineCapStyles.ROUND:
                    params.strokeLineCap = "round";
                    break;
                case lineCapStyles.SQUARE:
                    params.strokeLineCap = "square";
                    break;
            }
        }
        if (!isNaN(this.LJ)) {
            switch (this.LJ) {
                case lineJoinStyles.BEVEL:
                    params.strokeLineJoin = "bevel";
                    break;
                case lineJoinStyles.ROUND:
                    params.strokeLineJoin = "round";
                    break;
                case lineJoinStyles.MITER:
                    params.strokeLineJoin = "miter";
                    break;
            }
        }
        if (this.ML) {
            params.strokeMiterLimit = this.ML;
        }
        if (this.D) {
            params.strokeDashArray = `${this.D[0][0]} ${this.D[0][1]}`;
            params.strokeDashOffset = this.D[1];
        }
        if (this.Font) ;
        if (this.BM) {
            params.strokeMiterLimit = this.ML;
        }
        if (this.SMask) ;
        if (this.CA) {
            params.strokeAlpha = this.CA;
        }
        if (this.ca) {
            params.fillAlpha = this.ca;
        }
        if (this.AIS) ;
        return params;
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/LC":
                        const lineCap = parser.parseNumberAt(i, true);
                        if (lineCap && Object.values(lineCapStyles)
                            .includes(lineCap.value)) {
                            this.LC = lineCap.value;
                            i = lineCap.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LC property value");
                        }
                        break;
                    case "/OPM":
                        const overprintMode = parser.parseNumberAt(i, true);
                        if (overprintMode && ([0, 1].includes(overprintMode.value))) {
                            this.OPM = overprintMode.value;
                            i = overprintMode.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /OPM property value");
                        }
                        break;
                    case "/LJ":
                        const lineJoin = parser.parseNumberAt(i, true);
                        if (lineJoin && Object.values(lineJoinStyles)
                            .includes(lineJoin.value)) {
                            this.LJ = lineJoin.value;
                            i = lineJoin.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LJ property value");
                        }
                        break;
                    case "/RI":
                        const intent = parser.parseNameAt(i, true);
                        if (intent && Object.values(renderingIntents)
                            .includes(intent.value)) {
                            this.RI = intent.value;
                            i = intent.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /RI property value");
                        }
                        break;
                    case "/BM":
                        const blendMode = parser.parseNameAt(i, true);
                        if (blendMode && Object.values(blendModes)
                            .includes(blendMode.value)) {
                            this.BM = blendMode.value;
                            i = blendMode.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /BM property value");
                        }
                        break;
                    case "/SMask":
                        const sMaskEntryType = parser.getValueTypeAt(i);
                        if (sMaskEntryType === valueTypes.NAME) {
                            const sMaskName = parser.parseNameAt(i);
                            if (sMaskName) {
                                this.SMask = sMaskName.value;
                                i = sMaskName.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /SMask property name");
                        }
                        else if (sMaskEntryType === valueTypes.DICTIONARY) {
                            const sMaskDictBounds = parser.getDictBoundsAt(i);
                            if (sMaskDictBounds) {
                                const sMaskDict = SoftMaskDict.parse({ parser, bounds: sMaskDictBounds });
                                if (sMaskDict) {
                                    this.SMask = sMaskDict.value;
                                    i = sMaskDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /SMask value dictionary");
                        }
                        throw new Error(`Unsupported /SMask property value type: ${sMaskEntryType}`);
                    case "/Font":
                        const fontEntryType = parser.getValueTypeAt(i);
                        if (fontEntryType === valueTypes.ARRAY) {
                            const fontArrayBounds = parser.getArrayBoundsAt(i);
                            if (fontArrayBounds) {
                                const fontRef = ObjectId.parse(parser, fontArrayBounds.start + 1);
                                if (fontRef) {
                                    const fontSize = parser.parseNumberAt(fontRef.end + 1);
                                    if (fontSize) {
                                        this.Font = [fontRef.value, fontSize.value];
                                        i = fontArrayBounds.end + 1;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            throw new Error(`Unsupported /Font property value type: ${fontEntryType}`);
                        }
                        throw new Error("Can't parse /Font property value");
                    case "/D":
                        const dashEntryType = parser.getValueTypeAt(i);
                        if (dashEntryType === valueTypes.ARRAY) {
                            const dashArrayBounds = parser.getArrayBoundsAt(i);
                            if (dashArrayBounds) {
                                const dashArray = parser.parseNumberArrayAt(dashArrayBounds.start + 1);
                                if (dashArray) {
                                    const dashPhase = parser.parseNumberAt(dashArray.end + 1);
                                    if (dashPhase) {
                                        this.D = [[dashArray.value[0], dashArray.value[1]], dashPhase.value];
                                        i = dashArrayBounds.end + 1;
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            throw new Error(`Unsupported /D property value type: ${dashEntryType}`);
                        }
                        throw new Error("Can't parse /D property value");
                    case "/OP":
                    case "/op":
                    case "/SA":
                    case "/AIS":
                    case "/TK":
                        const boolValue = parser.parseBoolAt(i);
                        if (boolValue) {
                            this[name.substring(1)] = boolValue.value;
                            i = boolValue.end + 1;
                        }
                        else {
                            throw new Error(`Can't parse${name} property value`);
                        }
                        break;
                    case "/LW":
                    case "/ML":
                    case "/FL":
                    case "/SM":
                    case "/CA":
                    case "/ca":
                        const numberValue = parser.parseNumberAt(i);
                        if (numberValue) {
                            this[name.substring(1)] = numberValue.value;
                            i = numberValue.end + 1;
                        }
                        else {
                            throw new Error(`Can't parse${name} property value`);
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class ResourceDict extends PdfDict {
    constructor() {
        super(null);
        this._gsMap = new Map();
        this._fontsMap = new Map();
        this._xObjectsMap = new Map();
    }
    static parse(parseInfo) {
        const resourceDict = new ResourceDict();
        const parseResult = resourceDict.tryParseProps(parseInfo);
        return parseResult
            ? { value: resourceDict, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.ExtGState) {
            bytes.push(...encoder.encode("/ExtGState"), ...this.ExtGState.toArray(cryptInfo));
        }
        if (this.ColorSpace) {
            bytes.push(...encoder.encode("/ColorSpace"), ...this.ColorSpace.toArray(cryptInfo));
        }
        if (this.Pattern) {
            bytes.push(...encoder.encode("/Pattern"), ...this.Pattern.toArray(cryptInfo));
        }
        if (this.Shading) {
            bytes.push(...encoder.encode("/Shading"), ...this.Shading.toArray(cryptInfo));
        }
        if (this.XObject) {
            bytes.push(...encoder.encode("/XObject"), ...this.XObject.toArray(cryptInfo));
        }
        if (this.Font) {
            bytes.push(...encoder.encode("/Font"), ...this.Font.toArray(cryptInfo));
        }
        if (this.Properties) {
            bytes.push(...encoder.encode("/Properties"), ...this.Properties.toArray(cryptInfo));
        }
        if (this.ProcSet) {
            bytes.push(...encoder.encode("/ProcSet"), codes.L_BRACKET);
            this.ProcSet.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
            bytes.push(codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    getGraphicsState(name) {
        return this._gsMap.get(name);
    }
    *getGraphicsStates() {
        for (const pair of this._gsMap) {
            yield pair;
        }
        return;
    }
    getFont(name) {
        return this._fontsMap.get(name);
    }
    *getFonts() {
        for (const pair of this._fontsMap) {
            yield pair;
        }
        return;
    }
    getXObject(name) {
        return this._xObjectsMap.get(name);
    }
    *getXObjects() {
        for (const pair of this._xObjectsMap) {
            yield pair;
        }
        return;
    }
    getFormXObject(name) {
        const xObj = this._xObjectsMap.get(name);
        if (xObj instanceof XFormStream) {
            return xObj;
        }
        else {
            return null;
        }
    }
    *getFormXObjects() {
        for (const pair of this._xObjectsMap) {
            if (pair[1] instanceof XFormStream) {
                yield pair;
            }
        }
        return;
    }
    getImageXObject(name) {
        const xObj = this._xObjectsMap.get(name);
        if (xObj instanceof ImageStream) {
            return xObj;
        }
        else {
            return null;
        }
    }
    *getImageXObjects() {
        for (const pair of this._xObjectsMap) {
            if (pair[1] instanceof ImageStream) {
                yield pair;
            }
        }
        return;
    }
    fillMaps(parseInfoGetter, cryptInfo) {
        var _a;
        this._gsMap.clear();
        this._fontsMap.clear();
        this._xObjectsMap.clear();
        if (this.ExtGState) {
            for (const [name, objectId] of this.ExtGState.getObjectIds()) {
                const streamParseInfo = parseInfoGetter(objectId.id);
                if (!streamParseInfo) {
                    continue;
                }
                const stream = GraphicsStateDict.parse(streamParseInfo);
                if (stream) {
                    this._gsMap.set(`/ExtGState${name}`, stream.value);
                }
            }
            for (const [name, parseInfo] of this.ExtGState.getDictParsers()) {
                const dict = GraphicsStateDict.parse(parseInfo);
                if (dict) {
                    this._gsMap.set(`/ExtGState${name}`, dict.value);
                }
            }
        }
        if (this.XObject) {
            for (const [name, objectId] of this.XObject.getObjectIds()) {
                const streamParseInfo = parseInfoGetter(objectId.id);
                if (!streamParseInfo) {
                    continue;
                }
                const stream = (_a = XFormStream.parse(streamParseInfo)) !== null && _a !== void 0 ? _a : ImageStream.parse(streamParseInfo);
                if (stream) {
                    this._xObjectsMap.set(`/XObject${name}`, stream.value);
                }
            }
        }
        if (this.Font) {
            for (const [name, objectId] of this.Font.getObjectIds()) {
                const dictParseInfo = parseInfoGetter(objectId.id);
                if (!dictParseInfo) {
                    continue;
                }
                const dict = FontDict.parse(dictParseInfo);
                if (dict) {
                    this._fontsMap.set(`/Font${name}`, dict.value);
                }
            }
        }
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/ExtGState":
                    case "/ColorSpace":
                    case "/Pattern":
                    case "/Shading":
                    case "/XObject":
                    case "/Font":
                    case "/Properties":
                        const mapBounds = parser.getDictBoundsAt(i);
                        if (mapBounds) {
                            const map = ObjectMapDict.parse({ parser, bounds: mapBounds });
                            if (map) {
                                this[name.substring(1)] = map.value;
                                i = mapBounds.end + 1;
                                break;
                            }
                        }
                        throw new Error(`Can't parse ${name} property value`);
                    case "/ProcSet":
                        const procedureNames = parser.parseNameArrayAt(i);
                        if (procedureNames) {
                            this.ProcSet = procedureNames.value;
                            i = procedureNames.end + 1;
                            break;
                        }
                        throw new Error("Can't parse /ProcSet property value");
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (parseInfo.parseInfoGetter) {
            this.fillMaps(parseInfo.parseInfoGetter, parseInfo.cryptInfo);
        }
        return true;
    }
}

class MeasureDict extends PdfDict {
    constructor() {
        super(dictTypes.MEASURE);
        this.Subtype = "/RL";
    }
    static parse(parseInfo) {
        const stamp = new MeasureDict();
        const parseResult = stamp.tryParseProps(parseInfo);
        return parseResult
            ? { value: stamp, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Subtype) {
            bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Subtype":
                        const subtype = parser.parseNameAt(i);
                        if (subtype) {
                            if (this.Subtype && this.Subtype !== subtype.value) {
                                return false;
                            }
                            i = subtype.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subtype property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class GroupDict extends PdfDict {
    constructor() {
        super(dictTypes.GROUP);
        this.S = "/Transparency";
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.S) {
            bytes.push(...encoder.encode("/S"), ...encoder.encode(this.S));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/S":
                        const intent = parser.parseNameAt(i, true);
                        if (intent) {
                            if (Object.values(groupDictTypes).includes(intent.value)) {
                                this.S = intent.value;
                                i = intent.end + 1;
                            }
                            else {
                                return false;
                            }
                        }
                        else {
                            throw new Error("Can't parse /S property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class TransparencyGroupDict extends GroupDict {
    constructor() {
        super();
        this.I = false;
        this.K = false;
    }
    static parse(parseInfo) {
        const group = new TransparencyGroupDict();
        const parseResult = group.tryParseProps(parseInfo);
        return parseResult
            ? { value: group, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.CS) {
            bytes.push(...encoder.encode("/CS"), ...encoder.encode(this.CS));
        }
        if (this.I) {
            bytes.push(...encoder.encode("/I"), ...encoder.encode(" " + this.I));
        }
        if (this.K) {
            bytes.push(...encoder.encode("/K"), ...encoder.encode(" " + this.K));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        if (this.S !== "/Transparency") {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/CS":
                        const colorSpaceEntryType = parser.getValueTypeAt(i);
                        if (colorSpaceEntryType === valueTypes.NAME) {
                            const colorSpaceName = parser.parseNameAt(i);
                            if (colorSpaceName) {
                                this.CS = colorSpaceName.value;
                                i = colorSpaceName.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /CS property name");
                        }
                        else if (colorSpaceEntryType === valueTypes.ARRAY) {
                            const colorSpaceArrayBounds = parser.getArrayBoundsAt(i);
                            if (colorSpaceArrayBounds) {
                                i = colorSpaceArrayBounds.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /CS value dictionary");
                        }
                        throw new Error(`Unsupported /CS property value type: ${colorSpaceEntryType}`);
                    case "/I":
                        const isolated = parser.parseBoolAt(i, false);
                        if (isolated) {
                            this.I = isolated.value;
                            i = isolated.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /I property value");
                        }
                        break;
                    case "/K":
                        const knockout = parser.parseBoolAt(i, false);
                        if (knockout) {
                            this.K = knockout.value;
                            i = knockout.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /K property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class XFormStream extends PdfStream {
    constructor() {
        super(streamTypes.FORM_XOBJECT);
        this.Subtype = "/Form";
        this.FormType = 1;
        this.Matrix = [1, 0, 0, 1, 0, 0];
    }
    get matrix() {
        const apMatrix = new Mat3();
        if (this.Matrix) {
            const [m0, m1, m3, m4, m6, m7] = this.Matrix;
            apMatrix.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
        }
        return apMatrix;
    }
    set matrix(matrix) {
        if (!matrix) {
            return;
        }
        this.Matrix = [...matrix.toFloatShortArray()];
    }
    get bBox() {
        return {
            ll: new Vec2(this.BBox[0], this.BBox[1]),
            lr: new Vec2(this.BBox[2], this.BBox[1]),
            ur: new Vec2(this.BBox[2], this.BBox[3]),
            ul: new Vec2(this.BBox[0], this.BBox[3]),
        };
    }
    get transformedBBox() {
        const matrix = new Mat3();
        if (this.Matrix) {
            const [m0, m1, m3, m4, m6, m7] = this.Matrix;
            matrix.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
        }
        const bBoxLL = new Vec2(this.BBox[0], this.BBox[1]);
        const bBoxLR = new Vec2(this.BBox[2], this.BBox[1]);
        const bBoxUR = new Vec2(this.BBox[2], this.BBox[3]);
        const bBoxUL = new Vec2(this.BBox[0], this.BBox[3]);
        return {
            ll: Vec2.applyMat3(bBoxLL, matrix),
            lr: Vec2.applyMat3(bBoxLR, matrix),
            ur: Vec2.applyMat3(bBoxUR, matrix),
            ul: Vec2.applyMat3(bBoxUL, matrix),
        };
    }
    static parse(parseInfo) {
        const xForm = new XFormStream();
        const parseResult = xForm.tryParseProps(parseInfo);
        return parseResult
            ? { value: xForm, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Subtype) {
            bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
        }
        if (this.FormType) {
            bytes.push(...encoder.encode("/FormType"), ...encoder.encode(" " + this.FormType));
        }
        if (this.BBox) {
            bytes.push(...encoder.encode("/BBox"), codes.L_BRACKET, ...encoder.encode(this.BBox[0] + ""), codes.WHITESPACE, ...encoder.encode(this.BBox[1] + ""), codes.WHITESPACE, ...encoder.encode(this.BBox[2] + ""), codes.WHITESPACE, ...encoder.encode(this.BBox[3] + ""), codes.R_BRACKET);
        }
        if (this.Matrix) {
            bytes.push(...encoder.encode("/BBox"), codes.L_BRACKET, ...encoder.encode(this.Matrix[0] + ""), codes.WHITESPACE, ...encoder.encode(this.Matrix[1] + ""), codes.WHITESPACE, ...encoder.encode(this.Matrix[2] + ""), codes.WHITESPACE, ...encoder.encode(this.Matrix[3] + ""), codes.WHITESPACE, ...encoder.encode(this.Matrix[4] + ""), codes.WHITESPACE, ...encoder.encode(this.Matrix[5] + ""), codes.R_BRACKET);
        }
        if (this.Resources) {
            bytes.push(...encoder.encode("/Resources"), ...this.Resources.toArray(cryptInfo));
        }
        if (this.Metadata) {
            bytes.push(...encoder.encode("/Metadata"), codes.WHITESPACE, ...this.Metadata.toArray(cryptInfo));
        }
        if (this.LastModified) {
            bytes.push(...encoder.encode("/LastModified"), ...this.LastModified.toArray(cryptInfo));
        }
        if (this.StructParent) {
            bytes.push(...encoder.encode("/StructParent"), ...encoder.encode(" " + this.StructParent));
        }
        if (this.StructParents) {
            bytes.push(...encoder.encode("/StructParents"), ...encoder.encode(" " + this.StructParents));
        }
        if (this.Measure) {
            bytes.push(...encoder.encode("/Measure"), ...this.Measure.toArray(cryptInfo));
        }
        if (this.Group) {
            bytes.push(...encoder.encode("/Group"), ...this.Group.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        if (this.Type !== streamTypes.FORM_XOBJECT) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Subtype":
                        const subtype = parser.parseNameAt(i);
                        if (subtype) {
                            if (this.Subtype && this.Subtype !== subtype.value) {
                                return false;
                            }
                            i = subtype.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subtype property value");
                        }
                        break;
                    case "/FormType":
                        const formType = parser.parseNumberAt(i, false);
                        if (formType) {
                            if (formType.value !== 1) {
                                return false;
                            }
                            i = formType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subtype property value");
                        }
                        break;
                    case "/BBox":
                        const boundingBox = parser.parseNumberArrayAt(i, true);
                        if (boundingBox) {
                            this.BBox = [
                                boundingBox.value[0],
                                boundingBox.value[1],
                                boundingBox.value[2],
                                boundingBox.value[3],
                            ];
                            i = boundingBox.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /BBox property value");
                        }
                        break;
                    case "/Matrix":
                        const matrix = parser.parseNumberArrayAt(i, true);
                        if (matrix) {
                            this.Matrix = [
                                matrix.value[0],
                                matrix.value[1],
                                matrix.value[2],
                                matrix.value[3],
                                matrix.value[4],
                                matrix.value[5],
                            ];
                            i = matrix.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Matrix property value");
                        }
                        break;
                    case "/Resources":
                        const resEntryType = parser.getValueTypeAt(i);
                        if (resEntryType === valueTypes.REF) {
                            const resDictId = ObjectId.parseRef(parser, i);
                            if (resDictId && parseInfo.parseInfoGetter) {
                                const resParseInfo = parseInfo.parseInfoGetter(resDictId.value.id);
                                if (resParseInfo) {
                                    const resDict = ResourceDict.parse(resParseInfo);
                                    if (resDict) {
                                        this.Resources = resDict.value;
                                        i = resDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /Resources value reference");
                        }
                        else if (resEntryType === valueTypes.DICTIONARY) {
                            const resDictBounds = parser.getDictBoundsAt(i);
                            if (resDictBounds) {
                                if (resDictBounds.contentStart) {
                                    const resDict = ResourceDict.parse({
                                        parser,
                                        bounds: resDictBounds,
                                        parseInfoGetter: parseInfo.parseInfoGetter,
                                    });
                                    if (resDict) {
                                        this.Resources = resDict.value;
                                    }
                                    else {
                                        throw new Error("Can't parse /Resources value dictionary");
                                    }
                                }
                                i = resDictBounds.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /Resources dictionary bounds");
                        }
                        throw new Error(`Unsupported /Resources property value type: ${resEntryType}`);
                    case "/Metadata":
                        const metaId = ObjectId.parseRef(parser, i);
                        if (metaId) {
                            this.Metadata = metaId.value;
                            i = metaId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Metadata property value");
                        }
                        break;
                    case "/LastModified":
                        const date = DateString.parse(parser, i, parseInfo.cryptInfo);
                        if (date) {
                            this.LastModified = date.value;
                            i = date.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LastModified property value");
                        }
                        break;
                    case "/StructParent":
                        const parentKey = parser.parseNumberAt(i, false);
                        if (parentKey) {
                            this.StructParent = parentKey.value;
                            i = parentKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StructParent property value");
                        }
                        break;
                    case "/StructParents":
                        const parentsKey = parser.parseNumberAt(i, false);
                        if (parentsKey) {
                            this.StructParents = parentsKey.value;
                            i = parentsKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StructParents property value");
                        }
                        break;
                    case "/Measure":
                        const measureEntryType = parser.getValueTypeAt(i);
                        if (measureEntryType === valueTypes.REF) {
                            const measureDictId = ObjectId.parseRef(parser, i);
                            if (measureDictId && parseInfo.parseInfoGetter) {
                                const measureParseInfo = parseInfo.parseInfoGetter(measureDictId.value.id);
                                if (measureParseInfo) {
                                    const measureDict = MeasureDict.parse(measureParseInfo);
                                    if (measureDict) {
                                        this.Measure = measureDict.value;
                                        i = measureDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /Measure value reference");
                        }
                        else if (measureEntryType === valueTypes.DICTIONARY) {
                            const measureDictBounds = parser.getDictBoundsAt(i);
                            if (measureDictBounds) {
                                const measureDict = MeasureDict
                                    .parse({ parser, bounds: measureDictBounds, cryptInfo: parseInfo.cryptInfo });
                                if (measureDict) {
                                    this.Measure = measureDict.value;
                                    i = measureDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /Measure value dictionary");
                        }
                        throw new Error(`Unsupported /Measure property value type: ${measureEntryType}`);
                    case "/Group":
                        const groupEntryType = parser.getValueTypeAt(i);
                        if (groupEntryType === valueTypes.REF) {
                            const groupDictId = ObjectId.parseRef(parser, i);
                            if (groupDictId && parseInfo.parseInfoGetter) {
                                const groupParseInfo = parseInfo.parseInfoGetter(groupDictId.value.id);
                                if (groupParseInfo) {
                                    const groupDict = TransparencyGroupDict.parse(groupParseInfo);
                                    if (groupDict) {
                                        this.Group = groupDict.value;
                                        i = groupDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /Group value reference");
                        }
                        else if (groupEntryType === valueTypes.DICTIONARY) {
                            const groupDictBounds = parser.getDictBoundsAt(i);
                            if (groupDictBounds) {
                                const groupDict = TransparencyGroupDict
                                    .parse({ parser, bounds: groupDictBounds, cryptInfo: parseInfo.cryptInfo });
                                if (groupDict) {
                                    this.Group = groupDict.value;
                                    i = groupDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /Group value dictionary");
                        }
                        throw new Error(`Unsupported /Group property value type: ${groupEntryType}`);
                    case "/OC":
                    case "/OPI":
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.BBox) {
            return false;
        }
        const chars = [];
        this.decodedStreamData.forEach(x => chars.push(String.fromCharCode(x)));
        console.log(chars.join(""));
        return true;
    }
}

class AppearanceDict extends PdfDict {
    constructor() {
        super(null);
        this._streamsMap = new Map();
    }
    static parse(parseInfo) {
        const appearance = new AppearanceDict();
        const parseResult = appearance.tryParseProps(parseInfo);
        return parseResult
            ? { value: appearance, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    fillStreamsMap(parseInfoGetter) {
        this._streamsMap.clear();
        for (const prop of ["N", "R", "D"]) {
            if (this[prop]) {
                if (this[prop] instanceof ObjectId) {
                    const streamParseInfo = parseInfoGetter(this[prop].id);
                    if (!streamParseInfo) {
                        continue;
                    }
                    const stream = XFormStream.parse(streamParseInfo);
                    if (!stream) {
                        continue;
                    }
                    if (stream) {
                        this._streamsMap.set(`/${prop}`, stream.value);
                    }
                }
                else {
                    for (const [name, objectId] of this[prop].getProps()) {
                        const streamParseInfo = parseInfoGetter(objectId.id);
                        if (!streamParseInfo) {
                            continue;
                        }
                        const stream = XFormStream.parse(streamParseInfo);
                        if (stream) {
                            this._streamsMap.set(`/${prop}${name}`, stream.value);
                        }
                    }
                }
            }
        }
    }
    getStream(key) {
        return this._streamsMap.get(key);
    }
    *getStreams() {
        for (const pair of this._streamsMap) {
            yield pair[1];
        }
        return;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.N) {
            bytes.push(...encoder.encode("/N"));
            if (this.N instanceof ObjectMapDict) {
                bytes.push(...this.N.toArray(cryptInfo));
            }
            else {
                bytes.push(...this.N.toArray(cryptInfo));
            }
        }
        if (this.R) {
            bytes.push(...encoder.encode("/R"));
            if (this.R instanceof ObjectMapDict) {
                bytes.push(...this.R.toArray(cryptInfo));
            }
            else {
                bytes.push(...this.R.toArray(cryptInfo));
            }
        }
        if (this.D) {
            bytes.push(...encoder.encode("/D"));
            if (this.D instanceof ObjectMapDict) {
                bytes.push(...this.D.toArray(cryptInfo));
            }
            else {
                bytes.push(...this.D.toArray(cryptInfo));
            }
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/N":
                        const nEntryType = parser.getValueTypeAt(i);
                        if (nEntryType === valueTypes.REF) {
                            const nRefId = ObjectId.parseRef(parser, i);
                            if (nRefId) {
                                this.N = nRefId.value;
                                i = nRefId.end + 1;
                                break;
                            }
                        }
                        else if (nEntryType === valueTypes.DICTIONARY) {
                            const nDictBounds = parser.getDictBoundsAt(i);
                            if (nDictBounds) {
                                const nSubDict = ObjectMapDict.parse({ parser, bounds: nDictBounds });
                                if (nSubDict) {
                                    this.N = nSubDict.value;
                                    i = nSubDict.end + 1;
                                    break;
                                }
                            }
                        }
                        else {
                            console.log(parser.sliceChars(i - 5, i + 10));
                            throw new Error(`Unsupported /N property value type: ${nEntryType}`);
                        }
                        throw new Error("Can't parse /N property value");
                    case "/R":
                        const rEntryType = parser.getValueTypeAt(i);
                        if (rEntryType === valueTypes.REF) {
                            const rRefId = ObjectId.parseRef(parser, i);
                            if (rRefId) {
                                this.R = rRefId.value;
                                i = rRefId.end + 1;
                                break;
                            }
                        }
                        else if (rEntryType === valueTypes.DICTIONARY) {
                            const rDictBounds = parser.getDictBoundsAt(i);
                            if (rDictBounds) {
                                const rSubDict = ObjectMapDict.parse({ parser, bounds: rDictBounds });
                                if (rSubDict) {
                                    this.R = rSubDict.value;
                                    i = rSubDict.end + 1;
                                    break;
                                }
                            }
                        }
                        else {
                            throw new Error(`Unsupported /R property value type: ${rEntryType}`);
                        }
                        throw new Error("Can't parse /R property value");
                    case "/D":
                        const dEntryType = parser.getValueTypeAt(i);
                        if (dEntryType === valueTypes.REF) {
                            const dRefId = ObjectId.parseRef(parser, i);
                            if (dRefId) {
                                this.D = dRefId.value;
                                i = dRefId.end + 1;
                                break;
                            }
                        }
                        else if (dEntryType === valueTypes.DICTIONARY) {
                            const dDictBounds = parser.getDictBoundsAt(i);
                            if (dDictBounds) {
                                const dSubDict = ObjectMapDict.parse({ parser, bounds: dDictBounds });
                                if (dSubDict) {
                                    this.D = dSubDict.value;
                                    i = dSubDict.end + 1;
                                    break;
                                }
                            }
                        }
                        else {
                            throw new Error(`Unsupported /D property value type: ${dEntryType}`);
                        }
                        throw new Error("Can't parse /D property value");
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.N) {
            return false;
        }
        if (parseInfo.parseInfoGetter) {
            this.fillStreamsMap(parseInfo.parseInfoGetter);
        }
        return true;
    }
}

const borderEffects = {
    NONE: "/S",
    CLOUDY: "/C",
};
class BorderEffectDict extends PdfDict {
    constructor() {
        super(null);
        this.S = borderEffects.NONE;
        this.L = 0;
    }
    static parse(parseInfo) {
        const borderEffect = new BorderEffectDict();
        const parseResult = borderEffect.tryParseProps(parseInfo);
        return parseResult
            ? { value: borderEffect, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.S) {
            bytes.push(...encoder.encode("/S"), ...encoder.encode(this.S));
        }
        if (this.L) {
            bytes.push(...encoder.encode("/L"), ...encoder.encode(" " + this.L));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/S":
                        const style = parser.parseNameAt(i, true);
                        if (style && Object.values(borderEffects).includes(style.value)) {
                            this.S = style.value;
                            i = style.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /S property value");
                        }
                        break;
                    case "/L":
                        const intensity = parser.parseNumberAt(i, true);
                        if (intensity) {
                            this.L = Math.min(Math.max(0, intensity.value), 2);
                            i = intensity.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /L property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class BorderArray {
    constructor(hCornerR, vCornerR, width, dash, gap) {
        this.hCornerR = hCornerR !== null && hCornerR !== void 0 ? hCornerR : 0;
        this.vCornerR = vCornerR !== null && vCornerR !== void 0 ? vCornerR : 0;
        this.width = width !== null && width !== void 0 ? width : 1;
        this.dash = dash !== null && dash !== void 0 ? dash : 3;
        this.gap = gap !== null && gap !== void 0 ? gap : 0;
    }
    static parse(parser, start, skipEmpty = true) {
        if (skipEmpty) {
            start = parser.findRegularIndex("straight", start);
        }
        if (start < 0 || start > parser.maxIndex
            || parser.getCharCode(start) !== codes.L_BRACKET) {
            return null;
        }
        const hCornerR = parser.parseNumberAt(start + 1);
        if (!hCornerR || isNaN(hCornerR.value)) {
            return null;
        }
        const vCornerR = parser.parseNumberAt(hCornerR.end + 2);
        if (!vCornerR || isNaN(vCornerR.value)) {
            return null;
        }
        const width = parser.parseNumberAt(vCornerR.end + 2);
        if (!width || isNaN(width.value)) {
            return null;
        }
        const next = parser.findNonSpaceIndex("straight", width.end + 1);
        if (!next) {
            return null;
        }
        else if (parser.getCharCode(next) === codes.R_BRACKET) {
            return {
                value: new BorderArray(hCornerR.value, vCornerR.value, width.value),
                start,
                end: next,
            };
        }
        else if (parser.getCharCode(next) === codes.L_BRACKET) {
            const dash = parser.parseNumberAt(next + 1);
            if (!dash || isNaN(dash.value)) {
                return null;
            }
            const gap = parser.parseNumberAt(dash.end + 2);
            if (!gap || isNaN(gap.value)) {
                return null;
            }
            const dashEnd = parser.findNonSpaceIndex("straight", gap.end + 1);
            if (!dashEnd || parser.getCharCode(dashEnd) !== codes.R_BRACKET) {
                return null;
            }
            const arrayEnd = parser.findNonSpaceIndex("straight", dashEnd + 1);
            if (!arrayEnd || parser.getCharCode(arrayEnd) !== codes.R_BRACKET) {
                return null;
            }
            return {
                value: new BorderArray(hCornerR.value, vCornerR.value, width.value, dash.value, gap.value),
                start,
                end: arrayEnd,
            };
        }
        return null;
    }
    toArray(cryptInfo) {
        const source = this.dash && this.gap
            ? `[${this.hCornerR} ${this.vCornerR} ${this.width}]`
            : `[${this.hCornerR} ${this.vCornerR} ${this.width} [${this.dash} ${this.gap}]]`;
        return new TextEncoder().encode(source);
    }
}

class HexString {
    constructor(literal, hex, bytes) {
        this.literal = literal;
        this.hex = hex;
        this.bytes = bytes;
    }
    static parse(parser, start, cryptInfo = null, skipEmpty = true) {
        const bounds = parser.getHexBounds(start, skipEmpty);
        if (!bounds) {
            return null;
        }
        let bytes = parser.sliceCharCodes(bounds.start + 1, bounds.end - 1);
        if ((cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) && cryptInfo.stringCryptor) {
            bytes = cryptInfo.stringCryptor.decrypt(bytes, cryptInfo.ref);
        }
        const hex = HexString.fromBytes(bytes);
        return { value: hex, start: bounds.start, end: bounds.end };
    }
    static parseArray(parser, start, cryptInfo = null, skipEmpty = true) {
        const arrayBounds = parser.getArrayBoundsAt(start, skipEmpty);
        if (!arrayBounds) {
            return null;
        }
        const hexes = [];
        let current;
        let i = arrayBounds.start + 1;
        while (i < arrayBounds.end) {
            current = HexString.parse(parser, i, cryptInfo, skipEmpty);
            if (!current) {
                break;
            }
            hexes.push(current.value);
            i = current.end + 1;
        }
        return { value: hexes, start: arrayBounds.start, end: arrayBounds.end };
    }
    static fromBytes(bytes) {
        const literal = new TextDecoder().decode(bytes);
        const hex = hexStringToBytes(literal);
        return new HexString(literal, hex, bytes);
    }
    static fromHexBytes(hex) {
        let literal = "";
        hex.forEach(x => literal += x.toString(16).padStart(2, "0"));
        const bytes = new TextEncoder().encode(literal);
        return new HexString(literal, hex, bytes);
    }
    static fromLiteralString(literal) {
        const hex = hexStringToBytes(literal);
        const bytes = new TextEncoder().encode(literal);
        return new HexString(literal, hex, bytes);
    }
    ;
    toArray(cryptInfo) {
        return new Uint8Array([
            ...keywordCodes.STR_HEX_START,
            ...this.bytes,
            ...keywordCodes.STR_HEX_END,
        ]);
    }
}

class TextState {
    constructor(params) {
        Object.assign(this, TextState.defaultParams, params);
    }
    clone(params) {
        const copy = new TextState(this);
        if (params) {
            return Object.assign(copy, params);
        }
        return copy;
    }
}
TextState.defaultParams = {
    fontFamily: "helvetica, sans-serif",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "normal",
    wordSpacing: "normal",
    textHorScale: 1,
    textRenderMode: textRenderModes.FILL,
    textVertAlign: "0",
    textKnockOut: true,
};

class GraphicsState {
    constructor(params) {
        var _a, _b, _c, _d;
        Object.assign(this, GraphicsState.defaultParams, params);
        this.matrix = (_a = this.matrix) === null || _a === void 0 ? void 0 : _a.clone();
        this.textState = (_b = this.textState) === null || _b === void 0 ? void 0 : _b.clone();
        this.strokeColor = (_c = this.strokeColor) === null || _c === void 0 ? void 0 : _c.clone();
        this.fillColor = (_d = this.fillColor) === null || _d === void 0 ? void 0 : _d.clone();
    }
    get stroke() {
        const { x: r, y: g, z: b } = this.strokeColor;
        const a = this.strokeAlpha;
        return `rgba(${r},${g},${b},${a})`;
    }
    get fill() {
        const { x: r, y: g, z: b } = this.fillColor;
        const a = this.fillAlpha;
        return `rgba(${r},${g},${b},${a})`;
    }
    clone(params) {
        const copy = new GraphicsState(this);
        if (params) {
            return Object.assign(copy, params);
        }
        return copy;
    }
    setColor(type, ...params) {
        let r, g, b;
        switch (params.length) {
            case 1:
                r = g = b = params[0] * 255;
                break;
            case 3:
                r = params[0] * 255;
                g = params[1] * 255;
                b = params[2] * 255;
                break;
            case 4:
                const [c, m, y, k] = params;
                r = 255 * (1 - c) * (1 - k);
                g = 255 * (1 - m) * (1 - k);
                b = 255 * (1 - y) * (1 - k);
                break;
        }
        if (type === "stroke") {
            this.strokeColor.set(r, g, b);
        }
        else {
            this.fillColor.set(r, g, b);
        }
    }
}
GraphicsState.defaultParams = {
    matrix: new Mat3(),
    textState: new TextState(),
    strokeColorSpace: "rgb",
    strokeAlpha: 1,
    strokeColor: new Vec3(),
    fillColorSpace: "rgb",
    fillAlpha: 1,
    fillColor: new Vec3(),
    strokeWidth: 1,
    strokeMiterLimit: 10,
    strokeLineCap: "square",
    strokeLineJoin: "miter",
};

class AppearanceStreamRenderer {
    constructor(stream, rect, objectName) {
        this._clipPaths = [];
        this._graphicsStates = [];
        if (!stream) {
            throw new Error("Stream is not defined");
        }
        this._stream = stream;
        this._parser = new DataParser(stream.decodedStreamData);
        this._rect = rect;
        this._objectName = objectName;
        const matAA = AppearanceStreamRenderer.calcBBoxToRectMatrix(stream, rect);
        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.id = `clip0_${objectName}`;
        clipPath.innerHTML = `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}" />`;
        this._clipPaths.push(clipPath);
        this._graphicsStates.push(new GraphicsState({ matrix: matAA }));
    }
    get state() {
        return this._graphicsStates[this._graphicsStates.length - 1];
    }
    static calcBBoxToRectMatrix(stream, rect) {
        const matrix = stream.matrix;
        const { ll: bBoxLL, lr: bBoxLR, ur: bBoxUR, ul: bBoxUL } = stream.bBox;
        const { min: appBoxMin, max: appBoxMax } = vecMinMax(Vec2.applyMat3(bBoxLL, matrix), Vec2.applyMat3(bBoxLR, matrix), Vec2.applyMat3(bBoxUR, matrix), Vec2.applyMat3(bBoxUL, matrix));
        const rectMin = new Vec2(rect[0], rect[1]);
        const rectMax = new Vec2(rect[2], rect[3]);
        const matA = mat3From4Vec2(appBoxMin, appBoxMax, rectMin, rectMax);
        const matAA = Mat3.fromMat3(matrix).multiply(matA);
        return matAA;
    }
    static parseNextCommand(parser, i) {
        const parameters = [];
        let operator;
        command: while (!operator) {
            const nextValueType = parser.getValueTypeAt(i, true);
            switch (nextValueType) {
                case valueTypes.NUMBER:
                    const numberResult = parser.parseNumberAt(i, true);
                    parameters.push(numberResult.value);
                    i = numberResult.end + 1;
                    break;
                case valueTypes.NAME:
                    const nameResult = parser.parseNameAt(i, true);
                    parameters.push(nameResult.value);
                    i = nameResult.end + 1;
                    break;
                case valueTypes.ARRAY:
                    const arrayBounds = parser.getArrayBoundsAt(i);
                    const numberArrayResult = parser.parseNumberArrayAt(i, true);
                    if (numberArrayResult) {
                        const dashArray = numberArrayResult.value;
                        if (dashArray.length === 2) {
                            parameters.push(...dashArray);
                        }
                        else if (dashArray.length === 1) {
                            parameters.push(dashArray[0], 0);
                        }
                        else {
                            parameters.push(3, 0);
                        }
                    }
                    else {
                        throw new Error(`Invalid appearance stream array: 
            ${parser.sliceChars(arrayBounds.start, arrayBounds.end)}`);
                    }
                    i = arrayBounds.end + 1;
                    break;
                case valueTypes.STRING_LITERAL:
                    const literalResult = LiteralString.parse(parser, i);
                    parameters.push(literalResult.value.literal);
                    i = literalResult.end + 1;
                    break;
                case valueTypes.STRING_HEX:
                    const hexResult = HexString.parse(parser, i);
                    parameters.push(hexResult.value.hex);
                    i = hexResult.end + 1;
                    break;
                case valueTypes.UNKNOWN:
                    const operatorResult = parser.parseStringAt(i);
                    operator = operatorResult.value;
                    i = operatorResult.end + 1;
                    break command;
                default:
                    throw new Error(`Invalid appearance stream value type: ${nextValueType}`);
            }
        }
        return { endIndex: i, parameters, operator };
    }
    render() {
        const g = this.drawGroup(this._parser);
        return {
            svg: g,
            clipPaths: this._clipPaths,
        };
    }
    pushState(params) {
        const lastState = this._graphicsStates[this._graphicsStates.length - 1];
        const newState = lastState.clone(params);
        this._graphicsStates.push(newState);
    }
    popState() {
        if (this._graphicsStates.length === 1) {
            return null;
        }
        return this._graphicsStates.pop();
    }
    drawPath(d, stroke, fill, close = false, evenOdd = false) {
        if (close && d[d.length - 1] !== "Z") {
            d += " Z";
        }
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`);
        path.setAttribute("clipPath", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`);
        path.setAttribute("d", d);
        if (this.state.mixBlendMode) {
            path.setAttribute("mix-blend-mode", this.state.mixBlendMode);
        }
        if (fill) {
            path.setAttribute("fill", this.state.fill);
            path.setAttribute("fill-rule", evenOdd ? "evenodd" : "nonzero");
        }
        else {
            path.setAttribute("fill", "none");
        }
        if (stroke) {
            path.setAttribute("stroke", this.state.stroke);
            path.setAttribute("stroke-width", this.state.strokeWidth + "");
            path.setAttribute("stroke-miterlimit", this.state.strokeMiterLimit + "");
            path.setAttribute("stroke-linecap", this.state.strokeLineCap);
            path.setAttribute("stroke-linejoin", this.state.strokeLineJoin);
            if (this.state.strokeDashArray) {
                path.setAttribute("stroke-dasharray", this.state.strokeDashArray);
            }
            if (this.state.strokeDashOffset) {
                path.setAttribute("stroke-dashoffset", this.state.strokeDashOffset + "");
            }
        }
        else {
            path.setAttribute("stroke", "none");
        }
        return path;
    }
    drawText(value) {
        throw new Error("Method is not implemented");
    }
    drawTextGroup(parser) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        let i = 0;
        while (i !== -1) {
            const { endIndex, parameters, operator } = AppearanceStreamRenderer.parseNextCommand(parser, i);
            i = parser.skipEmpty(endIndex + 1);
        }
        return g;
    }
    drawGroup(parser) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const lastCoord = new Vec2();
        let lastOperator;
        let d = "";
        const addPath = (path) => {
            g.append(path);
            d = "";
        };
        let i = 0;
        while (i !== -1) {
            const { endIndex, parameters, operator } = AppearanceStreamRenderer.parseNextCommand(parser, i);
            i = parser.skipEmpty(endIndex + 1);
            switch (operator) {
                case "q":
                    this.pushState();
                    break;
                case "Q":
                    this.popState();
                    break;
                case "gs":
                    const externalState = this._stream.Resources.getGraphicsState(`/ExtGState${parameters[0]}`);
                    if (!externalState) {
                        throw new Error("External state specified in appearance stream not found");
                    }
                    const params = externalState.toParams();
                    Object.assign(this.state, params);
                    break;
                case "cm":
                    const [m0, m1, m3, m4, m6, m7] = parameters;
                    const matrix = new Mat3().set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
                    this.state.matrix.multiply(matrix);
                    break;
                case "w":
                    this.state.strokeWidth = +parameters[0] || 1;
                    break;
                case "J":
                    switch (parameters[0]) {
                        case lineCapStyles.ROUND:
                            this.state.strokeLineCap = "round";
                            break;
                        case lineCapStyles.SQUARE:
                            this.state.strokeLineCap = "square";
                            break;
                        case lineCapStyles.BUTT:
                        default:
                            this.state.strokeLineCap = "butt";
                            break;
                    }
                    break;
                case "j":
                    switch (parameters[0]) {
                        case lineJoinStyles.BEVEL:
                            this.state.strokeLineJoin = "bevel";
                            break;
                        case lineJoinStyles.ROUND:
                            this.state.strokeLineJoin = "round";
                            break;
                        case lineJoinStyles.MITER:
                        default:
                            this.state.strokeLineJoin = "miter";
                            break;
                    }
                    break;
                case "M":
                    this.state.strokeMiterLimit = +parameters[0] || 10;
                    break;
                case "d":
                    this.state.strokeDashArray = `${parameters[0]} ${parameters[1]}`;
                    this.state.strokeDashOffset = +parameters[2];
                    break;
                case "CS":
                    switch (parameters[0]) {
                        case colorSpaces.GRAYSCALE:
                            this.state.strokeColorSpace = "grayscale";
                            break;
                        case colorSpaces.RGB:
                            this.state.strokeColorSpace = "rgb";
                            break;
                        case colorSpaces.CMYK:
                            this.state.strokeColorSpace = "cmyk";
                            break;
                        default:
                            throw new Error("Unsupported color space in appearance stream");
                    }
                    break;
                case "cs":
                    switch (parameters[0]) {
                        case colorSpaces.GRAYSCALE:
                            this.state.fillColorSpace = "grayscale";
                            break;
                        case colorSpaces.RGB:
                            this.state.fillColorSpace = "rgb";
                            break;
                        case colorSpaces.CMYK:
                            this.state.fillColorSpace = "cmyk";
                            break;
                        default:
                            throw new Error("Unsupported color space in appearance stream");
                    }
                    break;
                case "G":
                    this.state.strokeColorSpace = "grayscale";
                    this.state.setColor("stroke", ...parameters);
                    break;
                case "g":
                    this.state.fillColorSpace = "grayscale";
                    this.state.setColor("fill", ...parameters);
                    break;
                case "RG":
                    this.state.strokeColorSpace = "rgb";
                    this.state.setColor("stroke", ...parameters);
                    break;
                case "rg":
                    this.state.fillColorSpace = "rgb";
                    this.state.setColor("fill", ...parameters);
                    break;
                case "K":
                    this.state.strokeColorSpace = "cmyk";
                    this.state.setColor("stroke", ...parameters);
                    break;
                case "k":
                    this.state.fillColorSpace = "cmyk";
                    this.state.setColor("fill", ...parameters);
                    break;
                case "SC":
                    this.state.setColor("stroke", ...parameters);
                    break;
                case "cs":
                    this.state.setColor("fill", ...parameters);
                    break;
                case "ri":
                case "i":
                    break;
                case "m":
                    const move = new Vec2(+parameters[0], +parameters[1]);
                    d += ` M ${move.x} ${move.y}`;
                    lastCoord.setFromVec2(move);
                    break;
                case "l":
                    const line = new Vec2(+parameters[0], +parameters[1]);
                    d += ` L ${line.x} ${line.y}`;
                    lastCoord.setFromVec2(line);
                    break;
                case "re":
                    const rMin = new Vec2(+parameters[0], +parameters[1]);
                    const rMax = new Vec2(+parameters[2], +parameters[3]).add(rMin);
                    d += ` M ${rMin.x} ${rMin.y} L ${rMax.x} ${rMin.y} L ${rMax.x} ${rMax.y} L ${rMin.x} ${rMax.y} L ${rMin.x} ${rMin.y}`;
                    lastCoord.setFromVec2(rMin);
                    break;
                case "c":
                    const cControl1 = new Vec2(+parameters[0], +parameters[1]);
                    const cControl2 = new Vec2(+parameters[2], +parameters[3]);
                    const cEnd = new Vec2(+parameters[4], +parameters[5]);
                    d += ` C ${cControl1.x} ${cControl1.y}, ${cControl2.x} ${cControl2.y}, ${cEnd.x} ${cEnd.y}`;
                    lastCoord.setFromVec2(cEnd);
                    break;
                case "v":
                    const vControl2 = new Vec2(+parameters[0], +parameters[1]);
                    const vEnd = new Vec2(+parameters[2], +parameters[3]);
                    d += ` C ${lastCoord.x} ${lastCoord.y}, ${vControl2.x} ${vControl2.y}, ${vEnd.x} ${vEnd.y}`;
                    lastCoord.setFromVec2(vEnd);
                    break;
                case "y":
                    const yControl1 = new Vec2(+parameters[0], +parameters[1]);
                    const yEnd = new Vec2(+parameters[2], +parameters[3]);
                    d += ` C ${yControl1.x} ${yControl1.y}, ${yEnd.x} ${yEnd.y}, ${yEnd.x} ${yEnd.y}`;
                    lastCoord.setFromVec2(yEnd);
                    break;
                case "h":
                    d += " Z";
                    break;
                case "S":
                    addPath(this.drawPath(d, true, false));
                    break;
                case "s":
                    addPath(this.drawPath(d, true, false, true));
                    break;
                case "F":
                case "f":
                    addPath(this.drawPath(d, false, true, true));
                    break;
                case "F*":
                case "f*":
                    addPath(this.drawPath(d, false, true, true, true));
                    break;
                case "B":
                    addPath(this.drawPath(d, true, true, false, false));
                    break;
                case "B*":
                    addPath(this.drawPath(d, true, true, false, true));
                    break;
                case "b":
                    addPath(this.drawPath(d, true, true, true, false));
                    break;
                case "b*":
                    addPath(this.drawPath(d, true, true, true, true));
                    break;
                case "n":
                    if (lastOperator === "W" || lastOperator === "W*") {
                        if (d[d.length - 1] !== "Z") {
                            d += " Z";
                        }
                        const clippingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        clippingPath.setAttribute("d", d);
                        const lastCpIndex = this._clipPaths.length - 1;
                        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
                        clipPath.setAttribute("clip-rule", lastOperator === "W" ? "nonzero" : "evenodd");
                        clipPath.setAttribute("clip-path", `url(#${this._clipPaths[lastCpIndex]})`);
                        clipPath.id = `clip${lastCpIndex + 1}_${this._objectName}`;
                        clipPath.append(clippingPath);
                        this._clipPaths.push(clipPath);
                        this.state.clipPath = clipPath;
                    }
                    d = "";
                    break;
                case "W":
                    break;
                case "W*":
                    break;
                case "BT":
                    const textObjectEnd = parser.findSubarrayIndex([codes.E, codes.T], {
                        closedOnly: true,
                        minIndex: i,
                    });
                    if (textObjectEnd) {
                        const textGroup = this.drawTextGroup(new DataParser(parser.sliceCharCodes(i, textObjectEnd.start - 1)));
                        g.append(textGroup);
                        i = parser.skipEmpty(textObjectEnd.end + 1);
                        break;
                    }
                    throw new Error("Can't find the appearance stream text object end");
                case "Do":
                    const stream = this._stream.Resources.getXObject((`/XObject${parameters[0]}`));
                    if (!stream) {
                        throw new Error(`External object not found in the appearance stream resources: ${parameters[0]}`);
                    }
                    if (stream instanceof XFormStream) {
                        const subGroup = this.drawGroup(new DataParser(stream.decodedStreamData));
                        g.append(subGroup);
                    }
                    else if (stream instanceof ImageStream) {
                        throw new Error("Unsupported appearance stream external object type: 'Image'");
                    }
                    else {
                        throw new Error(`Unsupported appearance stream external object: ${parameters[0]}`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported appearance stream operator: ${operator}`);
            }
            lastOperator = operator;
        }
        return g;
    }
}

class AnnotationDict extends PdfDict {
    constructor(subType) {
        super(dictTypes.ANNOTATION);
        this.F = 0;
        this.Border = new BorderArray(0, 0, 1);
        this._svgId = getRandomUuid();
        this._svgMatrix = new Mat3();
        this._moveStartPoint = new Vec2();
        this._moveMatrix = new Mat3();
        this.onRectPointerDown = (e) => {
            document.addEventListener("pointerup", this.onRectPointerUp);
            document.addEventListener("pointerout", this.onRectPointerUp);
            this._moveStartTimer = setTimeout(() => {
                this._moveStartTimer = null;
                this._svg.after(this._svgCopy);
                this._moveStartPoint.set(e.clientX, e.clientY);
                document.addEventListener("pointermove", this.onRectPointerMove);
            }, 200);
        };
        this.onRectPointerMove = (e) => {
            this._moveMatrix.reset()
                .applyTranslation(e.clientX - this._moveStartPoint.x, -1 * (e.clientY - this._moveStartPoint.y));
            this._svgCopyUse.setAttribute("transform", `matrix(${this._moveMatrix.toFloatShortArray().join(" ")})`);
        };
        this.onRectPointerUp = () => {
            document.removeEventListener("pointermove", this.onRectPointerMove);
            document.removeEventListener("pointerup", this.onRectPointerUp);
            document.removeEventListener("pointerout", this.onRectPointerUp);
            if (this._moveStartTimer) {
                clearTimeout(this._moveStartTimer);
                this._moveStartTimer = null;
                return;
            }
            this._svgCopy.remove();
            this._svgCopyUse.setAttribute("transform", "matrix(1 0 0 1 0 0)");
            this.applyRectTransform(this._moveMatrix);
            this._moveMatrix.reset();
        };
        this.onHandlePointerDown = (e) => {
        };
        this.onHandlePointerMove = (e) => {
        };
        this.onHandlePointerUp = (e) => {
        };
        this.Subtype = subType;
    }
    get apStream() {
        var _a;
        return (_a = this.AP) === null || _a === void 0 ? void 0 : _a.getStream("/N");
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Subtype) {
            bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
        }
        if (this.Rect) {
            bytes.push(...encoder.encode("/Rect"), codes.L_BRACKET, ...encoder.encode(this.Rect[0] + ""), codes.WHITESPACE, ...encoder.encode(this.Rect[1] + ""), codes.WHITESPACE, ...encoder.encode(this.Rect[2] + ""), codes.WHITESPACE, ...encoder.encode(this.Rect[3] + ""), codes.R_BRACKET);
        }
        if (this.Contents) {
            bytes.push(...encoder.encode("/Contents"), ...this.Contents.toArray(cryptInfo));
        }
        if (this.P) {
            bytes.push(...encoder.encode("/P"), codes.WHITESPACE, ...this.P.toArray(cryptInfo));
        }
        if (this.NM) {
            bytes.push(...encoder.encode("/NM"), ...this.NM.toArray(cryptInfo));
        }
        if (this.M) {
            bytes.push(...encoder.encode("/M"), ...this.M.toArray(cryptInfo));
        }
        if (this.F) {
            bytes.push(...encoder.encode("/F"), ...encoder.encode(" " + this.F));
        }
        if (this.AP) {
            bytes.push(...encoder.encode("/AP"), ...this.AP.toArray(cryptInfo));
        }
        if (this.AS) {
            bytes.push(...encoder.encode("/AS"), ...encoder.encode(this.AS));
        }
        if (this.Border) {
            bytes.push(...encoder.encode("/Border"), ...this.Border.toArray(cryptInfo));
        }
        if (this.BS) {
            bytes.push(...encoder.encode("/BS"), ...this.BS.toArray(cryptInfo));
        }
        if (this.BE) {
            bytes.push(...encoder.encode("/BE"), ...this.BE.toArray(cryptInfo));
        }
        if (this.C) {
            bytes.push(...encoder.encode("/C"), codes.L_BRACKET);
            this.C.forEach(x => bytes.push(...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.StructParent) {
            bytes.push(...encoder.encode("/StructParent"), ...encoder.encode(" " + this.StructParent));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    render() {
        if (!this._svg) {
            const rect = this.renderRect();
            const { copy, use } = this.renderRectCopy();
            this._svg = rect;
            this._svgCopy = copy;
            this._svgCopyUse = use;
        }
        this.updateRender();
        return {
            svg: this._svg,
            clipPaths: this._svgClipPaths,
        };
    }
    tryParseProps(parseInfo) {
        var _a;
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Subtype":
                        const subtype = parser.parseNameAt(i);
                        if (subtype) {
                            if (this.Subtype && this.Subtype !== subtype.value) {
                                return false;
                            }
                            i = subtype.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subtype property value");
                        }
                        break;
                    case "/Contents":
                        const contents = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (contents) {
                            this.Contents = contents.value;
                            i = contents.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Contents property value");
                        }
                        break;
                    case "/Rect":
                        const rect = parser.parseNumberArrayAt(i, true);
                        if (rect) {
                            this.Rect = [
                                rect.value[0],
                                rect.value[1],
                                rect.value[2],
                                rect.value[3],
                            ];
                            i = rect.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Rect property value");
                        }
                        break;
                    case "/P":
                        const pageId = ObjectId.parseRef(parser, i);
                        if (pageId) {
                            this.P = pageId.value;
                            i = pageId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /P property value");
                        }
                        break;
                    case "/NM":
                        const uniqueName = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (uniqueName) {
                            this.NM = uniqueName.value;
                            i = uniqueName.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /NM property value");
                        }
                        break;
                    case "/M":
                        const date = DateString.parse(parser, i, parseInfo.cryptInfo);
                        if (date) {
                            this.M = date.value;
                            i = date.end + 1;
                            break;
                        }
                        else {
                            const dateLiteral = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                            if (dateLiteral) {
                                this.M = dateLiteral.value;
                                i = dateLiteral.end + 1;
                                break;
                            }
                        }
                        throw new Error("Can't parse /M property value");
                    case "/F":
                        const flags = parser.parseNumberAt(i, false);
                        if (flags) {
                            this.F = flags.value;
                            i = flags.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /F property value");
                        }
                        break;
                    case "/C":
                        const color = parser.parseNumberArrayAt(i, true);
                        if (color) {
                            this.C = color.value;
                            i = color.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /C property value");
                        }
                        break;
                    case "/StructParent":
                        const structureKey = parser.parseNumberAt(i, false);
                        if (structureKey) {
                            this.StructParent = structureKey.value;
                            i = structureKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StructParent property value");
                        }
                        break;
                    case "/Border":
                        const borderArray = BorderArray.parse(parser, i);
                        if (borderArray) {
                            this.Border = borderArray.value;
                            i = borderArray.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Border property value");
                        }
                        break;
                    case "/BS":
                        const bsEntryType = parser.getValueTypeAt(i);
                        if (bsEntryType === valueTypes.REF) {
                            const bsDictId = ObjectId.parseRef(parser, i);
                            if (bsDictId && parseInfo.parseInfoGetter) {
                                const bsParseInfo = parseInfo.parseInfoGetter(bsDictId.value.id);
                                if (bsParseInfo) {
                                    const bsDict = BorderStyleDict.parse(bsParseInfo);
                                    if (bsDict) {
                                        this.BS = bsDict.value;
                                        i = bsDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /BS value reference");
                        }
                        else if (bsEntryType === valueTypes.DICTIONARY) {
                            const bsDictBounds = parser.getDictBoundsAt(i);
                            if (bsDictBounds) {
                                const bsDict = BorderStyleDict.parse({ parser, bounds: bsDictBounds });
                                if (bsDict) {
                                    this.BS = bsDict.value;
                                    i = bsDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /BS value dictionary");
                        }
                        throw new Error(`Unsupported /BS property value type: ${bsEntryType}`);
                    case "/BE":
                        const beEntryType = parser.getValueTypeAt(i);
                        if (beEntryType === valueTypes.REF) {
                            const bsDictId = ObjectId.parseRef(parser, i);
                            if (bsDictId && parseInfo.parseInfoGetter) {
                                const bsParseInfo = parseInfo.parseInfoGetter(bsDictId.value.id);
                                if (bsParseInfo) {
                                    const bsDict = BorderEffectDict.parse(bsParseInfo);
                                    if (bsDict) {
                                        this.BE = bsDict.value;
                                        i = bsDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /BE value reference");
                        }
                        else if (beEntryType === valueTypes.DICTIONARY) {
                            const bsDictBounds = parser.getDictBoundsAt(i);
                            if (bsDictBounds) {
                                const bsDict = BorderEffectDict.parse({ parser, bounds: bsDictBounds });
                                if (bsDict) {
                                    this.BE = bsDict.value;
                                    i = bsDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /BE value dictionary");
                        }
                        throw new Error(`Unsupported /BE property value type: ${beEntryType}`);
                    case "/AP":
                        const apEntryType = parser.getValueTypeAt(i);
                        if (apEntryType === valueTypes.REF) {
                            const apDictId = ObjectId.parseRef(parser, i);
                            if (apDictId && parseInfo.parseInfoGetter) {
                                const apParseInfo = parseInfo.parseInfoGetter(apDictId.value.id);
                                if (apParseInfo) {
                                    const apDict = AppearanceDict.parse(apParseInfo);
                                    if (apDict) {
                                        this.AP = apDict.value;
                                        i = apDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /AP value reference");
                        }
                        else if (apEntryType === valueTypes.DICTIONARY) {
                            const apDictBounds = parser.getDictBoundsAt(i);
                            if (apDictBounds) {
                                const apDict = AppearanceDict.parse({
                                    parser,
                                    bounds: apDictBounds,
                                    parseInfoGetter: parseInfo.parseInfoGetter,
                                });
                                if (apDict) {
                                    this.AP = apDict.value;
                                    i = apDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /AP value dictionary");
                        }
                        throw new Error(`Unsupported /AP property value type: ${apEntryType}`);
                    case "/AS":
                        const stateName = parser.parseNameAt(i, true);
                        if (stateName) {
                            this.AS = stateName.value;
                            i = stateName.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /AS property value");
                        }
                        break;
                    case "/OC":
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Subtype || !this.Rect) {
            return false;
        }
        this.name = ((_a = this.NM) === null || _a === void 0 ? void 0 : _a.literal) || getRandomUuid();
        this.pageRect = parseInfo.rect;
        return true;
    }
    renderRectCopy() {
        const copy = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const copyDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const copySymbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
        copySymbol.id = this._svgId + "_symbol";
        const copySymbolUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
        copySymbolUse.setAttribute("href", `#${this._svgId}`);
        copySymbolUse.setAttribute("viewBox", `${this.pageRect[0]} ${this.pageRect[1]} ${this.pageRect[2]} ${this.pageRect[3]}`);
        copySymbol.append(copySymbolUse);
        copyDefs.append(copySymbol);
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", `#${this._svgId}_symbol`);
        use.setAttribute("opacity", "0.2");
        copy.append(copyDefs, use);
        return { copy, use };
    }
    renderRect() {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "g");
        rect.id = this._svgId;
        rect.classList.add("svg-annotation-rect");
        rect.setAttribute("data-annotation-name", this.name);
        rect.addEventListener("pointerdown", this.onRectPointerDown);
        return rect;
    }
    renderRectBg() {
        const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bg.classList.add("svg-rect-bg");
        bg.setAttribute("data-annotation-name", this.name);
        bg.setAttribute("x", this.Rect[0] + "");
        bg.setAttribute("y", this.Rect[1] + "");
        bg.setAttribute("width", this.Rect[2] - this.Rect[0] + "");
        bg.setAttribute("height", this.Rect[3] - this.Rect[1] + "");
        bg.setAttribute("fill", "transparent");
        return bg;
    }
    renderAP() {
        const stream = this.apStream;
        if (stream) {
            try {
                const renderer = new AppearanceStreamRenderer(stream, this.Rect, this.name);
                return renderer.render();
            }
            catch (e) {
                console.log(`Annotation stream render error: ${e.message}`);
            }
        }
        return null;
    }
    renderContent() {
        return null;
    }
    renderHandles() {
        const minRectHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        minRectHandle.classList.add("svg-rect-handle");
        minRectHandle.setAttribute("data-handle-name", "min");
        minRectHandle.setAttribute("cx", this.Rect[0] + "");
        minRectHandle.setAttribute("cy", this.Rect[1] + "");
        const maxRectHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        maxRectHandle.classList.add("svg-rect-handle");
        minRectHandle.setAttribute("data-handle-name", "max");
        maxRectHandle.setAttribute("cx", this.Rect[2] + "");
        maxRectHandle.setAttribute("cy", this.Rect[3] + "");
        return [minRectHandle, maxRectHandle];
    }
    updateRender() {
        this._svg.innerHTML = "";
        const content = this.renderContent() || this.renderAP();
        if (!content) {
            this._svgContent = null;
            this._svgClipPaths = null;
            return;
        }
        const bg = this.renderRectBg();
        const handles = this.renderHandles();
        this._svg.append(bg, content.svg, ...handles);
        this._svgContent = content.svg;
        this._svgClipPaths = content.clipPaths;
    }
    applyRectTransform(matrix) {
        let bBoxLL;
        let bBoxLR;
        let bBoxUR;
        let bBoxUL;
        if (this._bBox) {
            bBoxLL = this._bBox.ll;
            bBoxLR = this._bBox.lr;
            bBoxUR = this._bBox.ur;
            bBoxUL = this._bBox.ul;
        }
        else if (this.apStream) {
            const { ll: apTrBoxLL, lr: apTrBoxLR, ur: apTrBoxUR, ul: apTrBoxUL } = this.apStream.transformedBBox;
            const { min: boxMin, max: boxMax } = vecMinMax(apTrBoxLL, apTrBoxLR, apTrBoxUR, apTrBoxUL);
            const rectMin = new Vec2(this.Rect[0], this.Rect[1]);
            const rectMax = new Vec2(this.Rect[2], this.Rect[3]);
            const mat = mat3From4Vec2(boxMin, boxMax, rectMin, rectMax, true);
            console.log(mat);
            bBoxLL = apTrBoxLL.applyMat3(mat);
            bBoxLR = apTrBoxLR.applyMat3(mat);
            bBoxUR = apTrBoxUR.applyMat3(mat);
            bBoxUL = apTrBoxUL.applyMat3(mat);
        }
        else {
            bBoxLL = new Vec2(this.Rect[0], this.Rect[1]);
            bBoxLR = new Vec2(this.Rect[2], this.Rect[1]);
            bBoxUR = new Vec2(this.Rect[2], this.Rect[3]);
            bBoxUL = new Vec2(this.Rect[0], this.Rect[3]);
        }
        const bBoxCenter = Vec2.add(bBoxLL, bBoxUR).multiplyByScalar(0.5);
        const bBoxMatrix = new Mat3()
            .applyTranslation(-bBoxCenter.x, -bBoxCenter.y)
            .multiply(matrix)
            .applyTranslation(bBoxCenter.x, bBoxCenter.y);
        const trBBoxLL = Vec2.applyMat3(bBoxLL, bBoxMatrix);
        const trBBoxLR = Vec2.applyMat3(bBoxLR, bBoxMatrix);
        const trBBoxUR = Vec2.applyMat3(bBoxUR, bBoxMatrix);
        const trBBoxUL = Vec2.applyMat3(bBoxUL, bBoxMatrix);
        this._bBox = {
            ll: trBBoxLL,
            lr: trBBoxLR,
            ur: trBBoxUR,
            ul: trBBoxUL,
        };
        const { min: newRectMin, max: newRectMax } = vecMinMax(trBBoxLL, trBBoxLR, trBBoxUR, trBBoxUL);
        this.Rect = [newRectMin.x, newRectMin.y, newRectMax.x, newRectMax.y];
        const stream = this.apStream;
        if (stream) {
            const { ll: apQuadLL, ur: apQuadUR } = stream.transformedBBox;
            const apQuadCenter = Vec2.add(apQuadLL, apQuadUR).multiplyByScalar(0.5);
            const newApMatrix = stream.matrix
                .applyTranslation(-apQuadCenter.x, -apQuadCenter.y)
                .multiply(matrix)
                .applyTranslation(apQuadCenter.x, apQuadCenter.y);
            this.apStream.matrix = newApMatrix;
        }
        this.updateRender();
    }
    applyHandleTransform(mat, name) {
    }
}

const markupAnnotationReplyTypes = {
    REPLY: "/R",
    GROUP: "/Group",
};
class MarkupAnnotation extends AnnotationDict {
    constructor(subType) {
        super(subType);
        this.RT = markupAnnotationReplyTypes.REPLY;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.T) {
            bytes.push(...encoder.encode("/T"), ...this.T.toArray(cryptInfo));
        }
        if (this.Popup) {
            bytes.push(...encoder.encode("/Popup"), codes.WHITESPACE, ...this.Popup.toArray(cryptInfo));
        }
        if (this.RC) {
            bytes.push(...encoder.encode("/RC"), ...this.RC.toArray(cryptInfo));
        }
        if (this.CA) {
            bytes.push(...encoder.encode("/CA"), ...encoder.encode(" " + this.CA));
        }
        if (this.CreationDate) {
            bytes.push(...encoder.encode("/CreationDate"), ...this.CreationDate.toArray(cryptInfo));
        }
        if (this.Subj) {
            bytes.push(...encoder.encode("/Subj"), ...this.Subj.toArray(cryptInfo));
        }
        if (this.IRT) {
            bytes.push(...encoder.encode("/IRT"), codes.WHITESPACE, ...this.IRT.toArray(cryptInfo));
        }
        if (this.RT) {
            bytes.push(...encoder.encode("/RT"), ...encoder.encode(this.RT));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/T":
                        const title = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (title) {
                            this.T = title.value;
                            i = title.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /T property value");
                        }
                        break;
                    case "/Popup":
                        const popupId = ObjectId.parseRef(parser, i);
                        if (popupId) {
                            this.Popup = popupId.value;
                            i = popupId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Popup property value");
                        }
                        break;
                    case "/RC":
                        const rcEntryType = parser.getValueTypeAt(i);
                        if (rcEntryType === valueTypes.REF) {
                            const rsObjectId = ObjectId.parseRef(parser, i);
                            if (rsObjectId && parseInfo.parseInfoGetter) {
                                const rcParseInfo = parseInfo.parseInfoGetter(rsObjectId.value.id);
                                if (rcParseInfo) {
                                    const rcObjectType = rcParseInfo.type
                                        || rcParseInfo.parser.getValueTypeAt(rcParseInfo.bounds.contentStart);
                                    if (rcObjectType === valueTypes.STRING_LITERAL) {
                                        const popupTextFromIndirectLiteral = LiteralString
                                            .parse(rcParseInfo.parser, rcParseInfo.bounds.contentStart);
                                        if (popupTextFromIndirectLiteral) {
                                            this.RC = popupTextFromIndirectLiteral.value;
                                            i = rsObjectId.end + 1;
                                            break;
                                        }
                                    }
                                    else if (rcObjectType === valueTypes.DICTIONARY) {
                                        const popupTextStream = TextStream.parse(rcParseInfo);
                                        if (popupTextStream) {
                                            const popupTextFromStream = popupTextStream.value.getText();
                                            this.RC = LiteralString.fromString(popupTextFromStream);
                                            i = rsObjectId.end + 1;
                                            break;
                                        }
                                    }
                                    else {
                                        throw new Error(`Unsupported /RC property value type: ${rcObjectType}`);
                                    }
                                }
                            }
                            throw new Error("Can't parse /RC value reference");
                        }
                        else if (rcEntryType === valueTypes.STRING_LITERAL) {
                            const popupTextFromLiteral = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                            if (popupTextFromLiteral) {
                                this.RC = popupTextFromLiteral.value;
                                i = popupTextFromLiteral.end + 1;
                                break;
                            }
                            throw new Error("Can't parse /RC property value");
                        }
                        throw new Error(`Unsupported /RC property value type: ${rcEntryType}`);
                    case "/CA":
                        const opacity = parser.parseNumberAt(i, true);
                        if (opacity) {
                            this.CA = opacity.value;
                            i = opacity.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CA property value");
                        }
                        break;
                    case "/CreationDate":
                        const date = DateString.parse(parser, i, parseInfo.cryptInfo);
                        if (date) {
                            this.CreationDate = date.value;
                            i = date.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CreationDate property value");
                        }
                        break;
                    case "/Subj":
                        const subject = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (subject) {
                            this.Subj = subject.value;
                            i = subject.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Subj property value");
                        }
                        break;
                    case "/IRT":
                        const refId = ObjectId.parseRef(parser, i);
                        if (refId) {
                            this.IRT = refId.value;
                            i = refId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /IRT property value");
                        }
                        break;
                    case "/RT":
                        const replyType = parser.parseNameAt(i, true);
                        if (replyType && Object.values(markupAnnotationReplyTypes)
                            .includes(replyType.value)) {
                            this.RT = replyType.value;
                            i = replyType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /RT property value");
                        }
                        break;
                    case "/ExData":
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Subtype || !this.Rect) {
            return false;
        }
        return true;
    }
}

const freeTextIntents = {
    PLAIN_TEXT: "/FreeText",
    WITH_CALLOUT: "/FreeTextCallout",
    CLICK_TO_TYPE: "/FreeTextTypeWriter",
};
class FreeTextAnnotation extends MarkupAnnotation {
    constructor() {
        super(annotationTypes.FREE_TEXT);
        this.IT = freeTextIntents.PLAIN_TEXT;
        this.LE = lineEndingTypes.NONE;
    }
    static parse(parseInfo) {
        const freeText = new FreeTextAnnotation();
        const parseResult = freeText.tryParseProps(parseInfo);
        return parseResult
            ? { value: freeText, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.DA) {
            bytes.push(...encoder.encode("/DA"), ...this.DA.toArray(cryptInfo));
        }
        if (this.Q) {
            bytes.push(...encoder.encode("/Q"), ...encoder.encode(" " + this.Q));
        }
        if (this.DS) {
            bytes.push(...encoder.encode("/DS"), ...this.DS.toArray(cryptInfo));
        }
        if (this.CL) {
            bytes.push(...encoder.encode("/CL"), codes.L_BRACKET);
            this.CL.forEach(x => bytes.push(...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.IT) {
            bytes.push(...encoder.encode("/IT"), ...encoder.encode(this.IT));
        }
        if (this.RD) {
            bytes.push(...encoder.encode("/RD"), codes.L_BRACKET, ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET);
        }
        if (this.LE) {
            bytes.push(...encoder.encode("/LE"), ...encoder.encode(this.LE));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/DA":
                        const appearanceString = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (appearanceString) {
                            this.DA = appearanceString.value;
                            i = appearanceString.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /DA property value");
                        }
                        break;
                    case "/Q":
                        const justification = parser.parseNumberAt(i, true);
                        if (justification && Object.values(justificationTypes)
                            .includes(justification.value)) {
                            this.Q = justification.value;
                            i = justification.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Q property value");
                        }
                        break;
                    case "/DS":
                        const style = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (style) {
                            this.DS = style.value;
                            i = style.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /DS property value");
                        }
                        break;
                    case "/CL":
                        const callout = parser.parseNumberArrayAt(i, true);
                        if (callout) {
                            this.CL = callout.value;
                            i = callout.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CL property value");
                        }
                        break;
                    case "/IT":
                        const intent = parser.parseNameAt(i, true);
                        if (intent) {
                            if (intent.value === "/FreeTextTypewriter") {
                                this.IT = freeTextIntents.CLICK_TO_TYPE;
                                i = intent.end + 1;
                                break;
                            }
                            else if (Object.values(freeTextIntents).includes(intent.value)) {
                                this.IT = intent.value;
                                i = intent.end + 1;
                                break;
                            }
                        }
                        throw new Error("Can't parse /IT property value");
                    case "/RD":
                        const innerRect = parser.parseNumberArrayAt(i, true);
                        if (innerRect) {
                            this.RD = [
                                innerRect.value[0],
                                innerRect.value[1],
                                innerRect.value[2],
                                innerRect.value[3],
                            ];
                            i = innerRect.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /RD property value");
                        }
                        break;
                    case "/LE":
                        const lineEndingType = parser.parseNameAt(i, true);
                        if (lineEndingType && Object.values(lineEndingTypes)
                            .includes(lineEndingType.value)) {
                            this.LE = lineEndingType.value;
                            i = lineEndingType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LE property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.DA) {
            return false;
        }
        return true;
    }
}

class GeometricAnnotation extends MarkupAnnotation {
    constructor(type) {
        super(type);
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.IC) {
            bytes.push(...encoder.encode("/IC"), codes.L_BRACKET);
            this.IC.forEach(x => bytes.push(...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/IC":
                        const interiorColor = parser.parseNumberArrayAt(i, true);
                        if (interiorColor) {
                            this.IC = interiorColor.value;
                            i = interiorColor.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /IC property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class CircleAnnotation extends GeometricAnnotation {
    constructor() {
        super(annotationTypes.CIRCLE);
    }
    static parse(parseInfo) {
        const freeText = new CircleAnnotation();
        const parseResult = freeText.tryParseProps(parseInfo);
        return parseResult
            ? { value: freeText, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.RD) {
            bytes.push(...encoder.encode("/RD"), codes.L_BRACKET, ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/RD":
                        const innerRect = parser.parseNumberArrayAt(i, true);
                        if (innerRect) {
                            this.RD = [
                                innerRect.value[0],
                                innerRect.value[1],
                                innerRect.value[2],
                                innerRect.value[3],
                            ];
                            i = innerRect.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /RD property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

const lineIntents = {
    ARROW: "/LineArrow",
    DIMESION: "/LineDimension",
};
const captionPositions = {
    INLINE: "/Inline",
    TOP: "/Top",
};
class LineAnnotation extends GeometricAnnotation {
    constructor() {
        super(annotationTypes.LINE);
        this.LE = [lineEndingTypes.NONE, lineEndingTypes.NONE];
        this.LL = 0;
        this.LLE = 0;
        this.Cap = false;
        this.LLO = 0;
        this.CP = captionPositions.INLINE;
        this.CO = [0, 0];
    }
    static parse(parseInfo) {
        const text = new LineAnnotation();
        const parseResult = text.tryParseProps(parseInfo);
        return parseResult
            ? { value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.L) {
            bytes.push(...encoder.encode("/L"), codes.L_BRACKET, ...encoder.encode(this.L[0] + ""), codes.WHITESPACE, ...encoder.encode(this.L[1] + ""), codes.WHITESPACE, ...encoder.encode(this.L[2] + ""), codes.WHITESPACE, ...encoder.encode(this.L[3] + ""), codes.R_BRACKET);
        }
        if (this.LE) {
            bytes.push(...encoder.encode("/LE"), codes.L_BRACKET);
            this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.LL) {
            bytes.push(...encoder.encode("/LL"), ...encoder.encode(" " + this.LL));
        }
        if (this.LLE) {
            bytes.push(...encoder.encode("/LLE"), ...encoder.encode(" " + this.LLE));
        }
        if (this.Cap) {
            bytes.push(...encoder.encode("/Cap"), ...encoder.encode(" " + this.Cap));
        }
        if (this.IT) {
            bytes.push(...encoder.encode("/IT"), ...encoder.encode(this.IT));
        }
        if (this.LLO) {
            bytes.push(...encoder.encode("/LLO"), ...encoder.encode(" " + this.LLO));
        }
        if (this.CP) {
            bytes.push(...encoder.encode("/CP"), ...encoder.encode(this.CP));
        }
        if (this.Measure) {
            bytes.push(...encoder.encode("/Measure"), ...this.Measure.toArray(cryptInfo));
        }
        if (this.CO) {
            bytes.push(...encoder.encode("/CO"), codes.L_BRACKET, ...encoder.encode(this.CO[0] + ""), codes.WHITESPACE, ...encoder.encode(this.CO[1] + ""), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/L":
                        const lineCoords = parser.parseNumberArrayAt(i, true);
                        if (lineCoords) {
                            this.L = [
                                lineCoords.value[0],
                                lineCoords.value[1],
                                lineCoords.value[2],
                                lineCoords.value[3],
                            ];
                            i = lineCoords.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /L property value");
                        }
                        break;
                    case "/LE":
                        const lineEndings = parser.parseNameArrayAt(i, true);
                        if (lineEndings
                            && Object.values(lineEndingTypes).includes(lineEndings.value[0])
                            && Object.values(lineEndingTypes).includes(lineEndings.value[1])) {
                            this.LE = [
                                lineEndings.value[0],
                                lineEndings.value[1],
                            ];
                            i = lineEndings.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LE property value");
                        }
                        break;
                    case "/LL":
                        const leaderLineLength = parser.parseNumberAt(i, false);
                        if (leaderLineLength) {
                            this.LL = leaderLineLength.value;
                            i = leaderLineLength.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LL property value");
                        }
                        break;
                    case "/LLE":
                        const leaderLineExtLength = parser.parseNumberAt(i, false);
                        if (leaderLineExtLength) {
                            this.LLE = leaderLineExtLength.value;
                            i = leaderLineExtLength.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LLE property value");
                        }
                        break;
                    case "/Cap":
                        const cap = parser.parseBoolAt(i, false);
                        if (cap) {
                            this.Cap = cap.value;
                            i = cap.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Cap property value");
                        }
                        break;
                    case "/IT":
                        const intent = parser.parseNameAt(i, true);
                        if (intent) {
                            if (Object.values(lineIntents).includes(intent.value)) {
                                this.IT = intent.value;
                                i = intent.end + 1;
                                break;
                            }
                        }
                        throw new Error("Can't parse /IT property value");
                    case "/LLO":
                        const leaderLineOffset = parser.parseNumberAt(i, false);
                        if (leaderLineOffset) {
                            this.LLO = leaderLineOffset.value;
                            i = leaderLineOffset.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LLO property value");
                        }
                        break;
                    case "/CP":
                        const captionPosition = parser.parseNameAt(i, true);
                        if (captionPosition && Object.values(captionPositions)
                            .includes(captionPosition.value[0])) {
                            this.CP = captionPosition.value;
                            i = captionPosition.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CP property value");
                        }
                        break;
                    case "/Measure":
                        const measureEntryType = parser.getValueTypeAt(i);
                        if (measureEntryType === valueTypes.REF) {
                            const measureDictId = ObjectId.parseRef(parser, i);
                            if (measureDictId && parseInfo.parseInfoGetter) {
                                const measureParseInfo = parseInfo.parseInfoGetter(measureDictId.value.id);
                                if (measureParseInfo) {
                                    const measureDict = MeasureDict.parse(measureParseInfo);
                                    if (measureDict) {
                                        this.Measure = measureDict.value;
                                        i = measureDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /BS value reference");
                        }
                        else if (measureEntryType === valueTypes.DICTIONARY) {
                            const measureDictBounds = parser.getDictBoundsAt(i);
                            if (measureDictBounds) {
                                const measureDict = MeasureDict.parse({ parser, bounds: measureDictBounds });
                                if (measureDict) {
                                    this.Measure = measureDict.value;
                                    i = measureDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /Measure value dictionary");
                        }
                        throw new Error(`Unsupported /Measure property value type: ${measureEntryType}`);
                    case "/CO":
                        const captionOffset = parser.parseNumberArrayAt(i, true);
                        if (captionOffset) {
                            this.CO = [
                                captionOffset.value[0],
                                captionOffset.value[1],
                            ];
                            i = captionOffset.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CO property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class SquareAnnotation extends GeometricAnnotation {
    constructor() {
        super(annotationTypes.SQUARE);
    }
    static parse(parseInfo) {
        const freeText = new SquareAnnotation();
        const parseResult = freeText.tryParseProps(parseInfo);
        return parseResult
            ? { value: freeText, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.RD) {
            bytes.push(...encoder.encode("/RD"), codes.L_BRACKET, ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/RD":
                        const innerRect = parser.parseNumberArrayAt(i, true);
                        if (innerRect) {
                            this.RD = [
                                innerRect.value[0],
                                innerRect.value[1],
                                innerRect.value[2],
                                innerRect.value[3],
                            ];
                            i = innerRect.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /RD property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class InkAnnotation extends MarkupAnnotation {
    constructor() {
        super(annotationTypes.INK);
    }
    static parse(parseInfo) {
        const ink = new InkAnnotation();
        const parseResult = ink.tryParseProps(parseInfo);
        return parseResult
            ? { value: ink, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.InkList) {
            bytes.push(...encoder.encode("/InkList"), codes.L_BRACKET);
            this.InkList.forEach(x => {
                bytes.push(codes.L_BRACKET);
                x.forEach(y => bytes.push(...encoder.encode(" " + y)));
                bytes.push(codes.R_BRACKET);
            });
            bytes.push(codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        var _a;
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/InkList":
                        const inkType = parser.getValueTypeAt(i);
                        if (inkType === valueTypes.ARRAY) {
                            const inkList = [];
                            let inkSubList;
                            let inkArrayPos = ++i;
                            while (true) {
                                inkSubList = parser.parseNumberArrayAt(inkArrayPos);
                                if (!inkSubList) {
                                    break;
                                }
                                inkList.push(inkSubList.value);
                                inkArrayPos = inkSubList.end + 1;
                            }
                            this.InkList = inkList;
                            break;
                        }
                        throw new Error("Can't parse /InkList property value");
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!((_a = this.InkList) === null || _a === void 0 ? void 0 : _a.length)) {
            return false;
        }
        return true;
    }
}

const stampTypes = {
    DRAFT: "/Draft",
    NOT_APPROVED: "/NotApproved",
    APPROVED: "/Approved",
    AS_IS: "/AsIs",
    FOR_COMMENT: "/ForComment",
    EXPERIMENTAL: "/Experimental",
    FINAL: "/Final",
    SOLD: "/Sold",
    EXPIRED: "/Expired",
    PUBLIC: "/ForPublicRelease",
    NOT_PUBLIC: "/NotForPublicRelease",
    DEPARTMENTAL: "/Departmental",
    CONFIDENTIAL: "/Confidential",
    SECRET: "/TopSecret",
};
class StampAnnotation extends MarkupAnnotation {
    constructor() {
        super(annotationTypes.STAMP);
        this.Name = stampTypes.DRAFT;
    }
    static parse(parseInfo) {
        const stamp = new StampAnnotation();
        const parseResult = stamp.tryParseProps(parseInfo);
        return parseResult
            ? { value: stamp, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Name) {
            bytes.push(...encoder.encode("/Name"), ...encoder.encode(this.Name));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        parser.sliceChars(start, end);
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Name":
                        const type = parser.parseNameAt(i, true);
                        if (type) {
                            this.Name = type.value;
                            i = type.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Name property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Name) {
            return false;
        }
        if (!Object.values(stampTypes).includes(this.Name)) {
            return false;
        }
        return true;
    }
}

class TextAnnotation extends MarkupAnnotation {
    constructor() {
        super(annotationTypes.TEXT);
        this.Open = false;
    }
    static parse(parseInfo) {
        const text = new TextAnnotation();
        const parseResult = text.tryParseProps(parseInfo);
        return parseResult
            ? { value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Open) {
            bytes.push(...encoder.encode("/Open"), ...encoder.encode(" " + this.Open));
        }
        if (this.Name) {
            bytes.push(...encoder.encode("/Name"), ...encoder.encode(this.Name));
        }
        if (this.State) {
            bytes.push(...encoder.encode("/State"), ...encoder.encode(this.State));
        }
        if (this.StateModel) {
            bytes.push(...encoder.encode("/StateModel"), ...encoder.encode(this.StateModel));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Open":
                        const opened = parser.parseBoolAt(i, true);
                        if (opened) {
                            this.Open = opened.value;
                            i = opened.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Open property value");
                        }
                        break;
                    case "/Name":
                        const iconType = parser.parseNameAt(i, true);
                        if (iconType && Object.values(annotationIconTypes)
                            .includes(iconType.value)) {
                            this.Name = iconType.value;
                            i = iconType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Name property value");
                        }
                        break;
                    case "/State":
                        const state = parser.parseNameAt(i, true);
                        if (state && Object.values(annotationMarkedStates)
                            .concat(Object.values(annotationReviewStates))
                            .includes(state.value)) {
                            this.State = state.value;
                            i = state.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /State property value");
                        }
                        break;
                    case "/StateModel":
                        const stateModelType = parser.parseNameAt(i, true);
                        if (stateModelType && Object.values(annotationStateModelTypes)
                            .includes(stateModelType.value)) {
                            this.StateModel = stateModelType.value;
                            i = stateModelType.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StateModel property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class CryptFilterDict extends PdfDict {
    constructor() {
        super(dictTypes.CRYPT_FILTER);
        this.CFM = cryptMethods.NONE;
        this.AuthEvent = authEvents.DOC_OPEN;
        this.Length = 40;
        this.EncryptMetadata = true;
    }
    static parse(parseInfo) {
        const cryptFilter = new CryptFilterDict();
        const parseResult = cryptFilter.tryParseProps(parseInfo);
        return parseResult
            ? { value: cryptFilter, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.CFM) {
            bytes.push(...encoder.encode("/CFM"), ...encoder.encode(this.CFM));
        }
        if (this.AuthEvent) {
            bytes.push(...encoder.encode("/AuthEvent"), ...encoder.encode(this.AuthEvent));
        }
        if (this.Length) {
            bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + this.Length));
        }
        if (this.EncryptMetadata) {
            bytes.push(...encoder.encode("/EncryptMetadata"), ...encoder.encode(" " + this.EncryptMetadata));
        }
        if (this.Recipients) {
            if (this.Recipients instanceof HexString) {
                bytes.push(...encoder.encode("/Recipients"), ...this.Recipients.toArray(cryptInfo));
            }
            else {
                bytes.push(codes.L_BRACKET);
                this.Recipients.forEach(x => bytes.push(...x.toArray(cryptInfo)));
                bytes.push(codes.R_BRACKET);
            }
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/CFM":
                        const method = parser.parseNameAt(i, true);
                        if (method && Object.values(cryptMethods)
                            .includes(method.value)) {
                            this.CFM = method.value;
                            i = method.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /CFM property value");
                        }
                        break;
                    case "/AuthEvent":
                        const authEvent = parser.parseNameAt(i, true);
                        if (authEvent && Object.values(authEvents)
                            .includes(authEvent.value)) {
                            this.AuthEvent = authEvent.value;
                            i = authEvent.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /AuthEvent property value");
                        }
                        break;
                    case "/Length":
                        const length = parser.parseNumberAt(i, false);
                        if (length) {
                            this.Length = length.value;
                            i = length.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Length property value");
                        }
                        break;
                    case "/EncryptMetadata":
                        const encrypt = parser.parseBoolAt(i, false);
                        if (encrypt) {
                            this.EncryptMetadata = encrypt.value;
                            i = encrypt.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /EncryptMetadata property value");
                        }
                        break;
                    case "/Recipients":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.STRING_HEX) {
                            const recipient = HexString.parse(parser, i, parseInfo.cryptInfo);
                            if (recipient) {
                                this.Recipients = recipient.value;
                                i = recipient.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Recipients property value");
                            }
                        }
                        else if (entryType === valueTypes.ARRAY) {
                            const recipients = HexString.parseArray(parser, i);
                            if (recipients) {
                                this.Recipients = recipients.value;
                                i = recipients.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Recipients property value");
                            }
                        }
                        throw new Error(`Unsupported /Filter property value type: ${entryType}`);
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class CryptMapDict extends PdfDict {
    constructor() {
        super(null);
        this._filtersMap = new Map();
    }
    static parse(parseInfo) {
        const cryptMap = new CryptMapDict();
        const parseResult = cryptMap.tryParseProps(parseInfo);
        return parseResult
            ? { value: cryptMap, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    getProp(name) {
        return this._filtersMap.get(name);
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this._filtersMap.size) {
            this._filtersMap.forEach((v, k) => bytes.push(...encoder.encode(k), ...v.toArray(cryptInfo)));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    default:
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.DICTIONARY) {
                            const dictBounds = parser.getDictBoundsAt(i);
                            if (dictBounds) {
                                const filter = CryptFilterDict.parse({ parser, bounds: dictBounds });
                                if (filter) {
                                    this._filtersMap.set(name, filter.value);
                                    i = filter.end + 1;
                                    break;
                                }
                            }
                        }
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class EncryptionDict extends PdfDict {
    constructor() {
        super(dictTypes.EMPTY);
        this.Filter = "/Standard";
        this.Length = 40;
        this.StmF = "/Identity";
        this.StrF = "/Identity";
        this.EncryptMetadata = true;
    }
    static parse(parseInfo) {
        const encryption = new EncryptionDict();
        const parseResult = encryption.tryParseProps(parseInfo);
        return parseResult
            ? { value: encryption, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Filter) {
            bytes.push(...encoder.encode("/Filter"), ...encoder.encode(this.Filter));
        }
        if (this.SubFilter) {
            bytes.push(...encoder.encode("/SubFilter"), ...encoder.encode(this.SubFilter));
        }
        if (this.V) {
            bytes.push(...encoder.encode("/V"), ...encoder.encode(" " + this.V));
        }
        if (this.Length) {
            bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + this.Length));
        }
        if (this.CF) {
            bytes.push(...encoder.encode("/CF"), ...this.CF.toArray(cryptInfo));
        }
        if (this.StmF) {
            bytes.push(...encoder.encode("/StmF"), ...encoder.encode(this.StmF));
        }
        if (this.StrF) {
            bytes.push(...encoder.encode("/StrF"), ...encoder.encode(this.StrF));
        }
        if (this.EFF) {
            bytes.push(...encoder.encode("/EFF"), ...encoder.encode(this.EFF));
        }
        if (this.R) {
            bytes.push(...encoder.encode("/R"), ...encoder.encode(" " + this.R));
        }
        if (this.O) {
            bytes.push(...encoder.encode("/O"), ...this.O.toArray(cryptInfo));
        }
        if (this.U) {
            bytes.push(...encoder.encode("/U"), ...this.U.toArray(cryptInfo));
        }
        if (this.OE) {
            bytes.push(...encoder.encode("/OE"), ...this.OE.toArray(cryptInfo));
        }
        if (this.UE) {
            bytes.push(...encoder.encode("/UE"), ...this.UE.toArray(cryptInfo));
        }
        if (this.P) {
            bytes.push(...encoder.encode("/P"), ...encoder.encode(" " + this.P));
        }
        if (this.Perms) {
            bytes.push(...encoder.encode("/Perms"), ...this.Perms.toArray(cryptInfo));
        }
        if (this.U) {
            bytes.push(...encoder.encode("/U"), ...this.U.toArray(cryptInfo));
        }
        if (this.EncryptMetadata) {
            bytes.push(...encoder.encode("/EncryptMetadata"), ...encoder.encode(" " + this.EncryptMetadata));
        }
        if (this.Recipients) {
            if (this.Recipients instanceof HexString) {
                bytes.push(...encoder.encode("/Recipients"), ...this.Recipients.toArray(cryptInfo));
            }
            else {
                bytes.push(codes.L_BRACKET);
                this.Recipients.forEach(x => bytes.push(...x.toArray(cryptInfo)));
                bytes.push(codes.R_BRACKET);
            }
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    toCryptOptions() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!this.V) {
            return null;
        }
        return {
            filter: this.Filter,
            version: this.V,
            revision: this.R,
            permissions: this.P,
            keyLength: this.Length,
            encryptMetadata: this.EncryptMetadata,
            stringKeyLength: (_a = this.stringFilter) === null || _a === void 0 ? void 0 : _a.Length,
            streamKeyLength: (_b = this.streamFilter) === null || _b === void 0 ? void 0 : _b.Length,
            stringMethod: (_c = this.stringFilter) === null || _c === void 0 ? void 0 : _c.CFM,
            streamMethod: (_d = this.streamFilter) === null || _d === void 0 ? void 0 : _d.CFM,
            oPasswordHash: (_e = this.O) === null || _e === void 0 ? void 0 : _e.bytes,
            uPasswordHash: (_f = this.U) === null || _f === void 0 ? void 0 : _f.bytes,
            oEncPasswordHash: (_g = this.OE) === null || _g === void 0 ? void 0 : _g.bytes,
            uEncPasswordHash: (_h = this.UE) === null || _h === void 0 ? void 0 : _h.bytes,
            perms: (_j = this.Perms) === null || _j === void 0 ? void 0 : _j.bytes,
        };
    }
    tryParseProps(parseInfo) {
        var _a, _b;
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Filter":
                        const filter = parser.parseNameAt(i, true);
                        if (filter) {
                            this.Filter = filter.value;
                            i = filter.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Filter property value");
                        }
                        break;
                    case "/SubFilter":
                        const subFilter = parser.parseNameAt(i, true);
                        if (subFilter) {
                            this.SubFilter = subFilter.value;
                            i = subFilter.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /SubFilter property value");
                        }
                        break;
                    case "/V":
                        const algorithm = parser.parseNumberAt(i, false);
                        if (algorithm && Object.values(cryptVersions)
                            .includes(algorithm.value)) {
                            this.V = algorithm.value;
                            i = algorithm.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /V property value");
                        }
                        break;
                    case "/Length":
                        const length = parser.parseNumberAt(i, false);
                        if (length) {
                            this.Length = length.value;
                            i = length.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Length property value");
                        }
                        break;
                    case "/CF":
                        const dictBounds = parser.getDictBoundsAt(i);
                        if (bounds) {
                            const cryptMap = CryptMapDict.parse({ parser, bounds: dictBounds });
                            if (cryptMap) {
                                this.CF = cryptMap.value;
                                i = cryptMap.end + 1;
                            }
                        }
                        else {
                            throw new Error("Can't parse /CF property value");
                        }
                        break;
                    case "/StmF":
                        const streamFilter = parser.parseNameAt(i, true);
                        if (streamFilter) {
                            this.StmF = streamFilter.value;
                            i = streamFilter.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StmF property value");
                        }
                        break;
                    case "/StrF":
                        const stringFilter = parser.parseNameAt(i, true);
                        if (stringFilter) {
                            this.StrF = stringFilter.value;
                            i = stringFilter.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /StrF property value");
                        }
                        break;
                    case "/EFF":
                        const embeddedFilter = parser.parseNameAt(i, true);
                        if (embeddedFilter) {
                            this.EFF = embeddedFilter.value;
                            i = embeddedFilter.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /EFF property value");
                        }
                        break;
                    case "/R":
                        const revision = parser.parseNumberAt(i, false);
                        if (revision && Object.values(cryptRevisions)
                            .includes(revision.value)) {
                            this.R = revision.value;
                            i = revision.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /R property value");
                        }
                        break;
                    case "/O":
                        const ownerPassword = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (ownerPassword) {
                            this.O = ownerPassword.value;
                            i = ownerPassword.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /O property value");
                        }
                        break;
                    case "/U":
                        const userPassword = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (userPassword) {
                            this.U = userPassword.value;
                            i = userPassword.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /U property value");
                        }
                        break;
                    case "/OE":
                        const ownerPasswordKey = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (ownerPasswordKey) {
                            this.OE = ownerPasswordKey.value;
                            i = ownerPasswordKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /OE property value");
                        }
                        break;
                    case "/UE":
                        const userPasswordKey = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (userPasswordKey) {
                            this.UE = userPasswordKey.value;
                            i = userPasswordKey.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /UE property value");
                        }
                        break;
                    case "/P":
                        const flags = parser.parseNumberAt(i, false);
                        if (flags) {
                            this.P = flags.value;
                            i = flags.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /P property value");
                        }
                        break;
                    case "/Perms":
                        const flagsEncrypted = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (flagsEncrypted) {
                            this.Perms = flagsEncrypted.value;
                            i = flagsEncrypted.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Perms property value");
                        }
                        break;
                    case "/EncryptMetadata":
                        const encryptMetadata = parser.parseBoolAt(i);
                        if (encryptMetadata) {
                            this.EncryptMetadata = encryptMetadata.value;
                            i = encryptMetadata.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /EncryptMetadata property value");
                        }
                        break;
                    case "/Recipients":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.STRING_HEX) {
                            const recipient = HexString.parse(parser, i, parseInfo.cryptInfo);
                            if (recipient) {
                                this.Recipients = recipient.value;
                                i = recipient.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Recipients property value");
                            }
                        }
                        else if (entryType === valueTypes.ARRAY) {
                            const recipients = HexString.parseArray(parser, i);
                            if (recipients) {
                                this.Recipients = recipients.value;
                                i = recipients.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Recipients property value");
                            }
                        }
                        throw new Error(`Unsupported /Filter property value type: ${entryType}`);
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Filter) {
            return false;
        }
        if (this.Filter === "/Standard"
            && (!this.R
                || !this.O
                || !this.U
                || isNaN(this.P)
                || (this.V === 5 && (this.R < 5 || !this.OE || !this.UE || !this.Perms)))) {
            return false;
        }
        if ((this.SubFilter === "adbe.pkcs7.s3" || this.SubFilter === "adbe.pkcs7.s4")
            && !this.Recipients) {
            return false;
        }
        if (this.StrF !== "/Identity") {
            this.stringFilter = (_a = this.CF) === null || _a === void 0 ? void 0 : _a.getProp(this.StrF);
        }
        if (this.StmF !== "/Identity") {
            this.streamFilter = (_b = this.CF) === null || _b === void 0 ? void 0 : _b.getProp(this.StmF);
        }
        return true;
    }
}

class ObjectStream extends PdfStream {
    constructor() {
        super(streamTypes.OBJECT_STREAM);
    }
    static parse(parseInfo) {
        const stream = new ObjectStream();
        const parseResult = stream.tryParseProps(parseInfo);
        return parseResult
            ? { value: stream, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    getObjectData(id) {
        if (!this._streamData || !this.N || !this.First) {
            return null;
        }
        const parser = new DataParser(this.decodedStreamData);
        const offsetMap = new Map();
        let temp;
        let objectId;
        let byteOffset;
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
        let bounds;
        let value;
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
                    bounds = { start: literalValue.start, end: literalValue.end };
                    value = literalValue;
                }
                break;
            case objectTypes.STRING_HEX:
                const hexValue = HexString.parse(parser, objectStart);
                if (hexValue) {
                    bounds = { start: hexValue.start, end: hexValue.end };
                    value = hexValue;
                }
                break;
            case objectTypes.NUMBER:
                const numValue = parser.parseNumberAt(objectStart);
                if (numValue) {
                    bounds = { start: numValue.start, end: numValue.end };
                    value = numValue;
                }
                break;
        }
        if (!bounds) {
            return null;
        }
        const bytes = parser.sliceCharCodes(bounds.start, bounds.end);
        if (!bytes.length) {
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
            type: objectType,
            value,
            cryptInfo: { ref: { id, generation: 0 } },
            streamId: this.id,
        };
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.N) {
            bytes.push(...encoder.encode("/N"), ...encoder.encode(" " + this.N));
        }
        if (this.First) {
            bytes.push(...encoder.encode("/First"), ...encoder.encode(" " + this.First));
        }
        if (this.Extends) {
            bytes.push(...encoder.encode("/Extends"), codes.WHITESPACE, ...this.Extends.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        if (this.Type !== streamTypes.OBJECT_STREAM) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/N":
                        const n = parser.parseNumberAt(i, false);
                        if (n) {
                            this.N = n.value;
                            i = n.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /N property value");
                        }
                        break;
                    case "/First":
                        const first = parser.parseNumberAt(i, false);
                        if (first) {
                            this.First = first.value;
                            i = first.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /First property value");
                        }
                        break;
                    case "/Extends":
                        const parentId = ObjectId.parseRef(parser, i);
                        if (parentId) {
                            this.Extends = parentId.value;
                            i = parentId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Extends property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class CatalogDict extends PdfDict {
    constructor() {
        super(dictTypes.CATALOG);
    }
    static parse(parseInfo) {
        const catalog = new CatalogDict();
        const parseResult = catalog.tryParseProps(parseInfo);
        return parseResult
            ? { value: catalog, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Version) {
            bytes.push(...encoder.encode("/Version"), ...encoder.encode(this.Version));
        }
        if (this.Pages) {
            bytes.push(...encoder.encode("/Pages"), codes.WHITESPACE, ...this.Pages.toArray(cryptInfo));
        }
        if (this.Lang) {
            bytes.push(...encoder.encode("/Lang"), ...this.Lang.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Version":
                        const version = parser.parseNameAt(i, false, false);
                        if (version) {
                            this.Version = version.value;
                            i = version.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Version property value");
                        }
                        break;
                    case "/Pages":
                        const rootPageTreeId = ObjectId.parseRef(parser, i);
                        if (rootPageTreeId) {
                            this.Pages = rootPageTreeId.value;
                            i = rootPageTreeId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Pages property value");
                        }
                        break;
                    case "/Lang":
                        const lang = LiteralString.parse(parser, i, parseInfo.cryptInfo);
                        if (lang) {
                            this.Lang = lang.value;
                            i = lang.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Lang property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Pages) {
            return false;
        }
        return true;
    }
}

class PageDict extends PdfDict {
    constructor() {
        super(dictTypes.PAGE);
        this.Rotate = 0;
    }
    static parse(parseInfo) {
        const page = new PageDict();
        const parseResult = page.tryParseProps(parseInfo);
        return parseResult
            ? { value: page, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Parent) {
            bytes.push(...encoder.encode("/Parent"), codes.WHITESPACE, ...this.Parent.toArray(cryptInfo));
        }
        if (this.LastModified) {
            bytes.push(...encoder.encode("/LastModified"), ...this.LastModified.toArray(cryptInfo));
        }
        if (this.MediaBox) {
            bytes.push(...encoder.encode("/MediaBox"), codes.L_BRACKET, ...encoder.encode(this.MediaBox[0] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[1] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[2] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[3] + ""), codes.R_BRACKET);
        }
        if (this.Rotate) {
            bytes.push(...encoder.encode("/Rotate"), ...encoder.encode(" " + this.Rotate));
        }
        if (this.Annots) {
            if (this.Annots instanceof ObjectId) {
                bytes.push(...encoder.encode("/Annots"), codes.WHITESPACE, ...this.Annots.toArray(cryptInfo));
            }
            else {
                bytes.push(...encoder.encode("/Annots"), codes.L_BRACKET);
                this.Annots.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
                bytes.push(codes.R_BRACKET);
            }
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Parent":
                        const parentId = ObjectId.parseRef(parser, i);
                        if (parentId) {
                            this.Parent = parentId.value;
                            i = parentId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Parent property value");
                        }
                        break;
                    case "/LastModified":
                        const date = DateString.parse(parser, i, parseInfo.cryptInfo);
                        if (date) {
                            this.LastModified = date.value;
                            i = date.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LastModified property value");
                        }
                        break;
                    case "/MediaBox":
                        const mediaBox = parser.parseNumberArrayAt(i, true);
                        if (mediaBox) {
                            this.MediaBox = [
                                mediaBox.value[0],
                                mediaBox.value[1],
                                mediaBox.value[2],
                                mediaBox.value[3],
                            ];
                            i = mediaBox.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /MediaBox property value");
                        }
                        break;
                    case "/Rotate":
                        const rotate = parser.parseNumberAt(i, false);
                        if (rotate) {
                            this.Rotate = rotate.value;
                            i = rotate.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Rotate property value");
                        }
                        break;
                    case "/Annots":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.REF) {
                            const annotArrayId = ObjectId.parseRef(parser, i);
                            if (annotArrayId) {
                                this.Annots = annotArrayId.value;
                                i = annotArrayId.end + 1;
                                break;
                            }
                        }
                        else if (entryType === valueTypes.ARRAY) {
                            const annotIds = ObjectId.parseRefArray(parser, i);
                            if (annotIds) {
                                this.Annots = annotIds.value;
                                i = annotIds.end + 1;
                                break;
                            }
                        }
                        throw new Error(`Unsupported /Annots property value type: ${entryType}`);
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Parent) {
            return false;
        }
        return true;
    }
}

class PageTreeDict extends PdfDict {
    constructor() {
        super(dictTypes.PAGE_TREE);
        this.Rotate = 0;
    }
    static parse(parseInfo) {
        const pageTree = new PageTreeDict();
        const parseResult = pageTree.tryParseProps(parseInfo);
        return parseResult
            ? { value: pageTree, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Parent) {
            bytes.push(...encoder.encode("/Parent"), codes.WHITESPACE, ...this.Parent.toArray(cryptInfo));
        }
        if (this.Kids) {
            bytes.push(...encoder.encode("/Kids"), codes.L_BRACKET);
            this.Kids.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.Count) {
            bytes.push(...encoder.encode("/Count"), ...encoder.encode(" " + this.Count));
        }
        if (this.MediaBox) {
            bytes.push(...encoder.encode("/MediaBox"), codes.L_BRACKET, ...encoder.encode(this.MediaBox[0] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[1] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[2] + ""), codes.WHITESPACE, ...encoder.encode(this.MediaBox[3] + ""), codes.R_BRACKET);
        }
        if (this.Rotate) {
            bytes.push(...encoder.encode("/Rotate"), ...encoder.encode(" " + this.Rotate));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Parent":
                        const parentId = ObjectId.parseRef(parser, i);
                        if (parentId) {
                            this.Parent = parentId.value;
                            i = parentId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Parent property value");
                        }
                        break;
                    case "/Kids":
                        const kidIds = ObjectId.parseRefArray(parser, i);
                        if (kidIds) {
                            this.Kids = kidIds.value;
                            i = kidIds.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Kids property value");
                        }
                        break;
                    case "/Count":
                        const count = parser.parseNumberAt(i, false);
                        if (count) {
                            this.Count = count.value;
                            i = count.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Count property value");
                        }
                        break;
                    case "/MediaBox":
                        const mediaBox = parser.parseNumberArrayAt(i, true);
                        if (mediaBox) {
                            this.MediaBox = [
                                mediaBox.value[0],
                                mediaBox.value[1],
                                mediaBox.value[2],
                                mediaBox.value[3],
                            ];
                            i = mediaBox.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /MediaBox property value");
                        }
                        break;
                    case "/Rotate":
                        const rotate = parser.parseNumberAt(i, false);
                        if (rotate) {
                            this.Rotate = rotate.value;
                            i = rotate.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Rotate property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Kids || isNaN(this.Count)) {
            return false;
        }
        return true;
    }
}

class TrailerStream extends PdfStream {
    constructor() {
        super(streamTypes.XREF);
    }
    static parse(parseInfo) {
        const trailer = new TrailerStream();
        const parseResult = trailer.tryParseProps(parseInfo);
        return parseResult
            ? { value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Size) {
            bytes.push(...encoder.encode("/Size"), ...encoder.encode(" " + this.Size));
        }
        if (this.Prev) {
            bytes.push(...encoder.encode("/Prev"), ...encoder.encode(" " + this.Prev));
        }
        if (this.Root) {
            bytes.push(...encoder.encode("/Root"), codes.WHITESPACE, ...this.Root.toArray(cryptInfo));
        }
        if (this.Encrypt) {
            bytes.push(...encoder.encode("/Encrypt"), codes.WHITESPACE, ...this.Encrypt.toArray(cryptInfo));
        }
        if (this.Info) {
            bytes.push(...encoder.encode("/Info"), codes.WHITESPACE, ...this.Info.toArray(cryptInfo));
        }
        if (this.ID) {
            bytes.push(...encoder.encode("/ID"), codes.L_BRACKET, ...this.ID[0].toArray(cryptInfo), ...this.ID[1].toArray(cryptInfo), codes.R_BRACKET);
        }
        if (this.Index) {
            bytes.push(...encoder.encode("/Index"), codes.L_BRACKET);
            this.Index.forEach(x => bytes.push(...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.W) {
            bytes.push(...encoder.encode("/W"), codes.L_BRACKET, ...encoder.encode(this.W[0] + ""), codes.WHITESPACE, ...encoder.encode(this.W[1] + ""), codes.WHITESPACE, ...encoder.encode(this.W[2] + ""), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        var _a;
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        if (this.Type !== dictTypes.XREF) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const dictBounds = parser.getDictBoundsAt(start);
        let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Size":
                        const size = parser.parseNumberAt(i, false);
                        if (size) {
                            this.Size = size.value;
                            i = size.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Prev":
                        const prev = parser.parseNumberAt(i, false);
                        if (prev) {
                            this.Prev = prev.value;
                            i = prev.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Root":
                        const rootId = ObjectId.parseRef(parser, i);
                        if (rootId) {
                            this.Root = rootId.value;
                            i = rootId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Root property value");
                        }
                        break;
                    case "/Encrypt":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.REF) {
                            const encryptId = ObjectId.parseRef(parser, i);
                            if (encryptId) {
                                this.Encrypt = encryptId.value;
                                i = encryptId.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Encrypt property value");
                            }
                        }
                        throw new Error(`Unsupported /Encrypt property value type: ${entryType}`);
                    case "/Info":
                        const infoId = ObjectId.parseRef(parser, i);
                        if (infoId) {
                            this.Info = infoId.value;
                            i = infoId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Info property value");
                        }
                        break;
                    case "/ID":
                        const ids = HexString.parseArray(parser, i);
                        if (ids) {
                            this.ID = [ids.value[0], ids.value[1]];
                            i = ids.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /ID property value");
                        }
                        break;
                    case "/Index":
                        const index = parser.parseNumberArrayAt(i);
                        if (index) {
                            this.Index = index.value;
                            i = index.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Index property value");
                        }
                        break;
                    case "/W":
                        const w = parser.parseNumberArrayAt(i);
                        if (w) {
                            this.W = [w.value[0], w.value[1], w.value[2]];
                            i = w.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /W property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, dictBounds.contentEnd);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.W || !this.Size || !this.Root || (this.Encrypt && !this.ID)) {
            return false;
        }
        if (!((_a = this.Index) === null || _a === void 0 ? void 0 : _a.length)) {
            this.Index = [0, this.Size];
        }
        return true;
    }
}

class XRef {
    constructor(type) {
        this._type = type;
    }
    get type() {
        return this._type;
    }
    get offset() {
        return this._offset;
    }
}

class XRefEntry {
    constructor(type, id, generation, byteOffset, nextFreeId, streamId, streamIndex) {
        this.type = type;
        this.id = id;
        this.generation = generation;
        this.byteOffset = byteOffset;
        this.nextFreeId = nextFreeId;
        this.streamId = streamId;
        this.streamIndex = streamIndex;
    }
    static *fromTableBytes(bytes) {
        let i = 0;
        let j = 0;
        while (i < bytes.length) {
            const firstIndexBytes = [];
            let firstIndexDigit = bytes[i++];
            while (DIGIT_CHARS.has(firstIndexDigit)) {
                firstIndexBytes.push(firstIndexDigit);
                firstIndexDigit = bytes[i++];
            }
            let firstIndex = parseInt(firstIndexBytes.map(x => String.fromCharCode(x)).join(""), 10);
            const countBytes = [];
            let countDigit = bytes[i++];
            while (DIGIT_CHARS.has(countDigit)) {
                countBytes.push(countDigit);
                countDigit = bytes[i++];
            }
            const count = parseInt(countBytes.map(x => String.fromCharCode(x)).join(""), 10);
            while (!DIGIT_CHARS.has(bytes[i])) {
                i++;
            }
            for (j = 0; j < count; j++) {
                const value = parseInt(Array.from(bytes.subarray(i, i + 10))
                    .map(x => String.fromCharCode(x)).join(""), 10);
                i += 11;
                const gen = parseInt(Array.from(bytes.subarray(i, i + 5))
                    .map(x => String.fromCharCode(x)).join(""), 10);
                i += 6;
                const typeByte = bytes[i];
                if (typeByte === codes.f) {
                    yield new XRefEntry(xRefEntryTypes.FREE, firstIndex++, gen, null, value);
                }
                else if (typeByte === codes.n) {
                    yield new XRefEntry(xRefEntryTypes.NORMAL, firstIndex++, gen, value);
                }
                i += 3;
            }
        }
        return;
    }
    static *fromStreamBytes(bytes, w, index) {
        const [w1, w2, w3] = w;
        const entryLength = w1 + w2 + w3;
        if (bytes.length % entryLength) {
            throw new Error("Incorrect stream length");
        }
        const count = bytes.length / entryLength;
        const ids = new Array(count);
        if (index === null || index === void 0 ? void 0 : index.length) {
            let id;
            let n;
            let m = 0;
            for (let k = 0; k < index.length; k++) {
                if (!(k % 2)) {
                    id = index[k];
                }
                else {
                    for (n = 0; n < index[k]; n++) {
                        ids[m++] = id + n;
                    }
                }
            }
        }
        else {
            let l = 0;
            while (l < count) {
                ids[l++] = l;
            }
        }
        let i = 0;
        let j = 0;
        let type;
        let value1;
        let value2;
        while (i < bytes.length) {
            type = w1
                ? parseIntFromBytes(bytes.slice(i, i + w1))
                : 1;
            i += w1;
            value1 = parseIntFromBytes(bytes.slice(i, i + w2));
            i += w2;
            value2 = w3
                ? parseIntFromBytes(bytes.slice(i, i + w3))
                : null;
            i += w3;
            switch (type) {
                case xRefEntryTypes.FREE:
                    yield new XRefEntry(xRefEntryTypes.FREE, ids[j++], value2 !== null && value2 !== void 0 ? value2 : maxGeneration, null, value1);
                    break;
                case xRefEntryTypes.NORMAL:
                    yield new XRefEntry(xRefEntryTypes.NORMAL, ids[j++], value2 !== null && value2 !== void 0 ? value2 : 0, value1);
                    break;
                case xRefEntryTypes.COMPRESSED:
                    yield new XRefEntry(xRefEntryTypes.COMPRESSED, ids[j++], 0, null, null, value1, value2);
                    break;
            }
        }
        return;
    }
    static toTableBytes(entries) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length)) {
            return null;
        }
        const encoder = new TextEncoder();
        const groups = this.groupEntries(entries);
        let bytes = new Uint8Array();
        let temp;
        let line;
        for (const group of groups) {
            line = `${group[0]} ${group[1].length}\r\n`;
            temp = new Uint8Array(bytes.length + line.length);
            temp.set(bytes);
            temp.set(encoder.encode(line), bytes.length);
            bytes = temp;
            for (const entry of group[1]) {
                switch (entry.type) {
                    case xRefEntryTypes.FREE:
                        line = `${entry.nextFreeId.toString().padStart(10, "0")} ${entry.generation.toString().padStart(5, "0")} f\r\n`;
                        break;
                    case xRefEntryTypes.NORMAL:
                        line = `${entry.byteOffset.toString().padStart(10, "0")} ${entry.generation.toString().padStart(5, "0")} n\r\n`;
                        break;
                    default:
                        continue;
                }
                temp = new Uint8Array(bytes.length + line.length);
                temp.set(bytes);
                temp.set(encoder.encode(line), bytes.length);
                bytes = temp;
            }
        }
        return bytes;
    }
    static toStreamBytes(entries, w = [1, 4, 2]) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length)) {
            return null;
        }
        if (Math.min(...w) < 0) {
            throw new Error("Negative length values are not permitted");
        }
        let [w1, w2, w3] = w;
        w1 !== null && w1 !== void 0 ? w1 : (w1 = 0);
        w2 !== null && w2 !== void 0 ? w2 : (w2 = 4);
        w3 !== null && w3 !== void 0 ? w3 : (w3 = 0);
        const entryLength = w1 + w2 + w3;
        let w1ToBytesFunc;
        let w2ToBytesFunc;
        let w3ToBytesFunc;
        switch (w1) {
            case 0:
                w1ToBytesFunc = () => new Uint8Array();
                break;
            case 1:
                w1ToBytesFunc = int8ToBytes;
                break;
            case 2:
                w1ToBytesFunc = int16ToBytes;
                break;
            default:
                w2ToBytesFunc = (n) => new Uint8Array([...new Array(w1 - 2).fill(0), ...int16ToBytes(n)]);
                break;
        }
        switch (w2) {
            case 1:
                w2ToBytesFunc = int8ToBytes;
                break;
            case 2:
                w2ToBytesFunc = int16ToBytes;
                break;
            case 3:
                w2ToBytesFunc = (n) => new Uint8Array([0, ...int16ToBytes(n)]);
                break;
            case 4:
                w2ToBytesFunc = int32ToBytes;
                break;
            default:
                w2ToBytesFunc = (n) => new Uint8Array([...new Array(w1 - 4).fill(0), ...int32ToBytes(n)]);
                break;
        }
        switch (w3) {
            case 0:
                w3ToBytesFunc = () => new Uint8Array();
                break;
            case 1:
                w3ToBytesFunc = int8ToBytes;
                break;
            case 2:
                w3ToBytesFunc = int16ToBytes;
                break;
            default:
                w2ToBytesFunc = (n) => new Uint8Array([...new Array(w1 - 2).fill(0), ...int16ToBytes(n)]);
                break;
        }
        new TextEncoder();
        const groups = this.groupEntries(entries);
        const index = [];
        let bytes = new Uint8Array();
        let temp;
        let entryV1;
        let entryV2;
        let entryV3;
        for (const group of groups) {
            index.push(group[0], group[1].length);
            for (const entry of group[1]) {
                switch (entry.type) {
                    case xRefEntryTypes.FREE:
                        entryV1 = w1ToBytesFunc(0);
                        entryV2 = w2ToBytesFunc(entry.nextFreeId);
                        entryV3 = w3ToBytesFunc(entry.generation);
                        break;
                    case xRefEntryTypes.NORMAL:
                        entryV1 = w1ToBytesFunc(1);
                        entryV2 = w2ToBytesFunc(entry.byteOffset);
                        entryV3 = w3ToBytesFunc(entry.generation);
                        break;
                    case xRefEntryTypes.COMPRESSED:
                        entryV1 = w1ToBytesFunc(2);
                        entryV2 = w2ToBytesFunc(entry.streamId);
                        entryV3 = w3ToBytesFunc(entry.streamIndex);
                        break;
                    default:
                        continue;
                }
                temp = new Uint8Array(bytes.length + entryLength);
                temp.set(bytes);
                temp.set(entryV1, bytes.length);
                temp.set(entryV2, bytes.length + w1);
                temp.set(entryV3, bytes.length + w1 + w2);
                bytes = temp;
            }
        }
        return { bytes, index };
    }
    static groupEntries(entries) {
        entries.sort((a, b) => a.id - b.id);
        const groups = [];
        let groupStart;
        let groupEntries;
        let last;
        for (const entry of entries) {
            if (entry.id !== last + 1) {
                if (groupEntries === null || groupEntries === void 0 ? void 0 : groupEntries.length) {
                    groups.push([groupStart, groupEntries]);
                }
                groupStart = entry.id;
                groupEntries = [entry];
            }
            else {
                groupEntries.push(entry);
            }
            last = entry.id;
        }
        if (groupEntries === null || groupEntries === void 0 ? void 0 : groupEntries.length) {
            groups.push([groupStart, groupEntries]);
        }
        return groups;
    }
}

class XRefStream extends XRef {
    constructor(trailer, offset) {
        super(xRefTypes.STREAM);
        this._trailerStream = trailer;
        this._offset = offset;
    }
    get prev() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.Prev;
    }
    get size() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.Size;
    }
    get root() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.Root;
    }
    get info() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.Root;
    }
    get encrypt() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.Encrypt;
    }
    get id() {
        var _a;
        return (_a = this._trailerStream) === null || _a === void 0 ? void 0 : _a.ID;
    }
    static createFrom(base, entries, offset) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length) || !base) {
            return null;
        }
        const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
        const size = Math.max(entriesSize, base.size);
        return XRefStream.create(entries, size, offset, base.root, base.offset, base.info, base.encrypt, base.id);
    }
    static create(entries, size, offset, root, prev, info, encrypt, id) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length) || !size || !offset || !root) {
            return null;
        }
        const trailer = new TrailerStream();
        trailer.Size = size;
        trailer.Root = root;
        trailer.Prev = prev;
        trailer.Info = info;
        trailer.Encrypt = encrypt;
        trailer.ID = id;
        const w = [1, 4, 2];
        const data = XRefEntry.toStreamBytes(entries, w);
        const params = new DecodeParamsDict();
        params.setIntProp("/Predictor", flatePredictors.PNG_UP);
        params.setIntProp("/Columns", 5);
        params.setIntProp("/Colors", 1);
        params.setIntProp("/BitsPerComponent", 8);
        const stream = new XRefStream(trailer, offset);
        stream._trailerStream.Filter = streamFilters.FLATE;
        stream._trailerStream.DecodeParms = params;
        stream._trailerStream.W = w;
        stream._trailerStream.Index = data.index;
        stream._trailerStream.streamData = data.bytes;
        return stream;
    }
    static parse(parseInfo, offset) {
        if (!parseInfo) {
            return null;
        }
        const trailerStream = TrailerStream.parse(parseInfo);
        if (!trailerStream) {
            return null;
        }
        const xrefStream = new XRefStream(trailerStream.value, offset);
        return {
            value: xrefStream,
            start: null,
            end: null,
        };
    }
    createUpdate(entries, offset) {
        return XRefStream.createFrom(this, entries, offset);
    }
    getEntries() {
        if (!this._trailerStream) {
            return [];
        }
        const entries = XRefEntry.fromStreamBytes(this._trailerStream.decodedStreamData, this._trailerStream.W, this._trailerStream.Index);
        return entries;
    }
    toArray(cryptInfo) {
        return this._trailerStream.toArray(cryptInfo);
    }
}

class TrailerDict extends PdfDict {
    constructor() {
        super(dictTypes.EMPTY);
    }
    static parse(parseInfo) {
        const trailer = new TrailerDict();
        const parseResult = trailer.tryParseProps(parseInfo);
        return parseResult
            ? { value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Size) {
            bytes.push(...encoder.encode("/Size"), ...encoder.encode(" " + this.Size));
        }
        if (this.Prev) {
            bytes.push(...encoder.encode("/Prev"), ...encoder.encode(" " + this.Prev));
        }
        if (this.Root) {
            bytes.push(...encoder.encode("/Root"), codes.WHITESPACE, ...this.Root.toArray(cryptInfo));
        }
        if (this.Encrypt) {
            bytes.push(...encoder.encode("/Encrypt"), codes.WHITESPACE, ...this.Encrypt.toArray(cryptInfo));
        }
        if (this.Info) {
            bytes.push(...encoder.encode("/Info"), codes.WHITESPACE, ...this.Info.toArray(cryptInfo));
        }
        if (this.ID) {
            bytes.push(...encoder.encode("/ID"), codes.L_BRACKET, ...this.ID[0].toArray(cryptInfo), ...this.ID[1].toArray(cryptInfo), codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Size":
                        const size = parser.parseNumberAt(i, false);
                        if (size) {
                            this.Size = size.value;
                            i = size.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Prev":
                        const prev = parser.parseNumberAt(i, false);
                        if (prev) {
                            this.Prev = prev.value;
                            i = prev.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Size property value");
                        }
                        break;
                    case "/Root":
                        const rootId = ObjectId.parseRef(parser, i);
                        if (rootId) {
                            this.Root = rootId.value;
                            i = rootId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Root property value");
                        }
                        break;
                    case "/Encrypt":
                        const entryType = parser.getValueTypeAt(i);
                        if (entryType === valueTypes.REF) {
                            const encryptId = ObjectId.parseRef(parser, i);
                            if (encryptId) {
                                this.Encrypt = encryptId.value;
                                i = encryptId.end + 1;
                                break;
                            }
                            else {
                                throw new Error("Can't parse /Encrypt property value");
                            }
                        }
                        throw new Error(`Unsupported /Encrypt property value type: ${entryType}`);
                    case "/Info":
                        const infoId = ObjectId.parseRef(parser, i);
                        if (infoId) {
                            this.Info = infoId.value;
                            i = infoId.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Info property value");
                        }
                        break;
                    case "/ID":
                        const ids = HexString.parseArray(parser, i);
                        if (ids) {
                            this.ID = [ids.value[0], ids.value[1]];
                            i = ids.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /ID property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Size || !this.Root || (this.Encrypt && !this.ID)) {
            return false;
        }
        return true;
    }
}

class XRefTable extends XRef {
    constructor(table, trailer, offset) {
        super(xRefTypes.TABLE);
        this._table = table;
        this._trailerDict = trailer;
        this._offset = offset;
    }
    get prev() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.Prev;
    }
    get size() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.Size;
    }
    get root() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.Root;
    }
    get info() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.Root;
    }
    get encrypt() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.Encrypt;
    }
    get id() {
        var _a;
        return (_a = this._trailerDict) === null || _a === void 0 ? void 0 : _a.ID;
    }
    static createFrom(base, entries, offset) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length) || !base) {
            return null;
        }
        const entriesSize = Math.max(...entries.map(x => x.id)) + 1;
        const size = Math.max(entriesSize, base.size);
        return XRefTable.create(entries, size, offset, base.root, base.offset, base.info, base.encrypt, base.id);
    }
    static create(entries, size, offset, root, prev, info, encrypt, id) {
        if (!(entries === null || entries === void 0 ? void 0 : entries.length) || !size || !offset || !root) {
            return null;
        }
        const trailer = new TrailerDict();
        trailer.Size = size;
        trailer.Prev = prev;
        trailer.Root = root;
        trailer.Info = info;
        trailer.Encrypt = encrypt;
        trailer.ID = id;
        const data = XRefEntry.toTableBytes(entries);
        const table = new XRefTable(data, trailer, offset);
        return table;
    }
    static parse(parser, start, offset) {
        if (!parser || isNaN(start)) {
            return null;
        }
        const xrefTableBounds = parser.getXrefTableBoundsAt(start);
        if (!xrefTableBounds) {
            return null;
        }
        const trailerDictBounds = parser.getDictBoundsAt(xrefTableBounds.end + 1);
        if (!trailerDictBounds) {
            return null;
        }
        const table = parser.sliceCharCodes(xrefTableBounds.contentStart, xrefTableBounds.contentEnd);
        const trailerDict = TrailerDict.parse({ parser, bounds: trailerDictBounds });
        if (!trailerDict) {
            return null;
        }
        const xrefTable = new XRefTable(table, trailerDict.value, offset);
        return {
            value: xrefTable,
            start: null,
            end: null,
        };
    }
    createUpdate(entries, offset) {
        return XRefTable.createFrom(this, entries, offset);
    }
    getEntries() {
        if (!this._table.length) {
            return [];
        }
        const entries = XRefEntry.fromTableBytes(this._table);
        return entries;
    }
    toArray(cryptInfo) {
        const trailerBytes = this._trailerDict.toArray(cryptInfo);
        const bytes = [
            ...keywordCodes.XREF_TABLE, ...keywordCodes.END_OF_LINE,
            ...this._table,
            ...keywordCodes.TRAILER, ...keywordCodes.END_OF_LINE,
            ...trailerBytes, ...keywordCodes.END_OF_LINE,
        ];
        return new Uint8Array(bytes);
    }
}

class DataWriter {
    constructor(data) {
        if (!(data === null || data === void 0 ? void 0 : data.length)) {
            throw new Error("Data is empty");
        }
        this._data = [...data];
        this._pointer = data.length - 1;
        this._encoder = new TextEncoder();
        this.fixEof();
    }
    get offset() {
        return this._pointer;
    }
    getCurrentData() {
        return new Uint8Array(this._data);
    }
    writeBytes(bytes) {
        if (!(bytes === null || bytes === void 0 ? void 0 : bytes.length)) {
            return;
        }
        this._data.push(...bytes);
        this._pointer += bytes.length;
    }
    writeIndirectObject(cryptInfo, obj) {
        if (!(cryptInfo === null || cryptInfo === void 0 ? void 0 : cryptInfo.ref) || !obj) {
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
    writeEof(xrefOffset) {
        const eof = [
            ...keywordCodes.XREF_START, ...keywordCodes.END_OF_LINE,
            ...this._encoder.encode(xrefOffset + ""), ...keywordCodes.END_OF_LINE,
            ...keywordCodes.END_OF_FILE, ...keywordCodes.END_OF_LINE
        ];
        this.writeBytes(eof);
    }
    fixEof() {
        if (this._data[this._pointer] !== codes.LINE_FEED) {
            if (this._data[this._pointer - 1] !== codes.CARRIAGE_RETURN) {
                this._data.push(codes.CARRIAGE_RETURN, codes.LINE_FEED);
                this._pointer += 2;
            }
            else {
                this._data.push(codes.LINE_FEED);
                this._pointer += 1;
            }
        }
    }
}

class ReferenceData {
    constructor(xrefs) {
        var _a;
        const allFreeEntries = [];
        const allNormalEntries = [];
        const allCompressedEntries = [];
        let maxId = 0;
        xrefs.forEach(x => {
            for (const entry of x.getEntries()) {
                switch (entry.type) {
                    case xRefEntryTypes.FREE:
                        allFreeEntries.push(entry);
                        break;
                    case xRefEntryTypes.NORMAL:
                        allNormalEntries.push(entry);
                        break;
                    case xRefEntryTypes.COMPRESSED:
                        allCompressedEntries.push(entry);
                        break;
                    default:
                        continue;
                }
                if (entry.id > maxId) {
                    maxId = entry.id;
                }
            }
        });
        this.size = maxId + 1;
        const zeroFreeRef = {
            id: 0,
            generation: maxGeneration,
            nextFreeId: 0,
        };
        const freeLinkedList = new LinkedList(zeroFreeRef);
        const freeOutsideListMap = new Map();
        const freeMap = new Map();
        let zeroFound = false;
        for (const entry of allFreeEntries) {
            if (!zeroFound && entry.id === 0) {
                zeroFound = true;
                zeroFreeRef.nextFreeId = entry.nextFreeId;
                continue;
            }
            const valueFromMap = freeMap.get(entry.id);
            if (!valueFromMap || valueFromMap.generation < entry.generation) {
                freeMap.set(entry.id, {
                    id: entry.id,
                    generation: entry.generation,
                    nextFreeId: entry.nextFreeId
                });
            }
        }
        let nextId = zeroFreeRef.nextFreeId;
        let next;
        while (nextId) {
            next = freeMap.get(nextId);
            freeMap.delete(nextId);
            freeLinkedList.push(next);
            nextId = next.nextFreeId;
        }
        [...freeMap].forEach(x => {
            const value = x[1];
            if (value.generation === maxGeneration && value.nextFreeId === 0) {
                freeOutsideListMap.set(value.id, value);
            }
        });
        this.freeLinkedList = freeLinkedList;
        this.freeOutsideListMap = freeOutsideListMap;
        const normalRefs = new Map();
        for (const entry of allNormalEntries) {
            if (this.isFreed(entry)) {
                continue;
            }
            const valueFromMap = normalRefs.get(entry.id);
            if (valueFromMap && valueFromMap.generation >= entry.generation) {
                continue;
            }
            normalRefs.set(entry.id, {
                id: entry.id,
                generation: entry.generation,
                byteOffset: entry.byteOffset,
            });
        }
        for (const entry of allCompressedEntries) {
            if (this.isFreed(entry)) {
                continue;
            }
            const valueFromMap = normalRefs.get(entry.id);
            if (valueFromMap) {
                continue;
            }
            const offset = (_a = normalRefs.get(entry.streamId)) === null || _a === void 0 ? void 0 : _a.byteOffset;
            if (offset) {
                normalRefs.set(entry.id, {
                    id: entry.id,
                    generation: entry.generation,
                    byteOffset: offset,
                    compressed: true,
                    streamId: entry.streamId,
                    streamIndex: entry.streamIndex,
                });
            }
        }
        this.usedMap = normalRefs;
    }
    getOffset(id) {
        var _a;
        return (_a = this.usedMap.get(id)) === null || _a === void 0 ? void 0 : _a.byteOffset;
    }
    getGeneration(id) {
        var _a;
        return (_a = this.usedMap.get(id)) === null || _a === void 0 ? void 0 : _a.generation;
    }
    isFreed(ref) {
        return this.freeOutsideListMap.has(ref.id)
            || this.freeLinkedList.has(ref, (a, b) => a.id === b.id && a.generation < b.generation);
    }
    isUsed(id) {
        return this.usedMap.has(id);
    }
}
class ReferenceDataChange {
    constructor(refData) {
        this._refData = refData;
        this._size = refData.size;
        const freeLinkedList = new LinkedList();
        for (const freeRef of refData.freeLinkedList) {
            freeLinkedList.push(freeRef);
        }
        this._freeLinkedList = freeLinkedList;
        this._usedMap = new Map();
    }
    get size() {
        return this._size;
    }
    takeFreeRef(byteOffset, forceNew = false) {
        let ref;
        if (!forceNew && this._freeLinkedList.length > 1) {
            const freeRef = this._freeLinkedList.pop();
            this._freeLinkedList.tail.nextFreeId = 0;
            ref = {
                id: freeRef.id,
                generation: freeRef.generation,
                byteOffset,
            };
        }
        else {
            ref = {
                id: this._size++,
                generation: 0,
                byteOffset,
            };
        }
        this._usedMap.set(ref.id, ref);
        return ref;
    }
    setRefFree(id) {
        if (this._usedMap.has(id)) {
            this._usedMap.delete(id);
            if (this._size > this._refData.size && this._size === id + 1) {
                this._size--;
            }
        }
        if (this._refData.isUsed(id)) {
            const gen = this._refData.getGeneration(id);
            const ref = { id: id, generation: gen + 1, nextFreeId: 0 };
            const index = this._freeLinkedList.findIndex(ref, (a, b) => a.id === b.id && a.generation <= b.generation);
            if (index !== -1) {
                return;
            }
            const lastFreeRef = this._freeLinkedList.tail;
            lastFreeRef.nextFreeId = id;
            this._freeLinkedList.push(ref);
        }
    }
    updateUsedRef(ref) {
        if (ref.compressed && ref.generation) {
            return false;
        }
        if (this.isFreed(ref)) {
            return false;
        }
        const current = this._usedMap.get(ref.id);
        if (current) {
            if (ref.generation >= current.generation) {
                this._usedMap.set(ref.id, ref);
                return true;
            }
        }
        if (this._refData.isUsed(ref.id)) {
            const gen = this._refData.getGeneration(ref.generation);
            if (ref.generation >= gen) {
                this._usedMap.set(ref.id, ref);
                return true;
            }
        }
        return false;
    }
    exportEntries() {
        const entries = [];
        for (const entry of this._freeLinkedList) {
            entries.push(new XRefEntry(xRefEntryTypes.FREE, entry.id, entry.generation, null, entry.nextFreeId));
        }
        this._usedMap.forEach(v => {
            if (v.compressed) {
                entries.push(new XRefEntry(xRefEntryTypes.COMPRESSED, v.id, 0, null, null, v.streamId, v.streamIndex));
            }
            else {
                entries.push(new XRefEntry(xRefEntryTypes.NORMAL, v.id, v.generation, v.byteOffset));
            }
        });
        return entries;
    }
    isFreed(ref) {
        return this._freeLinkedList.has(ref, (a, b) => a.id === b.id && a.generation < b.generation);
    }
    isUsed(id) {
        return this._usedMap.has(id) || this._refData.isUsed(id);
    }
}

const polyIntents = {
    CLOUD: "/PolygonCloud",
    POLYGON_DIMESION: "/PolygonDimension",
    POLYLINE_DIMESION: "/PolyLineDimension",
};
class PolyAnnotation extends GeometricAnnotation {
    constructor(type) {
        super(type);
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.Vertices) {
            bytes.push(...encoder.encode("/Vertices"), codes.L_BRACKET);
            this.Vertices.forEach(x => bytes.push(...encoder.encode(" " + x)));
            bytes.push(codes.R_BRACKET);
        }
        if (this.IT) {
            bytes.push(...encoder.encode("/IT"), ...encoder.encode(this.IT));
        }
        if (this.Measure) {
            bytes.push(...encoder.encode("/Measure"), ...this.Measure.toArray(cryptInfo));
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/Vertices":
                        const vertices = parser.parseNumberArrayAt(i, true);
                        if (vertices) {
                            this.Vertices = vertices.value;
                            i = vertices.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /Vertices property value");
                        }
                        break;
                    case "/IT":
                        const intent = parser.parseNameAt(i, true);
                        if (intent) {
                            if (Object.values(polyIntents).includes(intent.value)) {
                                this.IT = intent.value;
                                i = intent.end + 1;
                                break;
                            }
                        }
                        throw new Error("Can't parse /IT property value");
                    case "/Measure":
                        const measureEntryType = parser.getValueTypeAt(i);
                        if (measureEntryType === valueTypes.REF) {
                            const measureDictId = ObjectId.parseRef(parser, i);
                            if (measureDictId && parseInfo.parseInfoGetter) {
                                const measureParseInfo = parseInfo.parseInfoGetter(measureDictId.value.id);
                                if (measureParseInfo) {
                                    const measureDict = MeasureDict.parse(measureParseInfo);
                                    if (measureDict) {
                                        this.Measure = measureDict.value;
                                        i = measureDict.end + 1;
                                        break;
                                    }
                                }
                            }
                            throw new Error("Can't parse /Measure value reference");
                        }
                        else if (measureEntryType === valueTypes.DICTIONARY) {
                            const measureDictBounds = parser.getDictBoundsAt(i);
                            if (measureDictBounds) {
                                const measureDict = MeasureDict.parse({ parser, bounds: measureDictBounds });
                                if (measureDict) {
                                    this.Measure = measureDict.value;
                                    i = measureDict.end + 1;
                                    break;
                                }
                            }
                            throw new Error("Can't parse /Measure value dictionary");
                        }
                        throw new Error(`Unsupported /Measure property value type: ${measureEntryType}`);
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        if (!this.Vertices) {
            return false;
        }
        return true;
    }
}

class PolygonAnnotation extends PolyAnnotation {
    constructor() {
        super(annotationTypes.POLYGON);
    }
    static parse(parseInfo) {
        const text = new PolygonAnnotation();
        const parseResult = text.tryParseProps(parseInfo);
        return parseResult
            ? { value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        return superBytes;
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        return true;
    }
}

class PolylineAnnotation extends PolyAnnotation {
    constructor() {
        super(annotationTypes.POLYLINE);
        this.LE = [lineEndingTypes.NONE, lineEndingTypes.NONE];
    }
    static parse(parseInfo) {
        const text = new PolylineAnnotation();
        const parseResult = text.tryParseProps(parseInfo);
        return parseResult
            ? { value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end }
            : null;
    }
    toArray(cryptInfo) {
        const superBytes = super.toArray(cryptInfo);
        const encoder = new TextEncoder();
        const bytes = [];
        if (this.LE) {
            bytes.push(...encoder.encode("/LE"), codes.L_BRACKET);
            this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
            bytes.push(codes.R_BRACKET);
        }
        const totalBytes = [
            ...superBytes.subarray(0, 2),
            ...bytes,
            ...superBytes.subarray(2, superBytes.length)
        ];
        return new Uint8Array(totalBytes);
    }
    tryParseProps(parseInfo) {
        const superIsParsed = super.tryParseProps(parseInfo);
        if (!superIsParsed) {
            return false;
        }
        const { parser, bounds } = parseInfo;
        const start = bounds.contentStart || bounds.start;
        const end = bounds.contentEnd || bounds.end;
        let i = parser.skipToNextName(start, end - 1);
        if (i === -1) {
            return false;
        }
        let name;
        let parseResult;
        while (true) {
            parseResult = parser.parseNameAt(i);
            if (parseResult) {
                i = parseResult.end + 1;
                name = parseResult.value;
                switch (name) {
                    case "/LE":
                        const lineEndings = parser.parseNameAt(i, true);
                        if (lineEndings
                            && Object.values(lineEndingTypes).includes(lineEndings.value[0])
                            && Object.values(lineEndingTypes).includes(lineEndings.value[1])) {
                            this.LE = [
                                lineEndings.value[0],
                                lineEndings.value[1],
                            ];
                            i = lineEndings.end + 1;
                        }
                        else {
                            throw new Error("Can't parse /LE property value");
                        }
                        break;
                    default:
                        i = parser.skipToNextName(i, end - 1);
                        break;
                }
            }
            else {
                break;
            }
        }
        return true;
    }
}

class DocumentData {
    constructor(data) {
        this.getObjectParseInfo = (id) => {
            var _a, _b, _c;
            if (!id) {
                return null;
            }
            const offset = (_a = this._referenceData) === null || _a === void 0 ? void 0 : _a.getOffset(id);
            if (isNaN(offset)) {
                return null;
            }
            const objectId = ObjectId.parse(this._docParser, offset);
            if (!objectId) {
                return null;
            }
            const bounds = this._docParser.getIndirectObjectBoundsAt(objectId.end + 1, true);
            if (!bounds) {
                return null;
            }
            const parseInfoGetter = this.getObjectParseInfo;
            const info = {
                parser: this._docParser,
                bounds,
                parseInfoGetter,
                cryptInfo: {
                    ref: { id: objectId.value.id, generation: objectId.value.generation },
                    stringCryptor: (_b = this._authResult) === null || _b === void 0 ? void 0 : _b.stringCryptor,
                    streamCryptor: (_c = this._authResult) === null || _c === void 0 ? void 0 : _c.streamCryptor,
                },
            };
            if (objectId.value.id === id) {
                return info;
            }
            const stream = ObjectStream.parse(info);
            if (!stream) {
                return;
            }
            const objectParseInfo = stream.value.getObjectData(id);
            if (objectParseInfo) {
                objectParseInfo.parseInfoGetter = parseInfoGetter;
                return objectParseInfo;
            }
            return null;
        };
        this._data = data;
        this._docParser = new DataParser(data);
        this._version = this._docParser.getPdfVersion();
        const lastXrefIndex = this._docParser.getLastXrefIndex();
        if (!lastXrefIndex) {
            {
                throw new Error("File doesn't contain update section");
            }
        }
        const xrefs = DocumentData.parseAllXrefs(this._docParser, lastXrefIndex.value);
        if (!xrefs.length) {
            {
                throw new Error("Failed to parse cross-reference sections");
            }
        }
        this._xrefs = xrefs;
        this._referenceData = new ReferenceData(xrefs);
        this.parseEncryption();
    }
    get size() {
        var _a;
        if ((_a = this._xrefs) === null || _a === void 0 ? void 0 : _a.length) {
            return this._xrefs[0].size;
        }
        else {
            return 0;
        }
    }
    get encrypted() {
        return !!this._encryption;
    }
    get authenticated() {
        return !this._encryption || !!this._authResult;
    }
    static parseXref(parser, start, max) {
        if (!parser || !start) {
            return null;
        }
        const offset = start;
        const xrefTableIndex = parser.findSubarrayIndex(keywordCodes.XREF_TABLE, { minIndex: start, closedOnly: true });
        if (xrefTableIndex && xrefTableIndex.start === start) {
            const xrefStmIndexProp = parser.findSubarrayIndex(keywordCodes.XREF_HYBRID, { minIndex: start, maxIndex: max, closedOnly: true });
            if (xrefStmIndexProp) {
                const streamXrefIndex = parser.parseNumberAt(xrefStmIndexProp.end + 1);
                if (!streamXrefIndex) {
                    return null;
                }
                start = streamXrefIndex.value;
            }
            else {
                const xrefTable = XRefTable.parse(parser, start, offset);
                return xrefTable === null || xrefTable === void 0 ? void 0 : xrefTable.value;
            }
        }
        const id = ObjectId.parse(parser, start, false);
        if (!id) {
            return null;
        }
        const xrefStreamBounds = parser.getIndirectObjectBoundsAt(id.end + 1);
        if (!xrefStreamBounds) {
            return null;
        }
        const xrefStream = XRefStream.parse({ parser: parser, bounds: xrefStreamBounds }, offset);
        return xrefStream === null || xrefStream === void 0 ? void 0 : xrefStream.value;
    }
    static parseAllXrefs(parser, start) {
        const xrefs = [];
        let max = parser.maxIndex;
        let xref;
        while (start) {
            xref = DocumentData.parseXref(parser, start, max);
            if (xref) {
                xrefs.push(xref);
                max = start;
                start = xref.prev;
            }
            else {
                break;
            }
        }
        return xrefs;
    }
    authenticate(password) {
        if (this.authenticated) {
            return true;
        }
        const cryptOptions = this._encryption.toCryptOptions();
        const fileId = this._xrefs[0].id[0].hex;
        const cryptorSource = new DataCryptHandler(cryptOptions, fileId);
        this._authResult = cryptorSource.authenticate(password);
        return this.authenticated;
    }
    getRefinedData(idsToDelete) {
        this.checkAuthentication();
        const changeData = new ReferenceDataChange(this._referenceData);
        idsToDelete.forEach(x => changeData.setRefFree(x));
        const writer = new DataWriter(this._data);
        const newXrefOffset = writer.offset;
        const newXrefRef = changeData.takeFreeRef(newXrefOffset, true);
        const entries = changeData.exportEntries();
        const lastXref = this._xrefs[0];
        const newXref = lastXref.createUpdate(entries, newXrefOffset);
        writer.writeIndirectObject({ ref: newXrefRef }, newXref);
        writer.writeEof(newXrefOffset);
        const bytes = writer.getCurrentData();
        return bytes;
    }
    getSupportedAnnotations() {
        var _a;
        this.checkAuthentication();
        if (!this._catalog) {
            this.parsePageTree();
        }
        const annotationMap = new Map();
        for (const page of this._pages) {
            if (!page.Annots) {
                break;
            }
            const annotationIds = [];
            if (Array.isArray(page.Annots)) {
                annotationIds.push(...page.Annots);
            }
            else {
                const parseInfo = this.getObjectParseInfo(page.Annots.id);
                if (parseInfo) {
                    const annotationRefs = ObjectId.parseRefArray(parseInfo.parser, parseInfo.bounds.contentStart);
                    if ((_a = annotationRefs === null || annotationRefs === void 0 ? void 0 : annotationRefs.value) === null || _a === void 0 ? void 0 : _a.length) {
                        annotationIds.push(...annotationRefs.value);
                    }
                }
            }
            const annotations = [];
            for (const objectId of annotationIds) {
                const info = this.getObjectParseInfo(objectId.id);
                info.rect = page.MediaBox;
                const annotationType = info.parser.parseDictSubtype(info.bounds);
                let annot;
                switch (annotationType) {
                    case annotationTypes.STAMP:
                        annot = StampAnnotation.parse(info);
                        break;
                    case annotationTypes.TEXT:
                        annot = TextAnnotation.parse(info);
                        break;
                    case annotationTypes.FREE_TEXT:
                        annot = FreeTextAnnotation.parse(info);
                        break;
                    case annotationTypes.CIRCLE:
                        annot = CircleAnnotation.parse(info);
                        break;
                    case annotationTypes.SQUARE:
                        annot = SquareAnnotation.parse(info);
                        break;
                    case annotationTypes.POLYGON:
                        annot = PolygonAnnotation.parse(info);
                        break;
                    case annotationTypes.POLYLINE:
                        annot = PolylineAnnotation.parse(info);
                        break;
                    case annotationTypes.LINE:
                        annot = LineAnnotation.parse(info);
                        break;
                    case annotationTypes.INK:
                        annot = InkAnnotation.parse(info);
                        break;
                }
                if (annot) {
                    annotations.push(annot.value);
                    console.log(annot.value);
                }
            }
            annotationMap.set(page.id, annotations);
        }
        return annotationMap;
    }
    checkAuthentication() {
        if (!this.authenticated) {
            throw new Error("Unauthorized access to file data");
        }
    }
    parseEncryption() {
        const encryptionId = this._xrefs[0].encrypt;
        if (!encryptionId) {
            return;
        }
        const encryptionParseInfo = this.getObjectParseInfo(encryptionId.id);
        const encryption = EncryptionDict.parse(encryptionParseInfo);
        if (!encryption) {
            throw new Error("Encryption dict can't be parsed");
        }
        this._encryption = encryption.value;
    }
    parsePageTree() {
        const catalogId = this._xrefs[0].root;
        const catalogParseInfo = this.getObjectParseInfo(catalogId.id);
        const catalog = CatalogDict.parse(catalogParseInfo);
        if (!catalog) {
            throw new Error("Document root catalog not found");
        }
        this._catalog = catalog.value;
        const pageRootId = catalog.value.Pages;
        const pageRootParseInfo = this.getObjectParseInfo(pageRootId.id);
        const pageRootTree = PageTreeDict.parse(pageRootParseInfo);
        if (!pageRootTree) {
            throw new Error("Document root page tree not found");
        }
        this._pageRoot = pageRootTree.value;
        const pages = [];
        this.parsePages(pages, pageRootTree.value);
        this._pages = pages;
    }
    parsePages(output, tree) {
        if (!tree.Kids.length) {
            return;
        }
        for (const kid of tree.Kids) {
            const parseInfo = this.getObjectParseInfo(kid.id);
            if (!parseInfo) {
                continue;
            }
            const type = parseInfo.parser.parseDictType(parseInfo.bounds);
            if (type === dictTypes.PAGE_TREE) {
                const kidTree = PageTreeDict.parse(parseInfo);
                if (kidTree) {
                    this.parsePages(output, kidTree.value);
                }
            }
            else if (type === dictTypes.PAGE) {
                const kidPage = PageDict.parse(parseInfo);
                if (kidPage) {
                    output.push(kidPage.value);
                }
            }
        }
    }
    ;
}

class AnnotationData {
    constructor(pdfData) {
        this.onAnnotationDictChange = {
            set: (target, prop, value) => {
                target[prop] = value;
                return true;
            },
        };
        if (!(pdfData === null || pdfData === void 0 ? void 0 : pdfData.length)) {
            throw new Error("Data is empty");
        }
        this._sourceData = pdfData;
        this._documentData = new DocumentData(pdfData);
    }
    tryAuthenticate(password = "") {
        if (!this._documentData.authenticated) {
            return this._documentData.authenticate(password);
        }
        return true;
    }
    getRefinedData() {
        const annotations = this.getAnnotationMap();
        const idsToDelete = [];
        if (annotations === null || annotations === void 0 ? void 0 : annotations.size) {
            this.getAnnotationMap().forEach(x => {
                x.forEach(y => {
                    if (y.id) {
                        idsToDelete.push(y.id);
                        if (y instanceof MarkupAnnotation && y.Popup) {
                            idsToDelete.push(y.Popup.id);
                        }
                    }
                });
            });
        }
        return this._documentData.getRefinedData(idsToDelete);
    }
    getExportedData() {
        return null;
    }
    getPageAnnotations(pageId) {
        const annotations = this.getAnnotationMap().get(pageId);
        if (!annotations) {
            return [];
        }
        return annotations.map(x => new Proxy(x, this.onAnnotationDictChange));
    }
    addAnnotation(pageId, annotation) {
        const pageAnnotations = this.getAnnotationMap().get(pageId);
        if (pageAnnotations) {
            pageAnnotations.push(annotation);
        }
        else {
            this.getAnnotationMap().set(pageId, [annotation]);
        }
    }
    removeAnnotation(annotation) {
        annotation.isDeleted = true;
    }
    getAnnotationMap() {
        if (this._annotationsByPageId) {
            return this._annotationsByPageId;
        }
        if (!this._documentData.authenticated) {
            throw new Error("Unauthorized access to file data");
        }
        this._annotationsByPageId = this._documentData.getSupportedAnnotations();
        return this._annotationsByPageId;
    }
}

var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class TsPdfViewer {
    constructor(containerSelector, workerSrc) {
        this._visibleAdjPages = 0;
        this._previewWidth = 100;
        this._minScale = 0.25;
        this._maxScale = 4;
        this._scale = 1;
        this._previewerHidden = true;
        this._pages = [];
        this._currentPage = 0;
        this._mode = "normal";
        this._pointerInfo = {
            lastPos: null,
            downPos: null,
            downScroll: null,
        };
        this._timers = {
            hidePanels: 0,
        };
        this._pinchInfo = {
            active: false,
            lastDist: 0,
            minDist: 10,
            sensitivity: 0.025,
            target: null,
        };
        this.onPdfLoadingProgress = (progressData) => {
        };
        this.onPdfLoadedAsync = (doc, annotationData) => __awaiter$3(this, void 0, void 0, function* () {
            this._pdfDocument = doc;
            this._annotationData = annotationData;
            yield this.refreshPagesAsync();
            this.renderVisiblePreviews();
            this.renderVisiblePages();
            this._shadowRoot.querySelector("#panel-bottom").classList.remove("disabled");
        });
        this.onPdfClosedAsync = () => __awaiter$3(this, void 0, void 0, function* () {
            this._shadowRoot.querySelector("#panel-bottom").classList.add("disabled");
            if (this._pdfDocument) {
                this._pdfDocument = null;
            }
            yield this.refreshPagesAsync();
        });
        this.onMainContainerResize = (entries, observer) => {
            const { width } = this._mainContainer.getBoundingClientRect();
            if (width < 721) {
                this._mainContainer.classList.add("mobile");
            }
            else {
                this._mainContainer.classList.remove("mobile");
            }
        };
        this.onHandToggleClick = () => {
            if (this._mode === "hand") {
                this._mode = "normal";
                this._viewer.classList.remove("hand");
                this._shadowRoot.querySelector("div#toggle-hand").classList.remove("on");
            }
            else {
                this._mode = "hand";
                this._viewer.classList.add("hand");
                this._shadowRoot.querySelector("div#toggle-hand").classList.add("on");
            }
        };
        this.onPreviewerToggleClick = () => {
            if (this._previewerHidden) {
                this._mainContainer.classList.remove("hide-previewer");
                this._shadowRoot.querySelector("div#toggle-previewer").classList.add("on");
                this._previewerHidden = false;
                setTimeout(() => this.renderVisiblePreviews(), 1000);
            }
            else {
                this._mainContainer.classList.add("hide-previewer");
                this._shadowRoot.querySelector("div#toggle-previewer").classList.remove("on");
                this._previewerHidden = true;
            }
        };
        this.onPreviewerPageClick = (e) => {
            let target = e.target;
            let pageNumber;
            while (target && !pageNumber) {
                const data = target.dataset["pageNumber"];
                if (data) {
                    pageNumber = +data;
                }
                else {
                    target = target.parentElement;
                }
            }
            if (pageNumber) {
                this.scrollToPage(pageNumber - 1);
            }
        };
        this.onPreviewerScroll = (e) => {
            this.renderVisiblePreviews();
        };
        this.onPaginatorInput = (event) => {
            if (event.target instanceof HTMLInputElement) {
                event.target.value = event.target.value.replace(/[^\d]+/g, "");
            }
        };
        this.onPaginatorChange = (event) => {
            if (event.target instanceof HTMLInputElement) {
                const pageNumber = Math.max(Math.min(+event.target.value, this._pdfDocument.numPages), 1);
                if (pageNumber + "" !== event.target.value) {
                    event.target.value = pageNumber + "";
                }
                this.scrollToPage(pageNumber - 1);
            }
        };
        this.onPaginatorPrevClick = () => {
            const pageNumber = clamp(this._currentPage - 1, 0, this._pages.length - 1);
            this.scrollToPage(pageNumber);
        };
        this.onPaginatorNextClick = () => {
            const pageNumber = clamp(this._currentPage + 1, 0, this._pages.length - 1);
            this.scrollToPage(pageNumber);
        };
        this.onZoomOutClick = () => {
            this.zoomOut();
        };
        this.onZoomInClick = () => {
            this.zoomIn();
        };
        this.onZoomFitViewerClick = () => {
            const cWidth = this._viewer.getBoundingClientRect().width;
            const pWidth = this._pages[this._currentPage].viewContainer.getBoundingClientRect().width;
            const scale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
            this.setScale(scale);
            this.scrollToPage(this._currentPage);
        };
        this.onZoomFitPageClick = () => {
            const { width: cWidth, height: cHeight } = this._viewer.getBoundingClientRect();
            const { width: pWidth, height: pHeight } = this._pages[this._currentPage].viewContainer.getBoundingClientRect();
            const hScale = clamp((cWidth - 20) / pWidth * this._scale, this._minScale, this._maxScale);
            const vScale = clamp((cHeight - 20) / pHeight * this._scale, this._minScale, this._maxScale);
            this.setScale(Math.min(hScale, vScale));
            this.scrollToPage(this._currentPage);
        };
        this.onViewerScroll = (e) => {
            this.renderVisiblePages();
        };
        this.onViewerPointerMove = (event) => {
            const { clientX, clientY } = event;
            const { x: rectX, y: rectY, width, height } = this._viewer.getBoundingClientRect();
            const l = clientX - rectX;
            const t = clientY - rectY;
            const r = width - l;
            const b = height - t;
            if (Math.min(l, r, t, b) > 100) {
                if (!this._panelsHidden && !this._timers.hidePanels) {
                    this._timers.hidePanels = setTimeout(() => {
                        this._mainContainer.classList.add("hide-panels");
                        this._panelsHidden = true;
                        this._timers.hidePanels = null;
                    }, 5000);
                }
            }
            else {
                if (this._timers.hidePanels) {
                    clearTimeout(this._timers.hidePanels);
                    this._timers.hidePanels = null;
                }
                if (this._panelsHidden) {
                    this._mainContainer.classList.remove("hide-panels");
                    this._panelsHidden = false;
                }
            }
            this._pointerInfo.lastPos = new Vec2(clientX, clientY);
        };
        this.onViewerPointerDown = (event) => {
            if (this._mode !== "hand") {
                return;
            }
            const { clientX, clientY } = event;
            this._pointerInfo.downPos = new Vec2(clientX, clientY);
            this._pointerInfo.downScroll = new Vec2(this._viewer.scrollLeft, this._viewer.scrollTop);
            const onPointerMove = (moveEvent) => {
                const { x, y } = this._pointerInfo.downPos;
                const { x: left, y: top } = this._pointerInfo.downScroll;
                const dX = moveEvent.clientX - x;
                const dY = moveEvent.clientY - y;
                this._viewer.scrollTo(left - dX, top - dY);
            };
            const onPointerUp = (upEvent) => {
                this._pointerInfo.downPos = null;
                this._pointerInfo.downScroll = null;
                window.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", onPointerUp);
                window.removeEventListener("pointerout", onPointerUp);
            };
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointerout", onPointerUp);
        };
        this.onViewerTouchStart = (event) => {
            if (event.touches.length !== 2) {
                return;
            }
            const a = event.touches[0];
            const b = event.touches[1];
            this._pinchInfo.active = true;
            this._pinchInfo.lastDist = getDistance(a.clientX, a.clientY, b.clientX, b.clientY);
            const onTouchMove = (moveEvent) => {
                if (moveEvent.touches.length !== 2) {
                    return;
                }
                const mA = moveEvent.touches[0];
                const mB = moveEvent.touches[1];
                const dist = getDistance(mA.clientX, mA.clientY, mB.clientX, mB.clientY);
                const delta = dist - this._pinchInfo.lastDist;
                const factor = Math.floor(delta / this._pinchInfo.minDist);
                if (factor) {
                    const center = new Vec2((mB.clientX + mA.clientX) / 2, (mB.clientY + mA.clientY) / 2);
                    this._pinchInfo.lastDist = dist;
                    this.zoom(factor * this._pinchInfo.sensitivity, center);
                }
            };
            const onTouchEnd = (endEvent) => {
                this._pinchInfo.active = false;
                this._pinchInfo.lastDist = 0;
                event.target.removeEventListener("touchmove", onTouchMove);
                event.target.removeEventListener("touchend", onTouchEnd);
                event.target.removeEventListener("touchcancel", onTouchEnd);
            };
            event.target.addEventListener("touchmove", onTouchMove);
            event.target.addEventListener("touchend", onTouchEnd);
            event.target.addEventListener("touchcancel", onTouchEnd);
        };
        this.onViewerWheel = (event) => {
            if (!event.ctrlKey) {
                return;
            }
            event.preventDefault();
            if (event.deltaY > 0) {
                this.zoomOut(this._pointerInfo.lastPos);
            }
            else {
                this.zoomIn(this._pointerInfo.lastPos);
            }
        };
        const container = document.querySelector(containerSelector);
        if (!container) {
            throw new Error("Container not found");
        }
        else if (!(container instanceof HTMLDivElement)) {
            throw new Error("Container is not a DIV element");
        }
        else {
            this._outerContainer = container;
        }
        if (!workerSrc) {
            throw new Error("Worker source path not defined");
        }
        GlobalWorkerOptions.workerSrc = workerSrc;
        this.initViewerGUI();
    }
    destroy() {
        var _a, _b;
        (_a = this._pdfLoadingTask) === null || _a === void 0 ? void 0 : _a.destroy();
        this._pages.forEach(x => x.destroy());
        if (this._pdfDocument) {
            this._pdfDocument.cleanup();
            this._pdfDocument.destroy();
        }
        (_b = this._mainContainerResizeObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
        this._shadowRoot.innerHTML = "";
    }
    openPdfAsync(src) {
        return __awaiter$3(this, void 0, void 0, function* () {
            let data;
            let doc;
            try {
                if (src instanceof Uint8Array) {
                    data = src;
                }
                else {
                    let blob;
                    if (typeof src === "string") {
                        const res = yield fetch(src);
                        blob = yield res.blob();
                    }
                    else {
                        blob = src;
                    }
                    const buffer = yield blob.arrayBuffer();
                    data = new Uint8Array(buffer);
                }
            }
            catch (e) {
                throw new Error(`Cannot load file data: ${e.message}`);
            }
            const annotationData = new AnnotationData(data);
            let password;
            while (true) {
                const authenticated = annotationData.tryAuthenticate(password);
                if (!authenticated) {
                    password = yield this.showPasswordDialogAsync();
                    if (password === null) {
                        throw new Error("File loading cancelled: authentication aborted");
                    }
                    continue;
                }
                break;
            }
            data = annotationData.getRefinedData();
            try {
                if (this._pdfLoadingTask) {
                    yield this.closePdfAsync();
                    return this.openPdfAsync(data);
                }
                this._pdfLoadingTask = getDocument({ data, password });
                this._pdfLoadingTask.onProgress = this.onPdfLoadingProgress;
                doc = yield this._pdfLoadingTask.promise;
                this._pdfLoadingTask = null;
            }
            catch (e) {
                throw new Error(`Cannot open PDF: ${e.message}`);
            }
            yield this.onPdfLoadedAsync(doc, annotationData);
        });
    }
    closePdfAsync() {
        return __awaiter$3(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                if (!this._pdfLoadingTask.destroyed) {
                    yield this._pdfLoadingTask.destroy();
                }
                this._pdfLoadingTask = null;
            }
            yield this.onPdfClosedAsync();
        });
    }
    initViewerGUI() {
        this._shadowRoot = this._outerContainer.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = styles + html;
        const paginatorInput = this._shadowRoot.getElementById("paginator-input");
        paginatorInput.addEventListener("input", this.onPaginatorInput);
        paginatorInput.addEventListener("change", this.onPaginatorChange);
        this._shadowRoot.querySelector("#paginator-prev").addEventListener("click", this.onPaginatorPrevClick);
        this._shadowRoot.querySelector("#paginator-next").addEventListener("click", this.onPaginatorNextClick);
        this._shadowRoot.querySelector("#zoom-out").addEventListener("click", this.onZoomOutClick);
        this._shadowRoot.querySelector("#zoom-in").addEventListener("click", this.onZoomInClick);
        this._shadowRoot.querySelector("#zoom-fit-viewer").addEventListener("click", this.onZoomFitViewerClick);
        this._shadowRoot.querySelector("#zoom-fit-page").addEventListener("click", this.onZoomFitPageClick);
        this._shadowRoot.querySelector("div#toggle-previewer").addEventListener("click", this.onPreviewerToggleClick);
        this._shadowRoot.querySelector("div#toggle-hand").addEventListener("click", this.onHandToggleClick);
        this._previewer = this._shadowRoot.querySelector("div#previewer");
        this._previewer.addEventListener("scroll", this.onPreviewerScroll);
        this._viewer = this._shadowRoot.querySelector("div#viewer");
        this._viewer.addEventListener("scroll", this.onViewerScroll);
        this._viewer.addEventListener("wheel", this.onViewerWheel);
        this._viewer.addEventListener("pointermove", this.onViewerPointerMove);
        this._viewer.addEventListener("pointerdown", this.onViewerPointerDown);
        this._viewer.addEventListener("touchstart", this.onViewerTouchStart);
        this._mainContainer = this._shadowRoot.querySelector("div#main-container");
        const resizeObserver = new ResizeObserver(this.onMainContainerResize);
        resizeObserver.observe(this._mainContainer);
        this._mainContainerResizeObserver = resizeObserver;
    }
    refreshPagesAsync() {
        var _a;
        return __awaiter$3(this, void 0, void 0, function* () {
            this._pages.forEach(x => {
                x.previewContainer.removeEventListener("click", this.onPreviewerPageClick);
                x.destroy();
            });
            this._pages.length = 0;
            const docPagesNumber = ((_a = this._pdfDocument) === null || _a === void 0 ? void 0 : _a.numPages) || 0;
            this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";
            if (!docPagesNumber) {
                return;
            }
            for (let i = 0; i < docPagesNumber; i++) {
                const pageProxy = yield this._pdfDocument.getPage(i + 1);
                const page = new PageView(pageProxy, this._annotationData, this._maxScale, this._previewWidth);
                page.scale = this._scale;
                page.previewContainer.addEventListener("click", this.onPreviewerPageClick);
                this._previewer.append(page.previewContainer);
                this._viewer.append(page.viewContainer);
                this._pages.push(page);
            }
        });
    }
    renderVisiblePreviews() {
        if (this._previewerHidden) {
            return;
        }
        const pages = this._pages;
        const visiblePreviewNumbers = this.getVisiblePages(this._previewer, pages, true);
        const minPageNumber = Math.max(Math.min(...visiblePreviewNumbers) - this._visibleAdjPages, 0);
        const maxPageNumber = Math.min(Math.max(...visiblePreviewNumbers) + this._visibleAdjPages, pages.length - 1);
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (i >= minPageNumber && i <= maxPageNumber) {
                page.renderPreviewAsync();
            }
        }
    }
    renderVisiblePages() {
        var _a, _b;
        const pages = this._pages;
        const visiblePageNumbers = this.getVisiblePages(this._viewer, pages);
        const prevCurrent = this._currentPage;
        const current = this.getCurrentPage(this._viewer, pages, visiblePageNumbers);
        if (!prevCurrent || prevCurrent !== current) {
            (_a = pages[prevCurrent]) === null || _a === void 0 ? void 0 : _a.previewContainer.classList.remove("current");
            (_b = pages[current]) === null || _b === void 0 ? void 0 : _b.previewContainer.classList.add("current");
            this._shadowRoot.getElementById("paginator-input").value = current + 1 + "";
            this.scrollToPreview(current);
            this._currentPage = current;
        }
        if (current === -1) {
            return;
        }
        const minPageNumber = Math.max(Math.min(...visiblePageNumbers) - this._visibleAdjPages, 0);
        const maxPageNumber = Math.min(Math.max(...visiblePageNumbers) + this._visibleAdjPages, pages.length - 1);
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (i >= minPageNumber && i <= maxPageNumber) {
                page.renderViewAsync();
            }
            else {
                page.clearView();
            }
        }
    }
    scrollToPreview(pageNumber) {
        const { top: cTop, height: cHeight } = this._previewer.getBoundingClientRect();
        const { top: pTop, height: pHeight } = this._pages[pageNumber].previewContainer.getBoundingClientRect();
        const cCenter = cTop + cHeight / 2;
        const pCenter = pTop + pHeight / 2;
        const scroll = pCenter - cCenter + this._previewer.scrollTop;
        this._previewer.scrollTo(0, scroll);
    }
    scrollToPage(pageNumber) {
        const { top: cTop } = this._viewer.getBoundingClientRect();
        const { top: pTop } = this._pages[pageNumber].viewContainer.getBoundingClientRect();
        const scroll = pTop - (cTop - this._viewer.scrollTop);
        this._viewer.scrollTo(this._viewer.scrollLeft, scroll);
    }
    setScale(scale, cursorPosition = null) {
        if (!scale || scale === this._scale) {
            return;
        }
        let pageContainerUnderPivot;
        let xPageRatio;
        let yPageRatio;
        if (cursorPosition) {
            for (const page of this._pages) {
                const { x: x, y: y } = cursorPosition;
                const { x: pX, y: pY, width: pWidth, height: pHeight } = page.viewContainer.getBoundingClientRect();
                if (pX <= x
                    && pX + pWidth >= x
                    && pY <= y
                    && pY + pHeight >= y) {
                    pageContainerUnderPivot = page.viewContainer;
                    xPageRatio = (x - pX) / pWidth;
                    yPageRatio = (y - pY) / pHeight;
                    break;
                }
            }
        }
        this._scale = scale;
        this._pages.forEach(x => x.scale = this._scale);
        if (pageContainerUnderPivot
            &&
                (this._viewer.scrollHeight > this._viewer.clientHeight
                    || this._viewer.scrollWidth > this._viewer.clientWidth)) {
            const { x: initialX, y: initialY } = cursorPosition;
            const { x: pX, y: pY, width: pWidth, height: pHeight } = pageContainerUnderPivot.getBoundingClientRect();
            const resultX = pX + (pWidth * xPageRatio);
            const resultY = pY + (pHeight * yPageRatio);
            let scrollLeft = this._viewer.scrollLeft + (resultX - initialX);
            let scrollTop = this._viewer.scrollTop + (resultY - initialY);
            scrollLeft = scrollLeft < 0
                ? 0
                : scrollLeft;
            scrollTop = scrollTop < 0
                ? 0
                : scrollTop;
            if (scrollTop !== this._viewer.scrollTop
                || scrollLeft !== this._viewer.scrollLeft) {
                this._viewer.scrollTo(scrollLeft, scrollTop);
                return;
            }
        }
        setTimeout(() => this.renderVisiblePages(), 0);
    }
    zoom(diff, cursorPosition = null) {
        const scale = clamp(this._scale + diff, this._minScale, this._maxScale);
        this.setScale(scale, cursorPosition || this.getViewerCenterPosition());
    }
    zoomOut(cursorPosition = null) {
        this.zoom(-0.25, cursorPosition);
    }
    zoomIn(cursorPosition = null) {
        this.zoom(0.25, cursorPosition);
    }
    getViewerCenterPosition() {
        const { x, y, width, height } = this._viewer.getBoundingClientRect();
        return new Vec2(x + width / 2, y + height / 2);
    }
    getVisiblePages(container, pages, preview = false) {
        const pagesVisible = new Set();
        if (!pages.length) {
            return pagesVisible;
        }
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cBottom = cRect.top + cRect.height;
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const pRect = preview
                ? page.previewContainer.getBoundingClientRect()
                : page.viewContainer.getBoundingClientRect();
            const pTop = pRect.top;
            const pBottom = pRect.top + pRect.height;
            if (pTop < cBottom && pBottom > cTop) {
                pagesVisible.add(i);
            }
            else if (pagesVisible.size) {
                break;
            }
        }
        return pagesVisible;
    }
    getCurrentPage(container, pages, visiblePageNumbers) {
        const visiblePageNumbersArray = [...visiblePageNumbers];
        if (!visiblePageNumbersArray.length) {
            return -1;
        }
        else if (visiblePageNumbersArray.length === 1) {
            return visiblePageNumbersArray[0];
        }
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cMiddle = cRect.top + cRect.height / 2;
        for (const i of visiblePageNumbersArray) {
            const pRect = pages[i].viewContainer.getBoundingClientRect();
            const pTop = pRect.top;
            if (pTop > cTop) {
                if (pTop > cMiddle) {
                    return i - 1;
                }
                else {
                    return i;
                }
            }
        }
        throw new Error("Incorrect argument");
    }
    showPasswordDialogAsync() {
        return __awaiter$3(this, void 0, void 0, function* () {
            const passwordPromise = new Promise((resolve, reject) => {
                const dialogContainer = document.createElement("div");
                dialogContainer.id = "password-dialog";
                dialogContainer.innerHTML = passwordDialogHtml;
                this._mainContainer.append(dialogContainer);
                let value = "";
                const input = this._shadowRoot.getElementById("password-input");
                input.placeholder = "Enter password...";
                input.addEventListener("change", () => value = input.value);
                const ok = () => {
                    dialogContainer.remove();
                    resolve(value);
                };
                const cancel = () => {
                    dialogContainer.remove();
                    resolve(null);
                };
                dialogContainer.addEventListener("click", (e) => {
                    if (e.target === dialogContainer) {
                        cancel();
                    }
                });
                this._shadowRoot.getElementById("password-ok").addEventListener("click", ok);
                this._shadowRoot.getElementById("password-cancel").addEventListener("click", cancel);
            });
            return passwordPromise;
        });
    }
}

export { TsPdfViewer };
