// lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const DEFAULT_DIRECT_URI = 'mongodb://abdullahbilal332333_db_user:sN36fAs1pqW3Te7n@ac-feeumcq-shard-00-00.ytkvk44.mongodb.net:27017,ac-feeumcq-shard-00-01.ytkvk44.mongodb.net:27017,ac-feeumcq-shard-00-02.ytkvk44.mongodb.net:27017/breakin?ssl=true&authSource=admin&retryWrites=true&w=majority';
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_DIRECT_URI;
const dbName = process.env.DB_NAME || 'breakin';

const options = {
  serverSelectionTimeoutMS: 4000,
  connectTimeoutMS: 4000,
  maxPoolSize: 20,
  minPoolSize: 2,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect().catch((err) => {
    console.warn('Direct Mongo connect failed, retrying with fallback...', err?.message);
    const fallbackClient = new MongoClient(DEFAULT_DIRECT_URI, options);
    return fallbackClient.connect();
  });
}
clientPromise = global._mongoClientPromise;

export async function getDatabase(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export { clientPromise };
export default clientPromise;
