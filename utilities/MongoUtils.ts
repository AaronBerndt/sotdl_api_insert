import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export async function fetchCollection(collectionName: string) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }
    await client.connect();
    const database = client.db("sotdl");
    const collection = database.collection(collectionName);
    const data = await collection.find({}).toArray();

    return data;
  } catch (e) {
    throw e;
  } finally {
    await client.close();
  }
}
