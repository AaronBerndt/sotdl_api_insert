import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  fetchCollection,
  insertIntoCollection,
  updateCollection,
} from "../utilities/MongoUtils";
import { Character, Item } from "../types";
import microCors from "micro-cors";
import { ObjectId, ObjectID } from "mongodb";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { documents } = request.body.data;

    const newCharacterData: Character = {
      name: documents.name,
      level: documents.level,
      partyId: documents.partyId,
      playerId: documents.playerId,
      turnType: "Fast",
      activeCombat: "",
      ancestry: documents.ancestry,
      novicePath: documents.novicePath,
      expertPath: documents.expertPath,
      masterPath: documents.masterPath,
      characteristics: [...documents.characteristics].map(
        ({ value, ...rest }) => ({ ...rest, value: Number(value) })
      ),
      talents: [],
      spells: documents.spells,
      traditions: documents.traditions,
      items: {
        weapons: [
          "Unarmed Strike",
          documents.items
            .filter(({ itemType }) => itemType === "weapon")
            .map(({ name }) => name),
        ],
        armor: documents.items
          .filter(({ itemType }) => itemType === "armor")
          .map(({ name }) => name),
        otherItems: documents.items
          .filter(({ itemType }) => itemType === "basic")
          .map(({ name }) => name),
        currency: documents.currency,
      },
      languages: documents.languages,
      professions: documents.professions,
      details: [],
      choices: documents.choices,
      characterState: {
        damage: 0,
        injured: false,
        expended: [],
        temporaryEffects: [],
        equipped: [
          {
            _id: new ObjectId(),
            name: "Unarmed Strike",
            equipped: true,
          },
          ...documents.items
            .filter(({ itemType }) => itemType !== "basic")
            .map((item: Item) => ({
              _id: new ObjectId(),
              name: item.name,
              equipped: true,
            })),
        ],
        overrides: documents.overrides,
        afflictions: [],
      },
    };

    const result = await insertIntoCollection("characters", newCharacterData);
    const _id = result.documents.insertedIds["0"];

    const [party] = await fetchCollection("parties", {
      _id: new ObjectId(documents.partyId),
    });
    const { members, ...rest } = party;

    await updateCollection(
      "parties",
      { ...rest, members: [...members, _id] },
      {
        _id: new ObjectId(party._id),
      }
    );

    response.status(200).send(result.message);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
