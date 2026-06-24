import { dbService } from "../services/DbService";

export enum VmState {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR'
}

class StateManager {
  private currentState: VmState = VmState.STOPPED;
  private lastActivityAt: Date = new Date();
  private activeRequests: number = 0;
  public readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.syncFromDb();
    this.readyPromise.then(() => {
      this.syncVmStateFromAzure();
    });
  }

  private async syncFromDb(): Promise<void> {
    try {
      const dbDate = await dbService.getLastActivity();
      this.lastActivityAt = dbDate;
      console.log(`[StateManager] Initialized lastActivityAt from DB: ${dbDate}`);
      
      const dbVmState = await dbService.getVmState();
      if (dbVmState && Object.values(VmState).includes(dbVmState as VmState)) {
        this.currentState = dbVmState as VmState;
        console.log(`[StateManager] Initialized vmState from DB: ${dbVmState}`);
      } else {
        console.log(`[StateManager] No vmState found in DB, defaulting to ${this.currentState}`);
      }
    } catch (err) {
      console.error("[StateManager] Failed to sync state from DB:", err);
    }
  }

  private async syncVmStateFromAzure(): Promise<void> {
    try {
      const { azureVmService } = await import("../services/AzureVmService");
      const actualState = await azureVmService.checkVmState();
      this.setState(actualState);
    } catch (err) {
      console.error("[StateManager] Failed to sync VM state from Azure:", err);
    }
  }

  getState(): VmState {
    return this.currentState;
  }

  setState(state: VmState): void {
    if (this.currentState !== state) {
      console.log(`[StateManager] Transitioning state: ${this.currentState} -> ${state}`);
      this.currentState = state;
      dbService.updateVmState(state).catch((err) => {
        console.error("[StateManager] Failed to async update vmState in DB:", err);
      });
    }
  }

  getLastActivity(): Date {
    return this.lastActivityAt;
  }

  updateActivity(): void {
    const now = new Date();
    this.lastActivityAt = now;
    dbService.updateLastActivity(now).catch((err) => {
      console.error("[StateManager] Failed to async update lastActivity in DB:", err);
    });
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }

  incrementActiveRequests(): void {
    this.activeRequests++;
  }

  decrementActiveRequests(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
  }
}

export const stateManager = new StateManager();
