// Generated by dts-bundle-generator v5.8.0

export declare type Quadruple = readonly [
	x1: number,
	y1: number,
	x2: number,
	y2: number
];
export declare type Hextuple = readonly [
	a: number,
	b: number,
	d: number,
	e: number,
	g: number,
	h: number
];
export interface AnnotationDto {
	annotationType: string;
	uuid: string;
	pageId: number;
	dateCreated: string;
	dateModified: string;
	author: string;
	textContent: string;
	rect: Quadruple;
	bbox?: Quadruple;
	matrix?: Hextuple;
}
export interface AnnotEventDetail {
	type: "select" | "add" | "edit" | "delete";
	annotations: AnnotationDto[];
}
export declare class AnnotEvent extends CustomEvent<AnnotEventDetail> {
	constructor(detail: AnnotEventDetail);
}
export declare type FileButtons = "open" | "save" | "close";
export interface TsPdfViewerOptions {
	containerSelector: string;
	workerSource: string;
	userName?: string;
	fileButtons?: FileButtons[];
	fileOpenAction?: () => void;
	fileSaveAction?: () => void;
	fileCloseAction?: () => void;
	annotChangeCallback?: (detail: AnnotEventDetail) => void;
	visibleAdjPages?: number;
	previewWidth?: number;
	minScale?: number;
	maxScale?: number;
}
export declare class TsPdfViewer {
	private readonly _userName;
	private readonly _outerContainer;
	private readonly _shadowRoot;
	private readonly _mainContainer;
	private readonly _eventController;
	private readonly _pageService;
	private readonly _viewer;
	private readonly _previewer;
	private _fileOpenAction;
	private _fileSaveAction;
	private _fileCloseAction;
	private _annotChangeCallback;
	private _mainContainerRObserver;
	private _panelsHidden;
	private _fileInput;
	private _pdfLoadingTask;
	private _pdfDocument;
	private _docData;
	private _annotationBuilder;
	private _timers;
	constructor(options: TsPdfViewerOptions);
	private static downloadFile;
	destroy(): void;
	openPdfAsync(src: string | Blob | Uint8Array): Promise<void>;
	closePdfAsync(): Promise<void>;
	importAnnotations(dtos: AnnotationDto[]): void;
	exportAnnotations(): AnnotationDto[];
	importAnnotationsFromJson(json: string): void;
	exportAnnotationsToJson(): string;
	getCurrentPdf(): Blob;
	private initMainContainerEventHandlers;
	private initViewControls;
	private initFileButtons;
	private onFileInput;
	private onOpenFileButtonClick;
	private onSaveFileButtonClick;
	private onCloseFileButtonClick;
	private initModeSwitchButtons;
	private initAnnotationButtons;
	private setViewerMode;
	private disableCurrentViewerMode;
	private onTextModeButtonClick;
	private onHandModeButtonClick;
	private onAnnotationModeButtonClick;
	private onZoomOutClick;
	private onZoomInClick;
	private onZoomFitViewerClick;
	private onZoomFitPageClick;
	private onPaginatorInput;
	private onPaginatorChange;
	private onPaginatorPrevClick;
	private onPaginatorNextClick;
	private onCurrentPagesChanged;
	private onAnnotationChange;
	private onAnnotatorDataChanged;
	private setAnnotationMode;
	private onAnnotationEditTextButtonClick;
	private onAnnotationDeleteButtonClick;
	private onAnnotationSelectModeButtonClick;
	private onAnnotationStampModeButtonClick;
	private onAnnotationPenModeButtonClick;
	private onAnnotationGeometricModeButtonClick;
	private onPdfLoadingProgress;
	private refreshPagesAsync;
	private onPreviewerToggleClick;
	private onMainContainerPointerMove;
	private showPasswordDialogAsync;
	private showTextDialogAsync;
}

export {};
