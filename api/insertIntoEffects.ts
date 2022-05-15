import { VercelRequest, VercelResponse } from "@vercel/node";
import { range } from "lodash";
import microCors from "micro-cors";
import { ObjectId } from "mongodb";
import { fetchCollection, insertIntoCollection } from "../utilities/MongoUtils";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }
    const { documents } = request.body.data;
    const data = await insertIntoCollection("effects", documents);
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
