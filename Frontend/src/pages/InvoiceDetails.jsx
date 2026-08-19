import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
const [saving, setSaving] = useState(false);

const [editData, setEditData] = useState({
  invoice_number: "",
  vendor: "",
  invoice_date: "",
  tax: "",
  total: "",
  items: [],
});

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/invoices/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        console.log("Invoice Details Response:", data);

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }

          throw new Error(
            data.message || "Failed to fetch invoice"
          );
        }

        setInvoice(data.invoice);

      } catch (error) {
        console.error("Fetch invoice error:", error);
        setError(
          error.message || "Unable to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  const handleEditChange = (e) => {
  const { name, value } = e.target;

  setEditData((previous) => ({
    ...previous,
    [name]: value,
  }));
};

const handleItemChange = (index, field, value) => {
  setEditData((previous) => {
    const updatedItems = [...previous.items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    if (field === "quantity" || field === "price") {
      const quantity = Number(
        field === "quantity"
          ? value
          : updatedItems[index].quantity
      );

      const price = Number(
        field === "price"
          ? value
          : updatedItems[index].price
      );

      updatedItems[index].amount = quantity * price;
    }

    return {
      ...previous,
      items: updatedItems,
    };
  });
};

const addItem = () => {
  setEditData((previous) => ({
    ...previous,
    items: [
      ...previous.items,
      {
        name: "",
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ],
  }));
};

const removeItem = (index) => {
  setEditData((previous) => ({
    ...previous,
    items: previous.items.filter(
      (_, itemIndex) => itemIndex !== index
    ),
  }));
};

const startEditing = () => {
  setEditData({
    invoice_number: invoice.invoice_number || "",
    vendor: invoice.vendor || "",
    invoice_date: invoice.invoice_date
      ? invoice.invoice_date.substring(0, 10)
      : "",
    tax: invoice.tax ?? "",
    total: invoice.total ?? "",
    items: Array.isArray(invoice.items)
      ? invoice.items.map((item) => ({
          name:
            item.name ||
            item.description ||
            item.item ||
            item.itemName ||
            item.item_name ||
            "",
          quantity:
            item.quantity ??
            item.qty ??
            0,
          price:
            item.price ??
            item.unitPrice ??
            item.unit_price ??
            0,
          amount: item.amount ?? "",
        }))
      : [],
  });

  setIsEditing(true);
};

const handleSaveChanges = async () => {
  try {
    setSaving(true);

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/invoices/${invoice.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_number: editData.invoice_number,
          vendor: editData.vendor,
          invoice_date: editData.invoice_date,
          tax: Number(editData.tax || 0),
          total: Number(editData.total || 0),
          items: editData.items.map((item) => ({
            name: item.name,
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            amount: Number(
              item.amount ||
                Number(item.quantity || 0) *
                  Number(item.price || 0)
            ),
          })),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update invoice"
      );
    }

    setInvoice(data.invoice);

    setIsEditing(false);

    alert("Invoice updated successfully!");

  } catch (error) {
    console.error("Update invoice error:", error);

    alert(
      error.message ||
        "Failed to update invoice"
    );
  } finally {
    setSaving(false);
  }
};

  // If invoice is not available
  if (loading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

        <p className="mt-4 text-sm text-slate-500">
          Loading invoice...
        </p>
      </div>
    </div>
  );
}

if (error || !invoice) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
          ⚠️
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-800">
          Invoice not found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error || "The invoice details could not be loaded."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}

  // Format currency
  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Invoice items

let items = [];

if (Array.isArray(invoice.items)) {
  items = invoice.items;
} else if (typeof invoice.items === "string") {
  try {
    items = JSON.parse(invoice.items);
  } catch (error) {
    console.error("Failed to parse invoice items:", error);
    items = [];
  }
}

