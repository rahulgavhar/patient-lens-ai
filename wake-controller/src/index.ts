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
