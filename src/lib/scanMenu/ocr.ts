import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

export async function extractTextFromImage(file: File): Promise<string> {
  const { data } = await Tesseract.recognize(file, "eng", {
    logger: (m) => console.log(m),
  });
  return data.text;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) =>
      "str" in item ? item.str : ""
    );
    fullText += strings.join(" ") + "\n";
  }

  return fullText;
}