console.log("Invoice received:", invoice);
console.log("Invoice items:", items);

  // --------------------------------------------------
  // DOWNLOAD PDF
  // --------------------------------------------------

 const handleDownloadPDF = () => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 20;

    // --------------------------------
    // Title
    // --------------------------------

    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("INVOICE", 20, y);

    y += 8;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("AI Invoice Reader", 20, y);

    // Invoice number
    pdf.setFontSize(10);
    pdf.text("Invoice Number", pageWidth - 75, 20);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.text(
      String(invoice.invoice_number || invoice.invoiceNumber || "-"),
      pageWidth - 75,
      28
    );

    y += 15;

    // --------------------------------
    // Line
    // --------------------------------

    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, y, pageWidth - 20, y);

    y += 15;

    // --------------------------------
    // Vendor
    // --------------------------------

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text("VENDOR", 20, y);

    y += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.text(
      String(invoice.vendor || "-"),
      20,
      y
    );

    // --------------------------------
    // Date
    // --------------------------------

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text("INVOICE DATE", pageWidth / 2 + 10, y - 7);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.text(
      formatDate(invoice.date || invoice.invoice_date),
      pageWidth / 2 + 10,
      y
    );

    y += 20;

    // --------------------------------
    // Items Heading
    // --------------------------------

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);

    pdf.text("Invoice Items", 20, y);

    y += 10;

    // --------------------------------
    // Table Header
    // --------------------------------

    pdf.setFillColor(245, 247, 250);
    pdf.rect(20, y - 6, pageWidth - 40, 10, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");

    pdf.text("Item", 24, y);
    pdf.text("Quantity", 105, y);
    pdf.text("Price", 135, y);
    pdf.text("Amount", 170, y);

    y += 10;

    // --------------------------------
    // Items
    // --------------------------------

    if (items.length > 0) {

      items.forEach((item) => {

        const quantity = Number(
          item.quantity ??
          item.qty ??
          0
        );

        const price = Number(
          item.price ??
          item.unitPrice ??
          item.unit_price ??
          0
        );

        const amount =
          item.amount !== undefined &&
          item.amount !== null &&
          item.amount !== ""
            ? Number(item.amount)
            : quantity * price;

        const itemName =
          item.name ||
          item.description ||
          item.item ||
          item.itemName ||
          "-";

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        pdf.text(
          String(itemName).substring(0, 40),
          24,
          y
        );

        pdf.text(
          String(quantity),
          108,
          y
        );

        pdf.text(
          formatCurrency(price),
          135,
          y
        );

        pdf.text(
          formatCurrency(amount),
          170,
          y
        );

        y += 8;

        // New page if required
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = 20;
        }
      });

    } else {

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      pdf.text(
        "No invoice items available.",
        24,
        y
      );

      y += 10;
    }

    // --------------------------------
    // Totals
    // --------------------------------

    y += 10;

    pdf.line(
      pageWidth - 90,
      y,
      pageWidth - 20,
      y
    );

    y += 10;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      "Tax",
      pageWidth - 90,
      y
    );

    pdf.text(
      formatCurrency(invoice.tax),
      pageWidth - 20,
      y,
      { align: "right" }
    );

    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);

    pdf.text(
      "Total",
      pageWidth - 90,
      y
    );

    pdf.text(
      formatCurrency(invoice.total),
      pageWidth - 20,
      y,
      { align: "right" }
    );

    // --------------------------------
    // Footer
    // --------------------------------

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(
      "Generated by AI Invoice Reader",
      20,
      pageHeight - 15
    );

    // --------------------------------
    // Download
    // --------------------------------

    const invoiceNumber =
      invoice.invoice_number ||
      invoice.invoiceNumber ||
      "invoice";

    pdf.save(`${invoiceNumber}.pdf`);

  } catch (error) {

    console.error(
      "PDF download error:",
      error
    );

    alert(
      "Failed to generate PDF. Please try again."
    );
  }
};
  // --------------------------------------------------
  // DELETE INVOICE
  // --------------------------------------------------

  const handleDeleteInvoice = async () => {
    try {
      setDeleting(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/invoices/${invoice.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete invoice"
        );
      }

      // Close modal
      setShowDeleteModal(false);

      // Go back to dashboard
      navigate("/invoices");

    } catch (error) {
      console.error("Delete invoice error:", error);

      alert(error.message || "Failed to delete invoice");

    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =========================================
          HEADER
      ========================================== */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Invoice Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View complete invoice information
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back
          </button>

        </div>

      </header>


      {/* =========================================
          MAIN
      ========================================== */}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

        {/* =========================================
            INVOICE PDF AREA
        ========================================== */}

        <div
          id="invoice-pdf"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >

          {/* =========================================
              INVOICE HEADER
          ========================================== */}

          <div className="border-b border-slate-200 p-6 sm:p-8">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">

              {/* Left */}
              <div>

                <h2 className="text-3xl font-bold tracking-wide text-slate-900">
                  INVOICE
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  AI Invoice Reader
                </p>

              </div>

              {/* Right */}
              <div className="sm:text-right">

                <p className="text-sm text-slate-500">
                  Invoice Number
                </p>

                <p className="mt-1 text-lg font-bold text-slate-800">
                  {invoice.invoice_number || "-"}
                </p>

              </div>

            </div>

          </div>


          {/* =========================================
              BASIC INFORMATION
          ========================================== */}

          <div className="grid grid-cols-1 gap-6 border-b border-slate-200 p-6 sm:grid-cols-2 sm:p-8">

            {/* Vendor */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Vendor
              </p>

              <p className="mt-2 text-base font-semibold text-slate-800">
                {invoice.vendor || "-"}
              </p>

            </div>


            {/* Date */}

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Invoice Date
              </p>

              <p className="mt-2 text-base font-semibold text-slate-800">
                {formatDate(invoice.date || invoice.invoice_date)}
              </p>

            </div>

          </div>


          {/* =========================================
              ITEMS
          ========================================== */}

          <div className="p-6 sm:p-8">

            <h3 className="mb-4 text-lg font-bold text-slate-800">
              Invoice Items
            </h3>

            {items.length > 0 ? (

              <div className="overflow-x-auto rounded-xl border border-slate-200">

                <table className="w-full min-w-[650px] text-left">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Item
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Quantity
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Price
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Amount
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-slate-200">

  {items.map((item, index) => {

  const quantity = Number(
    item.quantity ??
    item.qty ??
    0
  );

  const price = Number(
    item.price ??
    item.unitPrice ??
    item.unit_price ??
    0
  );

  const amount =
    item.amount !== undefined &&
    item.amount !== null &&
    item.amount !== ""
      ? Number(item.amount)
      : quantity * price;

  const itemName =
    item.name ||
    item.description ||
    item.item ||
    item.itemName ||
    item.item_name ||
    item.productName ||
    item.product_name ||
    "-";

  return (

                        <tr
                          key={item.id || index}
                          className="hover:bg-slate-50"
                        >

                        <td className="px-5 py-4 text-sm font-medium text-slate-800">
  {item.name ||
    item.description ||
    item.item ||
    item.itemName ||
    item.item_name ||
    item.productName ||
    item.product_name ||
    "-"}
</td>

                          <td className="px-5 py-4 text-right text-sm text-slate-600">
                            {quantity}
                          </td>

                          <td className="px-5 py-4 text-right text-sm text-slate-600">
                            {formatCurrency(price)}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatCurrency(amount)}
                          </td>

                        </tr>

                      );
                    })}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">

                <p className="text-sm text-slate-500">
                  No invoice items available.
                </p>

              </div>

            )}

          </div>


          {/* =========================================
              TOTALS
          ========================================== */}

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8">

            <div className="ml-auto w-full max-w-sm space-y-4">

              {/* Tax */}

              <div className="flex items-center justify-between">

                <span className="text-sm text-slate-500">
                  Tax
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {formatCurrency(invoice.tax)}
                </span>

              </div>


              {/* Total */}

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">

                <span className="text-lg font-bold text-slate-800">
                  Total
                </span>

                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(invoice.total)}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* =========================================
            ACTION BUTTONS
        ========================================== */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

          {/* Back */}

          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Invoices
          </button>

          {/* Edit */}
<button
  type="button"
  onClick={() => navigate(`/invoice/${invoice.id}/edit`)}
  className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
>
  Edit Invoice
</button>


          {/* Delete */}

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Delete Invoice
          </button>


          {/* Download */}

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Download PDF
          </button>

        </div>

      </main>


      {/* =========================================
          DELETE CONFIRMATION MODAL
      ========================================== */}

      {showDeleteModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            {/* Warning icon */}

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
              ⚠️
            </div>


            {/* Title */}

            <h2 className="mt-4 text-xl font-bold text-slate-800">
              Delete Invoice?
            </h2>


            {/* Description */}

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete this invoice?
              This action cannot be undone.
            </p>


            {/* Buttons */}

            <div className="mt-6 flex justify-end gap-3">

              {/* Cancel */}

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>


              {/* Confirm Delete */}

              <button
                type="button"
                onClick={handleDeleteInvoice}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default InvoiceDetails;