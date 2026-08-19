const pool = require("../config/db");

const { extractText } = require("../services/ocrService");
const { extractInvoiceData, generateInvoiceChatResponse, } = require("../services/aiService");

const uploadInvoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an invoice",
      });
    }

    console.log("Uploaded file:", req.file.originalname);

    const extractedText = await extractText(
  req.file.path,
  req.file.mimetype
);

console.log("========== OCR TEXT ==========");
    console.log(extractedText);
    console.log("================================");

console.log("OCR completed.");

const invoiceData = await extractInvoiceData(
  extractedText
);

console.log("========== GEMINI INVOICE DATA ==========");
console.log(invoiceData);
console.log("=====================================");


    return res.status(200).json({
      success: true,
      message: "Invoice uploaded and text extracted successfully",

      file: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },

      extractedText,
      invoiceData,
    });

  } catch (error) {
    console.error("Invoice processing error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process invoice",
    });
  }
};

const saveInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      vendor,
      date,
      items,
      tax,
      total,
    } = req.body;


    const userId = req.user.userId;

    console.log("Saving invoice for user:", userId);

    const formattedDate = date
  ? date.split("-").reverse().join("-")
  : null;

console.log("Original date:", date);
console.log("Formatted date:", formattedDate);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const invoiceResult = await client.query(
        `
        INSERT INTO invoices
        (
          user_id,
          invoice_number,
          vendor,
          invoice_date,
          tax,
          total
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [
          userId,
          invoiceNumber,
          vendor,
         formattedDate || null,
          tax || 0,
          total || 0,
        ]
      );

      const invoiceId = invoiceResult.rows[0].id;

      if (Array.isArray(items)) {
        for (const item of items) {
          await client.query(
            `
            INSERT INTO invoice_items
            (
              invoice_id,
              item_name,
              quantity,
              price
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
              invoiceId,
              item.name || "",
              item.quantity || 0,
              item.price || 0,
            ]
          );
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Invoice saved successfully",
        invoiceId,
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Save invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save invoice",
      error: error.message,
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("================================");
    console.log("Fetching invoices for user:", userId);

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        invoice_number,
        vendor,
        invoice_date,
        tax,
        total,
        created_at
      FROM invoices
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    console.log("SQL query completed");
    console.log("Number of invoices:", result.rows.length);
    console.log("Invoices fetched:", result.rows);

    return res.status(200).json({
      success: true,
      invoices: result.rows,
    });

  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};
const getInvoiceById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;

    // Get invoice
    const invoiceResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        invoice_number,
        vendor,
        invoice_date,
        tax,
        total,
        created_at
      FROM invoices
      WHERE id = $1
      AND user_id = $2
      `,
      [invoiceId, userId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const invoice = invoiceResult.rows[0];

    // Get invoice items
    const itemsResult = await pool.query(
      `
      SELECT
        id,
        item_name,
        quantity,
        price
      FROM invoice_items
      WHERE invoice_id = $1
      ORDER BY id ASC
      `,
      [invoiceId]
    );

    // Add items to invoice object
    invoice.items = itemsResult.rows.map((item) => ({
      id: item.id,
      name: item.item_name,
      quantity: item.quantity,
      price: item.price,
      amount: Number(item.quantity || 0) * Number(item.price || 0),
    }));

    console.log("Invoice:", invoice);
    console.log("Invoice Items:", invoice.items);

    res.status(200).json({
      success: true,
      invoice,
    });

  } catch (error) {
    console.error("Get invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

const invoiceChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message",
      });
    }

    console.log("AI Chat User:", userId);
    console.log("AI Chat Message:", message);

    // Get this user's invoices
    const invoiceResult = await pool.query(
      `
      SELECT
        id,
        invoice_number,
        vendor,
        invoice_date,
        tax,
        total,
        created_at
      FROM invoices
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

  const invoices = invoiceResult.rows;

if (invoices.length === 0) {
  return res.status(200).json({
    success: true,
    reply: "You don't have any saved invoices yet.",
  });
}

// Get all invoice items with ONE database query
const invoiceIds = invoices.map((invoice) => invoice.id);

const itemsResult = await pool.query(
  `
  SELECT
    id,
    invoice_id,
    item_name,
    quantity,
    price
  FROM invoice_items
  WHERE invoice_id = ANY($1)
  ORDER BY id ASC
  `,
  [invoiceIds]
);

// Group items by invoice ID
const itemsByInvoice = {};

for (const item of itemsResult.rows) {
  if (!itemsByInvoice[item.invoice_id]) {
    itemsByInvoice[item.invoice_id] = [];
  }

  itemsByInvoice[item.invoice_id].push({
    id: item.id,
    name: item.item_name,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    amount:
      Number(item.quantity || 0) *
      Number(item.price || 0),
  });
}

// Attach items to each invoice
for (const invoice of invoices) {
  invoice.items =
    itemsByInvoice[invoice.id] || [];
}

console.log(
  "Invoices sent to AI:",
  JSON.stringify(invoices, null, 2)
);

// Send invoice information to Gemini
const reply = await generateInvoiceChatResponse(
  message,
  invoices
);

return res.status(200).json({
  success: true,
  reply,
});

  } catch (error) {
    console.error("Invoice chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process AI chat",
      error: error.message,
    });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;

    const result = await pool.query(
      `
      DELETE FROM invoices
      WHERE id = $1
      AND user_id = $2
      RETURNING id
      `,
      [invoiceId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete invoice error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
    });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const userId = req.user.userId;
    const invoiceId = req.params.id;

    const {
      invoice_number,
      vendor,
      invoice_date,
      tax,
      total,
      items,
    } = req.body;

    console.log("Updating invoice:", invoiceId);
    console.log("User:", userId);
    console.log("Updated data:", req.body);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // ---------------------------------------
      // Update invoice main details
      // ---------------------------------------

      const invoiceResult = await client.query(
        `
        UPDATE invoices
        SET
          invoice_number = $1,
          vendor = $2,
          invoice_date = $3,
          tax = $4,
          total = $5
        WHERE id = $6
        AND user_id = $7
        RETURNING id
        `,
        [
          invoice_number,
          vendor,
          invoice_date || null,
          tax || 0,
          total || 0,
          invoiceId,
          userId,
        ]
      );

      if (invoiceResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // ---------------------------------------
      // Delete existing invoice items
      // ---------------------------------------

      await client.query(
        `
        DELETE FROM invoice_items
        WHERE invoice_id = $1
        `,
        [invoiceId]
      );

      // ---------------------------------------
      // Insert updated invoice items
      // ---------------------------------------

      if (Array.isArray(items)) {
        for (const item of items) {
          await client.query(
            `
            INSERT INTO invoice_items
            (
              invoice_id,
              item_name,
              quantity,
              price
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
              invoiceId,
              item.name || "",
              item.quantity || 0,
              item.price || 0,
            ]
          );
        }
      }

      await client.query("COMMIT");

      console.log("Invoice updated successfully:", invoiceId);

      return res.status(200).json({
        success: true,
        message: "Invoice updated successfully",
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Update invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

module.exports = {
  uploadInvoice,
  saveInvoice,
  getInvoices,
  getInvoiceById,
  invoiceChat,
  deleteInvoice,
  updateInvoice,
};