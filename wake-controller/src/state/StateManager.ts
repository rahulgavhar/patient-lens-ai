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
    this.lastActivityAt = new Date();
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
