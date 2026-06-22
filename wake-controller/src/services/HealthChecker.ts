import { stateManager, VmState } from "../state/StateManager";
import * as dotenv from "dotenv";

dotenv.config();

const backendUrl = process.env.BACKEND_TARGET_URL || "http://localhost:4004";
const pollingIntervalMs = 5000;

class HealthChecker {
  private pollingTimer: NodeJS.Timeout | null = null;

  startPolling() {
    if (this.pollingTimer) return;
    
    console.log(`[HealthChecker] Starting to poll backend health at ${backendUrl}/actuator/health`);
    
    this.pollingTimer = setInterval(async () => {
      const currentState = stateManager.getState();
      
      if (currentState === VmState.STARTING) {
        try {
          // If we can reach the backend, it means the VM is fully booted and services are up
          const response = await fetch(`${backendUrl}/actuator/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
          });
          
          if (response.ok) {
            console.log(`[HealthChecker] Backend is healthy! Transitioning to RUNNING.`);
            stateManager.setState(VmState.RUNNING);
            this.stopPolling();
          }
        } catch (err) {
          // VM still booting, request timeout or connection refused expected.
        }
      } else {
        // If state changed to something else unexpectedly, stop polling
        this.stopPolling();
      }
    }, pollingIntervalMs);
  }

  stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log(`[HealthChecker] Polling stopped.`);
    }
  }
}

export const healthChecker = new HealthChecker();
