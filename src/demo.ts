import { AnnotEventDetail, TsPdfViewer } from "./ts-pdf-viewer";

async function run(): Promise<void> {  
  const viewer = new TsPdfViewer({
    containerSelector: "#pdf-main-container", 
    workerSource: "assets/pdf.worker.min.js",
    userName: "viva",
    fileButtons: ["open", "close", "save"],
    annotChangeCallback: (detail: AnnotEventDetail) => console.log(detail.type),
  });
  // await viewer.openPdfAsync("demo.pdf");
  // await viewer.openPdfAsync("demo-annots.pdf");
  // await viewer.openPdfAsync("demo-annots2.pdf");
  // await viewer.openPdfAsync("demo-annots3.pdf");
  // await viewer.openPdfAsync("demo-acad.pdf");
  // await viewer.openPdfAsync("demo-adobe.pdf");
  // await viewer.openPdfAsync("demo-large.pdf");
  await viewer.openPdfAsync("demo-word.pdf");
  // await viewer.openPdfAsync("demo-wps.pdf");
  // await viewer.openPdfAsync("demo-v1r2.pdf");
  // await viewer.openPdfAsync("demo-v2r3.pdf");
  // await viewer.openPdfAsync("demo-v4r4-v2.pdf");
  // await viewer.openPdfAsync("demo-v4r4-aesv2.pdf");
  // await viewer.openPdfAsync("demo-v5r5-aesv3.pdf");
  // await viewer.openPdfAsync("demo-v5r6-aesv3.pdf");

  // setTimeout(() => {
  //   viewer.closePdfAsync();
  // }, 5000);
  
  // setTimeout(() => {
  //   viewer.openPdfAsync("demo.pdf");
  // }, 10000);
  
  setTimeout(() => {
    // eslint-disable-next-line max-len
    const dtos = "[{\"annotationType\":\"/Ink\",\"uuid\":\"9917706e-80ab-4f2b-be4a-0139ae26a257\",\"pageId\":414,\"dateCreated\":\"2021-03-23T14:20:06.058Z\",\"dateModified\":\"2021-03-23T14:20:06.058Z\",\"author\":\"unknown\",\"rect\":[105.28125,17.015625,477.15625,86.390625],\"matrix\":[1,0,0,1,0,0],\"inkList\":[[476.15625,44.515625,475.15625,44.848958333333336,473.35625,46.515625,470.58482142857144,49.515625,468.78125,51.390625,465.65625,54.140625,461.90625,57.390625,457.40625,60.890625,451.90625,64.765625,445.78125,68.640625,438.90625,72.265625,431.15625,75.890625,423.28125,78.765625,415.40625,81.390625,407.90625,83.515625,400.90625,85.015625,394.53125,85.390625,388.40625,84.890625,382.65625,83.390625,377.03125,80.640625,371.28125,77.140625,365.15625,72.640625,358.40625,67.390625,351.40625,61.640625,344.53125,55.640625,338.03125,49.390625,332.28125,43.390625,327.40625,37.890625,323.40625,32.890625,320.15625,28.640625,317.78125,25.015625,315.78125,22.140625,313.78125,20.015625,311.65625,18.640625,308.65625,18.015625,305.15625,18.140625,301.28125,18.890625,297.15625,20.140625,292.65625,21.890625,288.15625,23.765625,283.90625,25.765625,280.03125,27.890625,277.03125,29.765625,274.65625,31.265625,272.65625,32.390625,271.03125,33.265625,269.78125,33.765625,268.53125,34.015625,267.40625,34.015625,266.03125,33.890625,264.40625,33.890625,262.15625,34.390625,259.15625,35.265625,255.40625,36.515625,250.90625,37.890625,245.90625,39.390625,240.65625,41.015625,235.28125,42.390625,230.03125,43.265625,225.03125,43.140625,220.28125,42.140625,215.90625,40.515625,211.78125,38.390625,208.03125,36.140625,204.40625,33.890625,201.03125,31.890625,197.40625,30.265625,194.15625,29.390625,191.40625,29.265625,189.03125,29.765625,187.03125,30.890625,185.15625,32.640625,183.28125,34.515625,181.40625,36.640625,179.65625,38.640625,177.53125,40.390625,175.03125,41.890625,171.78125,43.015625,167.90625,43.890625,163.40625,44.515625,158.53125,45.265625,153.15625,46.265625,147.65625,47.765625,142.15625,49.640625,137.03125,52.015625,132.53125,54.765625,128.78125,57.890625,125.90625,60.890625,123.65625,63.765625,122.03125,66.265625,120.78125,68.265625,119.78125,69.890625,118.53125,71.015625,117.15625,71.765625,115.53125,71.890625,113.53125,71.515625,111.28125,70.890625,108.78125,69.890625,106.28125,68.890625]],\"color\":[0,0,0.804,0.5],\"strokeWidth\":2},{\"annotationType\":\"/Ink\",\"uuid\":\"dcdf3ee8-6cde-49b0-876f-92dbef68a8d1\",\"pageId\":1,\"dateCreated\":\"2021-03-23T14:19:58.129Z\",\"dateModified\":\"2021-03-23T14:19:58.129Z\",\"author\":\"unknown\",\"rect\":[311.53125,108.15625,555.90625,351.03125],\"matrix\":[1,0,0,1,0,0],\"inkList\":[[434.15625,345.03125,431.8229166666667,345.6979166666667,423.35625,346.43125,410.58482142857144,347.88839285714283,403.03125,348.40625,390.78125,349.28125,377.15625,350.03125,363.15625,350.03125,349.53125,349.03125,337.15625,346.65625,326.90625,342.53125,318.78125,336.65625,313.90625,329.40625,312.53125,320.53125,315.65625,309.65625,324.15625,297.78125,338.65625,285.40625,358.15625,273.40625,382.53125,262.03125,409.65625,252.28125,438.15625,243.90625,466.03125,237.28125,491.90625,233.28125,514.03125,231.40625,531.15625,231.53125,543.65625,233.28125,551.03125,236.78125,554.78125,241.15625,554.90625,246.65625,552.03125,253.03125,545.90625,259.40625,537.15625,265.90625,526.03125,271.90625,513.28125,277.15625,499.53125,281.15625,485.40625,283.28125,471.90625,283.40625,459.65625,281.40625,448.90625,277.90625,440.03125,273.03125,433.40625,267.65625,428.28125,261.90625,424.40625,256.15625,421.78125,251.28125,420.15625,247.03125,419.53125,243.53125,419.78125,240.28125,420.78125,237.03125,421.90625,233.28125,423.15625,229.28125,424.40625,224.65625,425.65625,219.40625,426.40625,213.40625,426.28125,207.03125,425.15625,200.40625,423.03125,193.78125,420.03125,187.03125,416.28125,180.15625,412.03125,173.65625,407.40625,167.40625,403.03125,161.90625,399.03125,157.15625,395.78125,152.78125,393.15625,148.78125,391.28125,144.78125,390.28125,140.65625,389.90625,136.15625,389.90625,131.65625,390.15625,126.90625,390.53125,121.78125,390.90625,116.90625,391.28125,112.40625,391.53125,109.15625]],\"color\":[0,0,0,0.5],\"strokeWidth\":2},{\"annotationType\":\"/Stamp\",\"uuid\":\"5342f53c-6dfb-44c0-933f-ed7b3c6228c9\",\"pageId\":1,\"dateCreated\":\"2021-03-23T14:20:06.723Z\",\"dateModified\":\"2021-03-23T14:20:07.825Z\",\"author\":\"unknown\",\"rect\":[338.15625,315.03125,558.15625,375.03125],\"matrix\":[1,0,0,1,338.15625,315.03125],\"stampType\":\"/Draft\",\"stampImageData\":null}]";
    viewer.importAnnotationsFromJson(dtos);
  }, 5000);
} 

run();
