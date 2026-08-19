import React, { useState } from "react";

const InvoiceReview = ({ invoiceData, onSave, onCancel }) => {
  const [invoice, setInvoice] = useState({
    invoiceNumber: invoiceData?.invoiceNumber || "",
    vendor: invoiceData?.vendor || "",
    date: invoiceData?.date || "",
    items: invoiceData?.items || [],
    tax: invoiceData?.tax ?? "",
    total: invoiceData?.total ?? "",
  });

  const [saving, setSaving] = useState(false);

  // ==============================
  // Update normal invoice fields
  // ==============================
  const updateField = (field, value) => {
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==============================
  // Update invoice item
  // ==============================
 const updateItem = (index, field, value) => {
  setInvoice((prev) => {
    const updatedItems = [...prev.items];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    const quantity = Number(updatedItems[index].quantity) || 0;
    const price = Number(updatedItems[index].price) || 0;

    updatedItems[index].amount = quantity * price;

    const subtotal = updatedItems.reduce((sum, item) => {
      const itemQuantity = Number(item.quantity) || 0;
      const itemPrice = Number(item.price) || 0;

      return sum + itemQuantity * itemPrice;
    }, 0);

    const tax = Number(prev.tax) || 0;

    return {
      ...prev,
      items: updatedItems,
      total: subtotal + tax,
    };
  });
};

// update Tax
const updateTax = (value) => {
  setInvoice((prev) => {
    const tax = Number(value) || 0;

    const subtotal = prev.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;

      return sum + quantity * price;
    }, 0);

    return {
      ...prev,
      tax,
      total: subtotal + tax,
    };
  });
};
  // ==============================
  // Add new item
  // ==============================
const addItem = () => {
  setInvoice((prev) => ({
    ...prev,
    items: [
      ...prev.items,
      {
        name: "",
        quantity: 1,
        price: 0,
        amount: 0,
      },
    ],
  }));
};
  // ==============================
  // Remove item
  // ==============================
  const removeItem = (index) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ==============================
  // Cancel
  // ==============================
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // ==============================
  // Save Invoice
  // ==============================
  const handleSave = async () => {
    try {
      // Validation
      if (!invoice.invoiceNumber.trim()) {
        alert("Please enter invoice number");
        return;
      }

      if (!invoice.vendor.trim()) {
        alert("Please enter vendor name");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      setSaving(true);

      console.log("Saving invoice:", invoice);

      const response = await fetch(
        "http://localhost:5000/api/invoices/save",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            vendor: invoice.vendor,
            date: invoice.date,
            items: invoice.items,
            tax: invoice.tax,
            total: invoice.total,
          }),
        }
      );

     const contentType = response.headers.get("content-type");

let data;

if (contentType && contentType.includes("application/json")) {
  data = await response.json();
} else {
  const text = await response.text();
  console.error("Backend returned:", text);

  throw new Error(
    `Server error (${response.status}). Check backend terminal.`
  );
}

console.log("Save invoice response:", data);

