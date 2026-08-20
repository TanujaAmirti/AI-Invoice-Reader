import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../services/api";
import {
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  FileText,
  CalendarDays,
  AlertCircle,
  MessageCircle,
  Sparkles,
  X,
  Send,
  Bot,
  Mic,
  LogOut,
} from "lucide-react";

const InvoiceDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
};

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [isOpen, setIsOpen] = useState(false);

const [chatMessage, setChatMessage] = useState("");
const [chatMessages, setChatMessages] = useState([]);
const [chatLoading, setChatLoading] = useState(false);

const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
const [sortOrder, setSortOrder] = useState("newest");

// Load available browser voices
useEffect(() => {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    console.log("Available speech voices:", voices);
  };

  loadVoices();

  window.speechSynthesis.onvoiceschanged = loadVoices;

  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, []);
  // Fetch invoices
const fetchInvoices = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    console.log("Fetching invoices from frontend...");

    const response = await fetch(
      `${API_URL}/api/invoices`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Invoice API status:", response.status);

    const data = await response.json();

    console.log("Invoice API Response:", data);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      throw new Error(
        data.message || "Failed to fetch invoices"
      );
    }

    if (data.success && Array.isArray(data.invoices)) {
      console.log(
        "Setting invoices:",
        data.invoices
      );

      setInvoices(data.invoices);
    } else {
      console.warn(
        "Invoice data format is incorrect:",
        data
      );

      setInvoices([]);
    }

  } catch (err) {
    console.error(
      "Fetch invoices error:",
      err
    );

    setError(
      err.message ||
      "Unable to load invoices"
    );

    setInvoices([]);
  } finally {
    setLoading(false);
  }
};
  // Load invoices when page opens
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Delete invoice
  const handleDelete = async (invoiceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(invoiceId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/invoices/${invoiceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete invoice");
      }

      // Remove deleted invoice from screen
      setInvoices((previousInvoices) =>
        previousInvoices.filter(
          (invoice) => invoice.id !== invoiceId
        )
      );
    } catch (err) {
      console.error("Delete invoice error:", err);
      alert(err.message || "Failed to delete invoice");
    } finally {
      setDeletingId(null);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

    // Search and sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      const search = searchTerm.toLowerCase().trim();

      if (!search) return true;

      return (
        String(invoice.invoice_number || "")
          .toLowerCase()
          .includes(search) ||
        String(invoice.vendor || "")
          .toLowerCase()
          .includes(search)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.invoice_date).getTime();
      const dateB = new Date(b.created_at || b.invoice_date).getTime();

      if (sortOrder === "newest") {
        return dateB - dateA;
      }

      return dateA - dateB;
    });

    const handleVoiceInput = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert(
      "Voice input is not supported in this browser. Please use Google Chrome."
    );
    return;
  }

  if (isListening) {
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsListening(true);
  };

  recognition.onresult = (event) => {
    const transcript =
      event.results[0][0].transcript;

    setChatMessage(transcript);
  };

  recognition.onerror = (event) => {
    console.error(
      "Voice recognition error:",
      event.error
    );

    if (event.error === "not-allowed") {
      alert(
        "Microphone permission was denied. Please allow microphone access."
      );
    }
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  recognition.start();
};

const handleStopSpeaking = () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  setIsSpeaking(false);
};

