// server/app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

// Routes
const healthRoute = require("./routes/health");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const visitRoutes = require("./routes/visits");
const patientsRoutes = require("./routes/patients");
const queueRoutes = require("./routes/queue");
const paymentRoutes = require("./routes/payments");
const casesRoutes = require("./routes/cases");
const prescriptionsRoutes = require("./routes/prescriptions");
const printRoutes = require("./routes/print");
const reportRoutes = require("./routes/reports");
const backupRoutes = require("./routes/backup");
const setupRoutes = require("./routes/setup");
const visitBillingRoutes = require('./routes/visitBillings');
const profileRoutes = require("./routes/profile");
const uploadRoutes = require("./routes/upload");
const clinicSettingsRoutes = require("./routes/clinicSettings");
const path = require("path");
const PATHS = require("./config/paths");

// Middleware
const setupGuard = require("./auth/setupGuard");
const frontendPath = path.join(__dirname, "../client/dist");

const app = express();

// ================= GLOBAL MIDDLEWARE =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(express.json());

if (process.env.NODE_ENV === "development") {
  const cors = require("cors");
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
}

// ================= SETUP ROUTES (MUST BE FIRST) =================
// These must NEVER be blocked
app.use("/api/setup", setupRoutes);

// ================= HEALTH CHECK (OPTIONAL BUT SAFE) =================
app.use("/api", healthRoute);

// ================= SETUP GUARD =================
// Everything below this line is blocked until setup is complete
app.use("/api", setupGuard);

// ================= NORMAL APPLICATION ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/print", printRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", backupRoutes);
app.use('/api/billing', visitBillingRoutes);
app.use("/api/clinic", clinicSettingsRoutes);

// serve avatars
app.use("/uploads", express.static(PATHS.uploads));

// ================= FRONTEND BUILD SERVING =================
app.use(express.static(frontendPath));

// React router fallback (MUST BE LAST)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

module.exports = app;