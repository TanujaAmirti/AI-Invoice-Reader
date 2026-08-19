import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceReview from "./InvoiceReview";

function UploadInvoice() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only PDF, JPG, JPEG and PNG files are allowed");
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10 MB");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an invoice first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const formData = new FormData();

      formData.append("invoice", file);

      const response = await fetch(
        "https://ai-invoice-reader.netlify.appapi/invoices/upload",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      

      if (!response.ok) {
        setError(data.message || "Upload failed");
        return;
      }

      console.log("Upload response:", data);

      setSuccess("Invoice uploaded and processed successfully!");
      setExtractedText(data.extractedText || "");
      setInvoiceData(data.invoiceData);

    } catch (error) {
      console.error("Upload error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">

          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            ←
          </button>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Upload Invoice
            </h1>

            <p className="text-slate-500 mt-1">
              Upload an invoice to begin AI extraction.
            </p>
          </div>

        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          {/* Upload Area */}
          <label
            htmlFor="invoice"
            className="
              min-h-[300px]
              border-2
              border-dashed
              border-slate-300
              rounded-2xl
              flex
              flex-col
              items-center
              justify-center
              cursor-pointer
              hover:border-blue-500
              hover:bg-blue-50/30
              transition
            "
          >

            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-5">
              <span className="text-3xl">📄</span>
            </div>

            <h2 className="text-xl font-semibold text-slate-800">
              Upload your invoice
            </h2>

            <p className="text-slate-500 mt-2">
              Click to browse your files
            </p>

            <p className="text-sm text-slate-400 mt-2">
              PDF, JPG, JPEG or PNG • Maximum 10 MB
            </p>

            <input
              id="invoice"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
            />

          </label>

          {/* Error */}
          {error && (
            <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Selected File */}
          {file && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    📄
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {file.name}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                </div>

                <button
                  onClick={handleRemoveFile}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>

              </div>

            </div>
          )}

          {extractedText && (
  <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Extracted Invoice Text
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Text extracted from your invoice using OCR
        </p>
      </div>
    </div>

    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">

      <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-6">
        {extractedText}
      </pre>

    </div>

  </div>
)}

{invoiceData && (
  <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

    <div className="flex items-center gap-3 mb-6">

      <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
        🤖
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800">
          AI Extracted Invoice
        </h2>

        <p className="text-sm text-slate-500">
          Information automatically extracted from your invoice
        </p>
      </div>

    </div>

    {invoiceData && (
  <InvoiceReview
    invoiceData={invoiceData}
    onCancel={() => {
    setInvoiceData(null);
  }}
    onSave={(data) => {
    console.log("Invoice saved:", data);
    setInvoiceData(null);
    }}
  />
)}

    {/* Invoice Information */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Invoice Number
        </p>

        <p className="font-semibold text-slate-800 mt-1">
          {invoiceData.invoiceNumber || "Not found"}
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Vendor
        </p>

        <p className="font-semibold text-slate-800 mt-1">
          {invoiceData.vendor || "Not found"}
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4">
        <p className="text-sm text-slate-500">
          Date
        </p>

        <p className="font-semibold text-slate-800 mt-1">
          {invoiceData.date || "Not found"}
        </p>
      </div>

    </div>

    {/* Items */}
    <div className="mt-8">

      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Items
      </h3>

      <div className="overflow-x-auto">

        <table className="w-full border-collapse">

          <thead>
            <tr className="bg-slate-50 text-left">

              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                Item
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                Quantity
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-slate-600">
                Price
              </th>

            </tr>
          </thead>

          <tbody>

            {invoiceData.items?.map((item, index) => (
              <tr
                key={index}
                className="border-t border-slate-200"
              >

                <td className="px-4 py-3 text-slate-700">
                  {item.name || "—"}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {item.quantity ?? "—"}
                </td>

                <td className="px-4 py-3 text-slate-700">
                  {item.price ?? "—"}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

    {/* Tax and Total */}
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="bg-slate-50 rounded-xl p-5">
        <p className="text-sm text-slate-500">
          Tax
        </p>

        <p className="text-xl font-bold text-slate-800 mt-1">
          {invoiceData.tax ?? "—"}
        </p>
      </div>

      <div className="bg-blue-50 rounded-xl p-5">
        <p className="text-sm text-blue-600">
          Total
        </p>

        <p className="text-2xl font-bold text-blue-700 mt-1">
          {invoiceData.total ?? "—"}
        </p>
      </div>

    </div>

  </div>
)}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="
              w-full
              mt-6
              py-3.5
              rounded-xl
              bg-blue-600
              text-white
              font-semibold
              hover:bg-blue-700
              disabled:bg-slate-300
              disabled:cursor-not-allowed
              transition
            "
          >
            {loading ? "Uploading..." : "Upload Invoice"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default UploadInvoice;