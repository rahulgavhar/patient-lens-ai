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

  constructor() {
    this.syncFromDb();
  }

  private async syncFromDb(): Promise<void> {
    try {
      const dbDate = await dbService.getLastActivity();
      this.lastActivityAt = dbDate;
      console.log(`[StateManager] Initialized lastActivityAt from DB: ${dbDate}`);
    } catch (err) {
      console.error("[StateManager] Failed to sync lastActivityAt from DB:", err);
    }
  }

  getState(): VmState {
    return this.currentState;
  }

  setState(state: VmState): void {
    console.log(`[StateManager] Transitioning state: ${this.currentState} -> ${state}`);
    this.currentState = state;
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
