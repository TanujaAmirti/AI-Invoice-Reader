import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../services/api";

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ================================
  // FETCH INVOICE
  // ================================
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
          `${API_URL}/api/invoices/${id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        console.log("Edit Invoice Response:", data);

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load invoice"
          );
        }

        let invoiceData = data.invoice;

        // Parse items if backend returns JSON string
        if (typeof invoiceData.items === "string") {
          try {
            invoiceData.items = JSON.parse(invoiceData.items);
          } catch (error) {
            console.error("Failed to parse items:", error);
            invoiceData.items = [];
          }
        }

        // Make sure items is always an array
        if (!Array.isArray(invoiceData.items)) {
          invoiceData.items = [];
        }

        setInvoice(invoiceData);

      } catch (err) {
        console.error("Fetch edit invoice error:", err);

        setError(
          err.message || "Unable to load invoice"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, navigate]);

  // ================================
  // BASIC FIELD CHANGE
  // ================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setInvoice((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ================================
  // ITEM CHANGE
  // ================================
  const handleItemChange = (index, field, value) => {
    setInvoice((previous) => {
      const updatedItems = [...previous.items];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return {
        ...previous,
        items: updatedItems,
      };
    });
  };

  // ================================
  // ADD ITEM
  // ================================
  const handleAddItem = () => {
    setInvoice((previous) => ({
      ...previous,
      items: [
        ...(previous.items || []),
        {
          name: "",
          quantity: 1,
          price: 0,
          amount: 0,
        },
      ],
    }));
  };

  // ================================
  // REMOVE ITEM
  // ================================
  const handleRemoveItem = (index) => {
    setInvoice((previous) => ({
      ...previous,
      items: previous.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  // ================================
  // CALCULATE SUBTOTAL
  // ================================
  const calculateSubtotal = () => {
    if (!invoice || !Array.isArray(invoice.items)) {
      return 0;
    }

    return invoice.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(
        item.price ??
        item.unitPrice ??
        item.unit_price ??
        0
      );

      return sum + quantity * price;
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const tax = Number(invoice?.tax || 0);

  const calculatedTotal = subtotal + tax;

  // ================================
  // SAVE INVOICE
  // ================================
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const updatedItems = (invoice.items || []).map((item) => {
        const quantity = Number(item.quantity || 0);

        const price = Number(
          item.price ??
          item.unitPrice ??
          item.unit_price ??
          0
        );

        return {
          name:
            item.name ||
            item.description ||
            item.item ||
            item.itemName ||
            item.item_name ||
            "",

          quantity,

          price,

          amount: quantity * price,
        };
      });

      const finalTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      ) + Number(invoice.tax || 0);

      const payload = {
        invoice_number: invoice.invoice_number || "",
        vendor: invoice.vendor || "",
        invoice_date: invoice.invoice_date
          ? String(invoice.invoice_date).split("T")[0]
          : "",
        tax: Number(invoice.tax || 0),
        total: finalTotal,
        items: updatedItems,
      };

      console.log("Updating invoice:", payload);

      const response = await fetch(
        `${API_URL}/api/invoices/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log("Update response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update invoice"
        );
      }

      alert("Invoice updated successfully!");

      navigate(`/invoice/${id}`);

    } catch (err) {
      console.error("Update invoice error:", err);

      setError(
        err.message || "Failed to update invoice"
      );
    } finally {
      setSaving(false);
    }
  };

  // ================================
  // LOADING
  // ================================
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

  // ================================
  // ERROR / NOT FOUND
  // ================================
  if (error && !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            ⚠️
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-800">
            Unable to load invoice
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate(`/invoice/${id}`)}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Invoice
          </button>

        </div>

      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // ================================
  // UI
  // ================================
  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>

            <h1 className="text-2xl font-bold text-slate-800">
              Edit Invoice
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Update invoice information
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate(`/invoice/${id}`)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          {/* BASIC INFORMATION */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Invoice Number */}
            <div>

              <label className="text-sm font-semibold text-slate-700">
                Invoice Number
              </label>

              <input
                name="invoice_number"
                value={invoice.invoice_number || ""}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Vendor */}
            <div>

              <label className="text-sm font-semibold text-slate-700">
                Vendor
              </label>

              <input
                name="vendor"
                value={invoice.vendor || ""}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Date */}
            <div>

              <label className="text-sm font-semibold text-slate-700">
                Invoice Date
              </label>

              <input
                type="date"
                name="invoice_date"
                value={
                  invoice.invoice_date
                    ? String(invoice.invoice_date).split("T")[0]
                    : ""
                }
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Tax */}
            <div>

              <label className="text-sm font-semibold text-slate-700">
                Tax
              </label>

              <input
                type="number"
                name="tax"
                value={invoice.tax ?? ""}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* ITEMS */}
          <div className="mt-8">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-lg font-bold text-slate-800">
                Invoice Items
              </h2>

              <button
                type="button"
                onClick={handleAddItem}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                + Add Item
              </button>

            </div>

            <div className="space-y-4">

              {(invoice.items || []).map((item, index) => (

                <div
                  key={index}
                  className="rounded-xl border border-slate-200 p-4"
                >

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

                    {/* Item Name */}
                    <input
                      value={
                        item.name ||
                        item.description ||
                        item.item ||
                        ""
                      }
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Item name"
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    />

                    {/* Quantity */}
                    <input
                      type="number"
                      value={item.quantity ?? ""}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      placeholder="Quantity"
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    />

                    {/* Price */}
                    <input
                      type="number"
                      value={
                        item.price ??
                        item.unitPrice ??
                        item.unit_price ??
                        ""
                      }
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "price",
                          e.target.value
                        )
                      }
                      placeholder="Price"
                      className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="rounded-lg bg-red-50 px-3 py-2 font-semibold text-red-600 hover:bg-red-100"
                    >
                      Remove
                    </button>

                  </div>

                  {/* Amount */}
                  <p className="mt-3 text-right text-sm font-semibold text-slate-600">
                    Amount: ₹
                    {(
                      Number(item.quantity || 0) *
                      Number(
                        item.price ??
                        item.unitPrice ??
                        item.unit_price ??
                        0
                      )
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                </div>

              ))}

            </div>

          </div>

          {/* TOTAL PREVIEW */}
          <div className="mt-8 rounded-xl bg-slate-50 p-5">

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Subtotal
              </span>

              <span className="font-semibold text-slate-800">
                ₹
                {subtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="mt-3 flex justify-between text-sm">
              <span className="text-slate-500">
                Tax
              </span>

              <span className="font-semibold text-slate-800">
                ₹
                {tax.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-200 pt-4">

              <span className="text-lg font-bold text-slate-800">
                Total
              </span>

              <span className="text-xl font-bold text-blue-600">
                ₹
                {calculatedTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>

            </div>

          </div>

          {/* SAVE */}
          <div className="mt-8 flex justify-end gap-3">

            <button
              type="button"
              onClick={() => navigate(`/invoice/${id}`)}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </div>

      </main>

    </div>
  );
};

export default EditInvoice;
