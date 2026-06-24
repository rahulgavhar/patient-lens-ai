import { MongoClient, Collection } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || "";

interface StateDocument {
  _id: string;
  lastActivityAt: Date;
  vmState: string;
  updatedAt: Date;
}

class DbService {
  private client: MongoClient | null = null;
  private collection: Collection<StateDocument> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    if (mongoUri) {
      this.client = new MongoClient(mongoUri);
      this.initPromise = this.client.connect().then(() => {
        const db = this.client!.db("wake_controller");
        this.collection = db.collection<StateDocument>("state");
        console.log("[DbService] Connected to MongoDB successfully.");
      }).catch((err) => {
        console.error("[DbService] Failed to connect to MongoDB:", err);
      });
    } else {
      console.warn("[DbService] MONGODB_URI is not defined. Running in fallback mode.");
    }
  }

  async ensureConnected(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  async getLastActivity(): Promise<Date> {
    await this.ensureConnected();
    if (this.collection) {
      try {
        const doc = await this.collection.findOne({ _id: "wake_controller_state" });
        if (doc && doc.lastActivityAt) {
          return new Date(doc.lastActivityAt);
        }
      } catch (err) {
        console.error("[DbService] Error reading lastActivity from DB:", err);
      }
    }
    return new Date();
  }

  async updateLastActivity(date: Date): Promise<void> {
    await this.ensureConnected();
    if (this.collection) {
      try {
        await this.collection.updateOne(
          { _id: "wake_controller_state" },
          {
            $set: {
              lastActivityAt: date,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("[DbService] Error updating lastActivity in DB:", err);
      }
    }
  }

  async getVmState(): Promise<string | null> {
    await this.ensureConnected();
    if (this.collection) {
      try {
        const doc = await this.collection.findOne({ _id: "wake_controller_state" });
        if (doc && doc.vmState) {
          return doc.vmState;
        }
      } catch (err) {
        console.error("[DbService] Error reading vmState from DB:", err);
      }
    }
    return null;
  }

  async updateVmState(vmState: string): Promise<void> {
    await this.ensureConnected();
    if (this.collection) {
      try {
        await this.collection.updateOne(
          { _id: "wake_controller_state" },
          {
            $set: {
              vmState,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("[DbService] Error updating vmState in DB:", err);
      }
    }
  }
}

export const dbService = new DbService();
