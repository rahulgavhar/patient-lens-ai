import cron from "node-cron";
import { stateManager, VmState } from "../state/StateManager";
import { azureVmService } from "../services/AzureVmService";

const INACTIVITY_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours

export class InactivityMonitor {
  static start() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", () => {
      console.log(`[InactivityMonitor] Running scheduled check...`);
      const currentState = stateManager.getState();
      
      if (currentState !== VmState.RUNNING && currentState !== VmState.ERROR) {
        return; // Don't shut down if stopped, stopping, or starting
      }

      const now = new Date();
      const lastActivity = stateManager.getLastActivity();
      const timeSinceLastActivity = now.getTime() - lastActivity.getTime();
      const activeRequests = stateManager.getActiveRequests();

      console.log(`[InactivityMonitor] Time since last activity: ${Math.round(timeSinceLastActivity / 60000)} minutes. Active requests: ${activeRequests}`);

      if (timeSinceLastActivity > INACTIVITY_THRESHOLD_MS && activeRequests === 0) {
        console.log(`[InactivityMonitor] Inactivity threshold reached. Triggering shutdown...`);
        azureVmService.stopVm();
      }
    });

    console.log(`[InactivityMonitor] Scheduled job initialized (every 5 mins).`);
  }
}