const speakResponse = (text) => {
  if (!("speechSynthesis" in window)) {
    console.warn("Text-to-speech is not supported.");
    return;
  }

  // Stop previous speech
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/INVOICE_ID:\s*[\w-]+/gi, "")
    .trim();

  if (!cleanText) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  console.log("Available voices:", voices);

  // Try to find a female English voice
  const femaleVoice =
    voices.find((voice) =>
      /female|zira|samantha|susan|karen|hazel|aria|jenny/i.test(
        voice.name
      )
    ) ||
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );

  const speech = new SpeechSynthesisUtterance(cleanText);

  if (femaleVoice) {
    speech.voice = femaleVoice;
    console.log("Selected voice:", femaleVoice.name);
  }

  speech.lang = "en-IN";
  speech.rate = 0.95;
  speech.pitch = 1.1;
  speech.volume = 1;

  speech.onstart = () => {
    setIsSpeaking(true);
  };

  speech.onend = () => {
    setIsSpeaking(false);
  };

  speech.onerror = (error) => {
    console.error("Speech error:", error);
    setIsSpeaking(false);
  };

  window.speechSynthesis.speak(speech);
};

    const handleSendMessage = async () => {
  if (!chatMessage.trim() || chatLoading) {
    return;
  }

  const userMessage = chatMessage.trim();

  // Show user message immediately
  setChatMessages((previous) => [
    ...previous,
    {
      role: "user",
      text: userMessage,
    },
  ]);

  setChatMessage("");
  setChatLoading(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_URL}/api/invoices/chat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to get AI response"
      );
    }

    setChatMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        text: data.reply,
      },
    ]);
    speakResponse(data.reply);

  } catch (error) {
    console.error("AI chat error:", error);

    setChatMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        text:
          error.message ||
          "Sorry, I couldn't process your request.",
      },
    ]);
  } finally {
    setChatLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Invoice Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and review your processed invoices
            </p>
          </div>

          <div className="flex items-center gap-3">
  {/* Upload Invoice */}
  <button
    onClick={() => navigate("/upload-invoice")}
    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
  >
    <Upload size={19} />
    Upload Invoice
  </button>

  {/* Logout */}
  <button
    onClick={handleLogout}
    className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
  >
    <LogOut size={19} />
    Logout
  </button>
</div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Invoices
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {invoices.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <FileText
                  size={24}
                  className="text-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Latest Invoice
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {invoices.length > 0
                    ? invoices[0].invoice_number || "N/A"
                    : "No invoices"}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <CalendarDays
                  size={24}
                  className="text-green-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Status
                </p>

                <p className="mt-2 text-lg font-bold text-green-600">
                  Active
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <span className="block h-3 w-3 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

        </div>

                {/* Title + Search + Sort + Refresh */}
        <div className="mb-5">

          {/* Title */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Invoices
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View, search, sort, or delete your saved invoices.
              </p>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>

          </div>


          {/* Search + Sort */}
          <div className="mt-5 flex flex-col gap-3 md:flex-row">

            {/* Search */}
            <div className="relative flex-1">

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by invoice number or vendor..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* Sort */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>
            </select>

          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} />

            <div>
              <p className="font-semibold">
                Unable to load invoices
              </p>

              <p className="text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading invoices...
              </p>
            </div>
          </div>
        ) : invoices.length === 0 ? (


          /* Empty state */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <FileText
                size={30}
                className="text-blue-600"
              />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No invoices yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Upload your first invoice and let AI extract the
              invoice details automatically.
            </p>

            <button
              onClick={() => navigate("/upload-invoice")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <Upload size={18} />
              Upload Your First Invoice
            </button>
          </div>

                ) : filteredInvoices.length === 0 ? (

          /* No Search Results */
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <FileText
                size={30}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No matching invoices
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              No invoices match your search.
              Try a different invoice number or vendor name.
            </p>

            <button
              onClick={() => setSearchTerm("")}
              className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Clear Search
            </button>

          </div>

        ) : (

          /* Invoice table */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Invoice
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Vendor
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
  {filteredInvoices.map((invoice) => (
    <tr
      key={invoice.id}
      className="transition hover:bg-slate-50"
    >
      {/* Invoice Number */}
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <FileText
              size={18}
              className="text-blue-600"
            />
          </div>

          <div>
            <p className="font-semibold text-slate-900">
              {invoice.invoice_number || "N/A"}
            </p>

            <p className="text-xs text-slate-400">
              ID: {invoice.id}
            </p>
          </div>
        </div>
      </td>

      {/* Vendor */}
      <td className="px-6 py-5">
        <span className="font-medium text-slate-700">
          {invoice.vendor || "N/A"}
        </span>
      </td>

      {/* Date */}
      <td className="px-6 py-5">
        <span className="text-slate-600">
          {formatDate(invoice.invoice_date)}
        </span>
      </td>

      {/* Total */}
      <td className="px-6 py-5">
        <span className="font-bold text-slate-900">
          ₹{Number(invoice.total || 0).toLocaleString("en-IN")}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">

          {/* View */}
          <button
            onClick={() =>
              navigate(`/invoice/${invoice.id}`)
            }
            title="View invoice"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Eye size={18} />
          </button>

          {/* Delete */}
          <button
            onClick={() =>
              handleDelete(invoice.id)
            }
            disabled={deletingId === invoice.id}
            title="Delete invoice"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingId === invoice.id ? (
              <RefreshCw
                size={18}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={18} />
            )}
          </button>

        </div>
      </td>
    </tr>
  ))}
</tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ================================
          AI CHATBOT FLOATING BUTTON
      ================================= */}

 <button
  type="button"
  onClick={() => setIsOpen((previous) => !previous)}
  className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
  title="AI Invoice Assistant"
>
  {isOpen ? (
    <X size={24} />
  ) : (
    <Sparkles size={25} />
  )}
</button>


      {/* ================================
          AI CHAT WINDOW
      ================================= */}

      {isOpen && (
  <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

    {/* Chat Header */}

    <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">

      <div className="flex items-center gap-2">

        <Bot size={20} />

        <div>
          <h3 className="text-sm font-bold">
            AI Invoice Assistant
          </h3>

          <p className="text-xs text-blue-100">
            Ask about your invoices
          </p>
        </div>

      </div>

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="rounded-lg p-1.5 transition hover:bg-blue-700"
      >
        <X size={18} />
      </button>

    </div>

          {/* Chat Messages */}

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">

      {chatMessages.length === 0 && (
        <div className="mt-6 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Bot
              size={25}
              className="text-blue-600"
            />
          </div>

          <h4 className="mt-3 font-semibold text-slate-800">
            How can I help?
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Ask me about your invoices.
          </p>

          <div className="mt-4 space-y-2 text-left">

            <button
              type="button"
              onClick={() =>
                setChatMessage(
                  "Show me my latest invoice"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              Show me my latest invoice
            </button>

            <button
              type="button"
              onClick={() =>
                setChatMessage(
                  "What is the total of my latest invoice?"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              What is my latest invoice total?
            </button>

            <button
              type="button"
              onClick={() =>
                setChatMessage(
                  "What items are in my latest invoice?"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
            >
              What items are in my latest invoice?
            </button>

          </div>

        </div>
      )}


      {chatMessages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === "user"
              ? "justify-end"
              : "justify-start"
          }`}
        >

          <div className="flex items-end gap-2">

  <div
    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
      message.role === "user"
        ? "rounded-br-md bg-blue-600 text-white"
        : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
    }`}
  >
    {message.text}
  </div>

  {message.role === "assistant" && (
    <button
      type="button"
      onClick={() => speakResponse(message.text)}
      title="Listen to response"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    >
      🔊
    </button>
  )}

</div>



        </div>
      ))}


      {chatLoading && (
        <div className="flex justify-start">

          <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">

            <div className="flex gap-1">

              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />

              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />

            </div>

          </div>

        </div>
      )}

    </div>


    {/* Chat Input */}

    <div className="border-t border-slate-200 bg-white p-3">

      <div className="flex items-center gap-2">

        <input
          type="text"
          value={chatMessage}
          onChange={(e) =>
            setChatMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Ask about an invoice..."
          disabled={chatLoading}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />

        {/* Voice Button */}
  <button
    type="button"
    onClick={handleVoiceInput}
    disabled={chatLoading}
    title={
      isListening
        ? "Listening..."
        : "Speak"
    }
    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white transition ${
      isListening
        ? "animate-pulse bg-red-500 hover:bg-red-600"
        : "bg-slate-700 hover:bg-slate-800"
    } disabled:cursor-not-allowed disabled:opacity-50`}
  >
    <Mic size={17} />
  </button>

  {/* Send Button */}
  <button
    type="button"
    onClick={handleSendMessage}
    disabled={
      chatLoading ||
      !chatMessage.trim()
    }
    className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Send size={17} />
  </button>

{isSpeaking && (
  <button
    type="button"
    onClick={handleStopSpeaking}
    title="Stop speaking"
    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700"
  >
    ⏹
  </button>
)}

      </div>

    </div>

  </div>
)}
    </div>
  );
};

export default InvoiceDashboard;
