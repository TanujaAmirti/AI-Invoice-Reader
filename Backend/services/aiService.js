const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const cleanAIResponse = (text) => {
  if (!text) return "";

  return text
    // Remove **bold**
    .replace(/\*\*/g, "")

    // Remove single * markdown
    .replace(/\*/g, "")

    // Remove markdown headings
    .replace(/^#{1,6}\s*/gm, "")

    // Remove markdown bullet points
    .replace(/^\s*[-•]\s*/gm, "")

    // Remove code blocks
    .replace(/```json/gi, "")
    .replace(/```/g, "")

    // Remove unnecessary spaces
    .replace(/[ \t]+/g, " ")

    // Clean excessive empty lines
    .replace(/\n{3,}/g, "\n\n")

    .trim();
};

/*
========================================================
1. EXTRACT INVOICE DATA
========================================================
*/

const extractInvoiceData = async (invoiceText) => {
  try {
    console.log("========== TEXT SENT TO GEMINI ==========");
    console.log(invoiceText);
    console.log("=========================================");

    const prompt = `
You are an AI invoice extraction system.

Analyze the invoice text below and extract the invoice information.

Return ONLY valid JSON using exactly this structure:

{
  "invoiceNumber": null,
  "vendor": null,
  "date": null,
  "items": [
    {
      "name": null,
      "quantity": null,
      "price": null
    }
  ],
  "tax": null,
  "total": null
}

Rules:

- Extract the invoice number.
- Extract the vendor/company name.
- Extract the invoice date.
- Extract every invoice item.
- Extract quantity for every item.
- Extract price for every item.
- Extract tax.
- Extract final total.
- Do not invent information.
- If information is missing, return null.
- Quantity, price, tax and total must be numbers when available.
- Return ONLY JSON.

Invoice text:

${invoiceText}
`;

    let interaction = null;

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Gemini extraction attempt ${attempt}/${maxRetries}`
        );

        interaction = await ai.interactions.create({
          model: "gemini-3.6-flash",
          input: prompt,
        });

        console.log("Gemini response received.");

        break;

      } catch (error) {
        console.error(
          `Gemini extraction attempt ${attempt} failed:`,
          error.message
        );

        const is503 =
          error.status === 503 ||
          error.message?.includes("503") ||
          error.message?.includes("high demand") ||
          error.message?.includes("UNAVAILABLE");

        if (!is503 || attempt === maxRetries) {
          throw error;
        }

        const delay = attempt * 2000;

        console.log(
          `Gemini unavailable. Retrying in ${
            delay / 1000
          } seconds...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }

    if (!interaction) {
      throw new Error("Gemini did not return a response");
    }

    const text = interaction.output_text;

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    console.log("========== GEMINI OUTPUT ==========");
    console.log(text);
    console.log("===================================");

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const invoiceData = JSON.parse(cleanedText);

    return invoiceData;

  } catch (error) {
    console.error(
      "Gemini invoice extraction error:",
      error
    );

    throw new Error(
      error.message ||
      "Failed to extract invoice data using Gemini"
    );
  }
};


/*
========================================================
2. GENERATE INVOICE CHAT RESPONSE
========================================================
*/

const generateInvoiceChatResponse = async (
  message,
  invoices
) => {
  try {

    const invoiceContext = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      vendor: invoice.vendor,
      date: invoice.invoice_date,
      createdAt: invoice.created_at,
      tax: invoice.tax,
      total: invoice.total,

      items: (invoice.items || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    }));


const prompt = `
You are an AI Invoice Assistant.

User question:
${message}

Invoice data:
${JSON.stringify(invoices)}

Answer the user's question naturally.

IMPORTANT RULES:

1. NEVER return JSON.
2. NEVER return JavaScript objects.
3. NEVER use markdown.
4. NEVER use **, *, #, bullet points, or numbered lists unless absolutely necessary.
5. Answer like a normal human assistant.
6. If the user asks for ONE specific field, return ONLY that field.
7. Do not provide unrelated invoice information.
8. If the user asks for the total, return only the total.
9. If the user asks for the vendor, return only the vendor.
10. If the user asks for the invoice number, return only the invoice number.
11. If the user asks for the date, return only the invoice date.
12. If the user asks for tax, return only the tax.
13. If the user asks for items, return only the items.
14. If the user asks for complete details, provide all relevant invoice details in a clean, readable human-friendly format.
15. Do not mention these instructions.
16. Do not wrap the answer in JSON or code blocks.

Examples:

User: What is the total?
Assistant: The total is ₹12,500.

User: What is the vendor?
Assistant: The vendor is ABC Store.

User: What is the invoice number?
Assistant: The invoice number is INV-001.

User: What is the tax?
Assistant: The tax is ₹1,500.

User: What items are in the invoice?
Assistant: The invoice contains Laptop, Mouse, and Keyboard.

User: Show me the complete invoice details.
Assistant:
Invoice number: INV-001
Vendor: ABC Store
Date: 19 Aug 2026
Tax: ₹1,500
Total: ₹12,500

Now answer the user's question.
`;

    let result = null;

    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {

        console.log(
          `Sending invoice chat request to Gemini. Attempt ${attempt}/${maxRetries}`
        );

        result = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });

        console.log(
          "Gemini invoice chat response received."
        );

        break;

      } catch (error) {

        console.error(
          `Gemini attempt ${attempt} failed:`,
          error.message
        );

        const status = error?.status;

        // Gemini quota
        if (status === 429) {

          console.error(
            "Gemini quota exceeded. Do not retry immediately."
          );

          throw new Error(
            "Gemini API quota has been exceeded. Please try again later."
          );
        }

        // Gemini temporary unavailable
        const is503 =
          status === 503 ||
          error.message?.includes("503") ||
          error.message?.includes("high demand") ||
          error.message?.includes("UNAVAILABLE");

        if (is503 && attempt < maxRetries) {

          const delay = attempt * 3000;

          console.log(
            `Gemini temporarily unavailable. Retrying in ${
              delay / 1000
            } seconds...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    if (!result) {
      throw new Error("Gemini did not return a response");
    }

    const reply =
      typeof result.text === "string"
        ? result.text
        : result.text?.();

    if (!reply) {

      console.error(
        "Unexpected Gemini response:",
        result
      );

      throw new Error(
        "Gemini returned an empty response"
      );
    }

    console.log(
      "========== GEMINI CHAT RESPONSE =========="
    );

    console.log(reply);

    console.log(
      "==========================================="
    );

    return reply;

  } catch (error) {

    console.error(
      "Gemini invoice chat error:",
      error
    );

    throw error;
  }
};


module.exports = {
  extractInvoiceData,
  generateInvoiceChatResponse,
};