const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");

const extractTextFromImage = async (filePath) => {
  try {
    console.log("Image OCR started...");

    const result = await Tesseract.recognize(
      filePath,
      "eng",
      {
        logger: (info) => {
          if (info.status === "recognizing text") {
            console.log(
              `OCR Progress: ${(info.progress * 100).toFixed(0)}%`
            );
          }
        },
      }
    );

    console.log("Image OCR completed.");

    return result.data.text;

  } catch (error) {
    console.error("Image OCR Error:", error);

    throw new Error(
      "Failed to extract text from image"
    );
  }
};


const extractTextFromPDF = async (filePath) => {
  try {
    console.log("PDF OCR started...");

    // pdf-to-img is an ESM package,
    // so we dynamically import it in CommonJS.
    const { pdf } = await import("pdf-to-img");

    const outputDir = path.join(
      path.dirname(filePath),
      "pdf-pages"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {
        recursive: true,
      });
    }

    const document = await pdf(filePath, {
      scale: 3,
    });

    let completeText = "";
    let pageNumber = 1;

    for await (const image of document) {

      console.log(
        `Converting PDF page ${pageNumber} to image...`
      );

      const imagePath = path.join(
        outputDir,
        `page-${Date.now()}-${pageNumber}.png`
      );

      // Save PDF page as PNG
      fs.writeFileSync(
        imagePath,
        image
      );

      console.log(
        `Running OCR on page ${pageNumber}...`
      );

      const result = await Tesseract.recognize(
        imagePath,
        "eng",
        {
          logger: (info) => {

            if (
              info.status === "recognizing text"
            ) {
              console.log(
                `Page ${pageNumber} OCR: ${(info.progress * 100).toFixed(0)}%`
              );
            }

          },
        }
      );

      completeText +=
        `\n--- PAGE ${pageNumber} ---\n`;

      completeText += result.data.text;

      pageNumber++;
    }

    if (document.destroy) {
      await document.destroy();
    }

    console.log("PDF OCR completed.");

    return completeText.trim();

  } catch (error) {

    console.error(
      "PDF OCR Error:",
      error
    );

    throw new Error(
      "Failed to extract text from PDF"
    );
  }
};


const extractText = async (
  filePath,
  mimeType
) => {

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/png"
  ) {

    return await extractTextFromImage(
      filePath
    );

  }

  if (
    mimeType === "application/pdf"
  ) {

    return await extractTextFromPDF(
      filePath
    );

  }

  throw new Error(
    "Unsupported invoice format"
  );
};


module.exports = {
  extractText,
  extractTextFromImage,
  extractTextFromPDF,
};