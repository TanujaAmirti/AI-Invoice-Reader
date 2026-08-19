const express = require("express");

const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const {
  uploadInvoice,
  saveInvoice,
  getInvoices,
  getInvoiceById,
  invoiceChat,
  deleteInvoice,
  updateInvoice,
} = require("../controllers/invoiceController");

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("invoice"),
  uploadInvoice
);

router.post(
  "/save",
  authMiddleware,
  saveInvoice
);

router.post(
  "/chat",
  authMiddleware,
  invoiceChat
);

router.get(
  "/",
  authMiddleware,
  getInvoices
);

router.get(
  "/:id",
  authMiddleware,
  getInvoiceById
);

router.put(
  "/:id",
  authMiddleware,
  updateInvoice
);

router.delete(
  "/:id",
  authMiddleware,
  deleteInvoice
);

module.exports = router;