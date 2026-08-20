const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const { initializeDatabase } = require("./config/initDb");

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-invoice-reader.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin, such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Invoice Reader Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
};

startServer();
