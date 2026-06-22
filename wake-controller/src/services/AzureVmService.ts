import { ComputeManagementClient } from "@azure/arm-compute";
import { DefaultAzureCredential } from "@azure/identity";
import { stateManager, VmState } from "../state/StateManager";
import * as dotenv from "dotenv";

dotenv.config();

const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID || "";
const resourceGroupName = process.env.AZURE_RESOURCE_GROUP || "";
const vmName = process.env.AZURE_VM_NAME || "";

class AzureVmService {
  private client: ComputeManagementClient | null = null;

  constructor() {
    try {
      if (subscriptionId && resourceGroupName && vmName) {
        const credential = new DefaultAzureCredential();
        this.client = new ComputeManagementClient(credential, subscriptionId);
        console.log("[AzureVmService] Azure Client Initialized.");
      } else {
        console.warn("[AzureVmService] Missing Azure Environment Variables. Running in mock mode.");
      }
    } catch (error) {
      console.error("[AzureVmService] Failed to initialize Azure SDK:", error);
    }
  }

  async startVm(): Promise<void> {
    stateManager.setState(VmState.STARTING);
    console.log(`[AzureVmService] Initiating VM start for ${vmName}...`);
    
    if (this.client) {
      try {
        // Run async without blocking so the controller can immediately return backend_starting
        this.client.virtualMachines.beginStart(resourceGroupName, vmName).then(() => {
            console.log(`[AzureVmService] VM start operation completed.`);
            // The HealthChecker will transition the state to RUNNING once ping succeeds
        }).catch((err) => {
            console.error(`[AzureVmService] Error starting VM:`, err);
            stateManager.setState(VmState.ERROR);
        });
      } catch (err) {
        console.error(`[AzureVmService] Exception during VM start:`, err);
        stateManager.setState(VmState.ERROR);
      }
    } else {
      // Mock mode
      console.log(`[AzureVmService] (MOCK) Pretending to start VM...`);
      setTimeout(() => {
        console.log(`[AzureVmService] (MOCK) VM started.`);
        // Note: HealthChecker handles transitioning to RUNNING.
      }, 3000);
    }
  }

  async stopVm(): Promise<void> {
    stateManager.setState(VmState.STOPPING);
    console.log(`[AzureVmService] Initiating VM deallocation for ${vmName}...`);
    
    if (this.client) {
      try {
        await this.client.virtualMachines.beginDeallocate(resourceGroupName, vmName);
        console.log(`[AzureVmService] VM deallocation completed.`);
        stateManager.setState(VmState.STOPPED);
      } catch (err) {
        console.error(`[AzureVmService] Error stopping VM:`, err);
        stateManager.setState(VmState.ERROR);
      }
    } else {
      // Mock mode
      console.log(`[AzureVmService] (MOCK) Pretending to stop VM...`);
      setTimeout(() => {
        console.log(`[AzureVmService] (MOCK) VM deallocated.`);
        stateManager.setState(VmState.STOPPED);
      }, 3000);
    }
  }
}

export const azureVmService = new AzureVmService();