if (!response.ok) {
  throw new Error(
    data.message || "Failed to save invoice"
  );
}

      alert("Invoice saved successfully!");

      // Notify parent component
      if (onSave) {
        onSave(data);
      }

    } catch (error) {
      console.error("Save invoice error:", error);

      alert(
        error.message ||
          "Something went wrong while saving the invoice."
      );

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ================= HEADER ================= */}
        
        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-sm">
              🤖
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Review Invoice
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review and correct the AI-extracted information before saving.
              </p>
            </div>

          </div>

        </div>

        {/* ================= MAIN CARD ================= */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">

          {/* ================= INVOICE INFORMATION ================= */}
          <div>

            <h2 className="mb-5 text-lg font-semibold text-slate-800">
              Invoice Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Invoice Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Invoice Number
                </label>

                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) =>
                    updateField(
                      "invoiceNumber",
                      e.target.value
                    )
                  }
                  placeholder="Enter invoice number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Vendor
                </label>

                <input
                  type="text"
                  value={invoice.vendor}
                  onChange={(e) =>
                    updateField(
                      "vendor",
                      e.target.value
                    )
                  }
                  placeholder="Enter vendor name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="text"
                  value={invoice.date}
                  onChange={(e) =>
                    updateField(
                      "date",
                      e.target.value
                    )
                  }
                  placeholder="Enter invoice date"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

          </div>

          {/* Divider */}
          <div className="my-8 border-t border-slate-200" />

          {/* ================= ITEMS ================= */}
          <div>

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-semibold text-slate-800">
                Invoice Items
              </h2>

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Item
              </button>

            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">

              <table className="w-full">

                <thead>
                  <tr className="bg-slate-50">

                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Item
                    </th>

                    <th className="w-40 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Quantity
                    </th>

                    <th className="w-48 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Price
                    </th>

                    <th className="w-40 px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      Amount
                    </th>

                    <th className="w-24 px-4 py-3 text-center text-sm font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {invoice.items.length > 0 ? (

                    invoice.items.map((item, index) => (

                      <tr
                        key={index}
                        className="border-t border-slate-200"
                      >

                        {/* Item */}
                        <td className="px-4 py-3">

                          <input
                            type="text"
                            value={item.name || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />

                        </td>

                        {/* Quantity */}
                        <td className="px-4 py-3">

                          <input
                            type="number"
                            min="0"
                            value={item.quantity ?? ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />

                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">

                          <input
                            type="number"
                            min="0"
                            value={item.price ?? ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "price",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />

                        </td>

                        <td className="px-4 py-3">
  <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
    ₹{(
      (Number(item.quantity) || 0) *
      (Number(item.price) || 0)
    ).toFixed(2)}
  </div>
</td>

                        {/* Remove */}
                        <td className="px-4 py-3 text-center">

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(index)
                            }
                            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-sm text-slate-500"
                      >
                        No items found. Click "Add Item" to add one.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            {/* Mobile Items */}
            <div className="space-y-4 md:hidden">

              {invoice.items.map((item, index) => (

                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm font-semibold text-slate-700">
                      Item {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(index)
                      }
                      className="text-sm font-medium text-red-600"
                    >
                      Remove
                    </button>

                  </div>

                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Item name"
                    className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />

                  <div className="grid grid-cols-2 gap-3">

                    <input
                      type="number"
                      value={item.quantity ?? ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Quantity"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                    <input
                      type="number"
                      value={item.price ?? ""}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "price",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Price"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* Divider */}
          <div className="my-8 border-t border-slate-200" />

          {/* ================= SUMMARY ================= */}
          <div className="flex justify-end">

            <div className="w-full max-w-md space-y-4">

              {/* Tax */}
              <div className="flex items-center justify-between gap-6">

                <label className="text-sm font-medium text-slate-600">
                  Tax
                </label>

                <input
                  type="number"
                  value={invoice.tax}
                  onChange={(e) => updateTax(e.target.value)}
                  className="w-48 rounded-xl border border-slate-300 px-4 py-3 text-right text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Total */}
              <div className="rounded-xl bg-blue-50 p-4">

                <div className="flex items-center justify-between gap-6">

                  <span className="font-semibold text-blue-800">
                    Total
                  </span>

                  <input
                    type="number"
                    value={invoice.total}
                    onChange={(e) =>
                      updateField(
                        "total",
                        Number(e.target.value)
                      )
                    }
                    className="w-48 rounded-lg border border-blue-200 bg-white px-4 py-3 text-right text-lg font-bold text-blue-700 outline-none focus:border-blue-500"
                  />

                </div>

              </div>

            </div>

          </div>

          {/* ================= ACTION BUTTONS ================= */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            {/* Cancel */}
            <button
  type="button"
  onClick={onCancel}
  className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
>
  Cancel
</button>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Invoice"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default InvoiceReview;