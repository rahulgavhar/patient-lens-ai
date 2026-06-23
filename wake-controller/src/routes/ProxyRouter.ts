import { Router, Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { stateManager, VmState } from "../state/StateManager";
import { azureVmService } from "../services/AzureVmService";
import { healthChecker } from "../services/HealthChecker";
import * as dotenv from "dotenv";

dotenv.config();

export const proxyRouter = Router();

const backendUrl = process.env.BACKEND_TARGET_URL || "http://localhost:4004";

// Middleware to intercept requests based on VM state
const stateInterceptor = async (req: Request, res: Response, next: NextFunction) => {
  const currentState = stateManager.getState();

  if (currentState === VmState.RUNNING) {
    // If running, just pass through to proxy
    return next();
  }

  if (currentState === VmState.STOPPED) {
    // Start VM, change state, start polling health, and return 202
    await azureVmService.startVm();
    healthChecker.startPolling();
    res.status(202).json({
      status: "backend_starting",
      message: "Backend VM was offline and is now booting up. Please retry your request shortly."
    });
    return;
  }

  if (currentState === VmState.STARTING) {
    // VM is already booting, tell client to hold on
    res.status(202).json({
      status: "backend_starting",
      message: "Backend VM is currently booting up. Please retry your request shortly."
    });
    return;
  }

  if (currentState === VmState.STOPPING) {
    res.status(503).json({
      status: "backend_stopping",
      message: "Backend VM is currently shutting down. Please wait before starting."
    });
    return;
  }

  if (currentState === VmState.ERROR) {
    res.status(500).json({
      status: "backend_error",
      message: "Backend VM encountered an error during startup/shutdown."
    });
    return;
  }
};

// Apply interceptor
proxyRouter.use(stateInterceptor);

// The actual proxy middleware
proxyRouter.use(createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq: any, req: any, res: any) => {
      // When a request begins proxying
      stateManager.incrementActiveRequests();
    },
    proxyRes: (proxyRes: any, req: any, res: any) => {
      // When a response comes back
      stateManager.decrementActiveRequests();

      // Smart activity tracking: Ignore root pings or common health check paths 
      // often used by external cron jobs to keep Render awake.
      const path = req.path || req.url;
      const isCronPing = path === '/' || path === '/health' || path === '/favicon.ico' || path === '/robots.txt';
      
      if (!isCronPing) {
        stateManager.updateActivity(); // update lastActivityAt
      }
    },
    error: (err: any, req: any, res: any) => {
      stateManager.decrementActiveRequests();
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: "proxy_error",
          message: "Bad Gateway. Backend might be dropping connections."
        }));
      }
    }
  }
}));
