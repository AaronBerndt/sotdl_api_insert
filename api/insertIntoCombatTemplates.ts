import { VercelRequest, VercelResponse } from "@vercel/node";
import { sum } from "lodash";
import microCors from "micro-cors";
import { insertIntoCollection } from "../utilities/MongoUtils";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    console.log(request.body);
    const { name, monstersInCombat } = request.body.data;

    const difficulty = sum(
      monstersInCombat.map((monsters) => {
        return monsters.difficulty * monsters.amount;
      })
    );
    const data = await insertIntoCollection("combatTemplates", {
      name,
      monstersInCombat,
      difficulty,
    });

    response.status(200).send(data);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
