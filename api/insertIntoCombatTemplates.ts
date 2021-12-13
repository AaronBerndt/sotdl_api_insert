import { VercelRequest, VercelResponse } from "@vercel/node";
import microCors from "micro-cors";
import { insertIntoCollection } from "../utilities/MongoUtils";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { documents } = request.body.data;
    const data = await insertIntoCollection("combatTemplates", documents);
    response.status(200).send(data);
  } catch (e) {
    response.status(504).send(e);
  }
};

export default cors(handler);
