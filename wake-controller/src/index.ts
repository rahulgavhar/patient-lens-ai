import express from "express";
import { proxyRouter } from "./routes/ProxyRouter";
import { stateManager } from "./state/StateManager";
import { InactivityMonitor } from "./jobs/InactivityMonitor";
import { azureVmService } from "./services/AzureVmService";

const app = express();
const PORT = process.env.PORT || 8000;

// Admin / Controller endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    controller: "wake-controller",
    uptime: process.uptime()
  });
});

app.get("/status", (req, res) => {
  res.json({
    vmState: stateManager.getState(),
    lastActivityAt: stateManager.getLastActivity(),
    activeRequests: stateManager.getActiveRequests()
  });
});

app.post("/wake", express.json(), async (req, res) => {
  if (stateManager.getState() === "STOPPED") {
    await azureVmService.startVm();
    // Assuming HealthChecker will be triggered if needed, though usually proxy router does it
    // Let's rely on proxy interception for automatic flow, manual /wake is just an override
    res.json({ status: "backend_starting" });
  } else {
    res.json({ status: "ignored", currentState: stateManager.getState() });
  }
});

// All other requests go through the Proxy
app.use("/", proxyRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`[WakeController] Listening on port ${PORT}`);
  console.log(`[WakeController] Configured to proxy to: ${process.env.BACKEND_TARGET_URL || "http://localhost:4004"}`);
  
  // Start background jobs
  InactivityMonitor.start();
});

// Process event listeners for lifecycle logging and debugging
process.on("exit", (code) => {
  console.log(`[Process] Exiting with code: ${code}`);
});

process.on("SIGTERM", () => {
  console.log("[Process] SIGTERM received. Container is being shut down or recycled by host.");
});

process.on("SIGINT", () => {
  console.log("[Process] SIGINT received.");
});

process.on("uncaughtException", (err) => {
  console.error("[Process] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Process] Unhandled Rejection at:", promise, "reason:", reason);
});

// Keep-alive heartbeat interval to ensure event loop remains active
setInterval(() => {
  console.log(`[WakeController] Heartbeat - Uptime: ${Math.round(process.uptime() / 60)} minutes.`);
}, 300000); // every 5 minutes
