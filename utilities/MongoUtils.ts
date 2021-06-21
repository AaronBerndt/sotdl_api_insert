import { MongoClient, ObjectID } from "mongodb";

let cachedDb = null;

const uri = process.env.MONGO_URI;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(uri, { useNewUrlParser: true });

  const db = client.db("sotdl");

  cachedDb = db;
  return db;
}

export async function fetchCollection(collectionName: string) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }

    const database = await connectToDatabase();
    const collection = database.collection(collectionName);
    const data = await collection.find({}).toArray();

    return data;
  } catch (e) {
    throw e;
  }
}

export async function insertIntoCollection(
  collectionName: string,
  newDocuments: any
) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }
    if (newDocuments === undefined) {
      throw "newDocuments is undefined";
    }

    const database = await connectToDatabase();
    const collection = database.collection(collectionName);
    collection.insertMany(newDocuments, { ordered: true });

    return { message: `Sucessfully Added new documents into ${collection}` };
  } catch (e) {
    throw e;
  }
}

export async function updateCollection(
  collectionName: string,
  documentToUpdate: any,
  filter: any
) {
  try {
    if (uri === undefined) {
      throw "URI is undefined";
    }
    if (documentToUpdate === undefined) {
      throw "documentToUpdate is undefined";
    }

    const database = await connectToDatabase();
    const collection = database.collection(collectionName);
    const { _id, ...rest } = documentToUpdate;

    collection.updateOne(
      filter,
      {
        $set: {
          ...rest,
        },
      },
      {
        upsert: true,
      }
    );

    return { message: `Sucessfully updated document in ${collection}` };
  } catch (e) {
    throw e;
  }
}
