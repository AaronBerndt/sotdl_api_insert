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
    const { partyId, combatTemplateId } = request.body.data;

    const [combatTemplate] = await fetchCollection("combatTemplates", {
      _id: new ObjectId(combatTemplateId),
    });

    combatTemplate.monstersInCombat;
    const combatObject = {
      partyId,
      active: true,
      combatants: combatTemplate.monstersInCombat
        .map((monsterTemplate: any) =>
          range(1, monsterTemplate.amount + 1).map((key) => ({
            _id: new ObjectId(),
            monsterId: monsterTemplate._id,
            name: `${monsterTemplate.name} ${key}`,
            damage: 0,
            injured: false,
            temporaryEffects: [],
            expended: [],
            overrides: [],
            afflictions: [],
            turnType: "Monster Fast",
          }))
        )
        .flat(),

      turn: 1,
      currentRound: "Player Fast",
    };

    const data = await insertIntoCollection("combats", combatObject);
    response.status(200).send(data);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
