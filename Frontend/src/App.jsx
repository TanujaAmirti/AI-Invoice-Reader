import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import UploadInvoice from "./pages/UploadInvoice";
import InvoiceDashboard from "./pages/InvoiceDashboard";
import InvoiceDetails from "./pages/InvoiceDetails";
import EditInvoice from "./pages/EditInvoice";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Invoice Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <InvoiceDashboard />
            </ProtectedRoute>
          }
        />

        {/* Upload Invoice */}
        <Route
          path="/upload-invoice"
          element={
            <ProtectedRoute>
              <UploadInvoice />
            </ProtectedRoute>
          }
        />

        {/* Invoice Details */}
        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute>
              <InvoiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
  path="/invoice/:id/edit"
  element={<EditInvoice />}
/>

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;