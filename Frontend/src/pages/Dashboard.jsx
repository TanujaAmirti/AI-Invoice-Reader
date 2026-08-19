import { useNavigate } from "react-router-dom";


function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-xl">🧾</span>
            </div>

            <div>
              <h1 className="font-bold text-slate-900">
                AI Invoice Reader
              </h1>

              <p className="text-xs text-slate-400">
                Smart Invoice Processing
              </p>
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Logout
          </button>

        </div>

      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        <div className="mb-8">

          <h2 className="text-3xl font-bold text-slate-900">
            Welcome, {user?.fullName || "User"} 👋
          </h2>

          <p className="text-slate-500 mt-2">
            Manage and extract information from your invoices.
          </p>

        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

          <div className="max-w-xl">

            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
              <span className="text-2xl">📄</span>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              Upload an Invoice
            </h3>

            <p className="text-slate-500 mt-2">
              Upload a PDF or image invoice and let AI extract the
              important information automatically.
            </p>

           <button
  onClick={() => navigate("/upload-invoice")}
  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
>
  Upload Invoice
</button>
          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;