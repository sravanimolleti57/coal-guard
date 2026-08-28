import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coalguard';
const dbName = process.env.MONGODB_DB || 'coalguard';

let client: MongoClient | null = null;
let db: Db | null = null;

// In-memory store for fallback if MongoDB server connection fails or is offline
const inMemoryReportsStore: any[] = [];

export async function connectToDatabase() {
  if (db && client) {
    return { client, db, isMongoConnected: true };
  }

  try {
    client = new MongoClient(uri, {
      connectTimeoutMS: 3000,
      serverSelectionTimeoutMS: 3000,
    });
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB at ${uri} [Database: ${dbName}]`);
    return { client, db, isMongoConnected: true };
  } catch (error: any) {
    console.warn(`⚠️ Local MongoDB server offline or connecting (${error.message}). Using resilient hybrid report store.`);
    return { client: null, db: null, isMongoConnected: false };
  }
}

// Collection Helpers
export async function getReportsCollection() {
  const { db, isMongoConnected } = await connectToDatabase();
  if (isMongoConnected && db) {
    return {
      isMongo: true,
      collection: db.collection('reports'),
    };
  }
  return {
    isMongo: false,
    collection: null,
    inMemoryStore: inMemoryReportsStore,
  };
}
