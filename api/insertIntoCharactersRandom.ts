import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertIntoCollection } from "../utilities/MongoUtils";
import { Character, Characteristic, Talent } from "../types";
import microCors from "micro-cors";
import axios from "axios";
import { find, random, sampleSize, shuffle, sumBy, take } from "lodash";
import traditionList from "./constants/traditionList";
import { ObjectId } from "mongodb";

const cors = microCors();

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === "OPTIONS") {
      return response.status(200).end();
    }

    const { level, playerId } = request.body.data;

    const { data: ancestries } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/ancestries`
    );

    const { data: paths } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/paths`
    );

    const { data: spells } = await axios(
      `https://sotdl-api-fetch.vercel.app/api/spells`
    );

    const pickRandomAncestry = () => {
      const ancestry = ancestries[random(0, ancestries.length - 1)];

      return ancestry;
    };

    const pickRandomPath = (pathType: string) => {
      const filteredPaths = paths.filter(({ type }) => type === pathType);

      const path = filteredPaths[random(0, filteredPaths.length - 1)];

      return path;
    };

    const statList = ["Strength", "Agility", "Will", "Intellect"];
    const ancestry = pickRandomAncestry();
    const novicePath =
      level >= 1 && !find(ancestry.talents, { name: "Powerful Ancestry" })
        ? pickRandomPath("Novice")
        : "";

    const expertPath = level >= 3 ? pickRandomPath("Expert") : "";
    const masterPath = level >= 7 ? pickRandomPath("Master") : "";
    let pastLife: any = "";

    const pickRandomCharacteristics = (level: number) => {
      const createRandomCharacteristicsList = (amount, atLevel, value) =>
        take(shuffle(statList), amount).map((characteristic) => ({
          id: `${characteristic}-${atLevel}`,
          name: characteristic,
          value,
          level: atLevel,
        }));

      const regex = /Increase (.*) by (.*)/gm;
      const hasAncestryChoice = find(ancestry.talents, {
        name: "Attributes Increase",
      });

      const ancestryChoice = hasAncestryChoice
        ? createRandomCharacteristicsList(
            1,
            0,
            parseInt(regex.exec(hasAncestryChoice.description)[2])
          )
        : [];

      const noviceList =
        level >= 1 ? createRandomCharacteristicsList(2, 1, 1) : [];
      const expertList =
        level >= 3 ? createRandomCharacteristicsList(2, 3, 1) : [];
      const masterList =
        level >= 7 ? createRandomCharacteristicsList(3, 7, 1) : [];

      return [...ancestryChoice, ...noviceList, ...expertList, ...masterList];
    };

    const rollForRandomCharacteristics = () => {
      const characteristics = (
        pastLife !== "" ? pastLife : ancestry
      ).characteristics.filter(
        ({ level, name }) => level === 0 && statList.includes(name)
      );

      const randomCharacteristics = characteristics.map(
        (characteristic: Characteristic) => {
          const ancestryModifter = characteristic.value - 2;
          const diceRoll = random(1, 3);
          const newCharacteristic = ancestryModifter + diceRoll;
          return {
            name: characteristic?.name,
            value: newCharacteristic - characteristic.value,
          };
        }
      );

      return randomCharacteristics.filter(({ value }) => value !== 0);
    };

    const pickRandomChoices = () => {
      const talentsList = [
        ...ancestry?.talents,
        ...(novicePath !== "" ? novicePath?.talents : []),
        ...(expertPath !== "" ? expertPath?.talents : []),
        ...(masterPath !== "" ? masterPath?.talents : []),
      ]
        .filter(
          ({ name, description, level }: Talent) =>
            name === "Attributes Increase" ||
            description.includes("Choose") ||
            description.includes("Pick") ||
            level === 4
        )
        .map((talent: Talent) => {
          if (
            ["Faith", "Tradition Focus", "Knack", "Discipline"].includes(
              talent.name
            ) &&
            novicePath.name !== "Adept"
          ) {
            const choiceType = {
              "tradition focus": "focuses",
              faith: "faiths",
              knack: "knacks",
              discipline: "disciplines",
            };

            const choice =
              novicePath[choiceType[talent?.name.toLowerCase()]][
                random(
                  0,
                  novicePath[choiceType[talent?.name.toLowerCase()]].length - 1
                )
              ];

            return {
              name: talent?.name,
              value: choice?.name !== null ? choice?.name : "None",
              level: talent?.level,
            };
          }
          if (talent.name === "Past Life") {
            const filteredAncestryList = ancestries.filter(
              ({ talents }: any) =>
                !talents.map(({ name }: Talent) => name).includes("Past Life")
            );

            pastLife =
              filteredAncestryList[random(0, filteredAncestryList.length - 1)];

            return {
              name: talent.name,
              value: pastLife?.name,
              level: talent.level,
            };
          } else {
            return talent;
          }
        });

      return talentsList;
    };

    const randomCharacteristics = pickRandomCharacteristics(level);
    const choices = pickRandomChoices();

    const overrides = rollForRandomCharacteristics();

    const characteristicsList = [
      ...randomCharacteristics,
      ...ancestry?.characteristics,
      ...(novicePath !== "" ? novicePath?.characteristics : []),
      ...(expertPath !== "" ? expertPath?.characteristics : []),
      ...(masterPath !== "" ? masterPath?.characteristics : []),
    ];

    const sumByValue = (valueToSumBy: string) =>
      sumBy(
        characteristicsList.filter(
          ({ name, level: characteristicsLevel }) =>
            name === valueToSumBy && characteristicsLevel <= level
        ),
        "Value"
      );

    const pickRandomSpells = () => {
      const pickSpell = (spellLevel: number) => {
        const spellsToPickFrom = spells;
      };

      const will = sumByValue("Will");
      const intellect = sumByValue("Intellect");
      const power = sumByValue("Power");

      const talentsList = [
        ...ancestry?.talents,
        ...(novicePath !== "" ? novicePath?.talents : []),
        ...(expertPath !== "" ? expertPath?.talents : []),
        ...(masterPath !== "" ? masterPath?.talents : []),
      ].filter(
        ({ name, description, level: talentLevel }) =>
          (name.includes("Magic") ||
            traditionList.some((tradition) =>
              description.split(" ").includes(tradition)
            )) &&
          talentLevel <= level
      );

      const pickTraditionList = traditionList.filter((tradition) =>
        talentsList.some(({ description }) =>
          description.split(" ").includes(tradition)
        )
      );

      const randomTraditionList = sampleSize(traditionList, level);

      return talentsList.length === 0
        ? []
        : sampleSize(
            spells.filter(
              ({ tradition, level: spellLevel }) =>
                [...pickTraditionList, ...pickTraditionList].includes(
                  tradition
                ) && spellLevel <= power
            ),
            level * 3
          ).map(({ name }) => name);
    };

    const newCharacterData: any = {
      name: "",
      level: level,
      playerId: playerId,
      ancestry: ancestry?.name,
      novicePath: novicePath?.name ? novicePath?.name : novicePath,
      expertPath: expertPath?.name ? expertPath?.name : expertPath,
      masterPath: masterPath?.name ? masterPath?.name : masterPath,
      characteristics: randomCharacteristics,
      talents: [],
      spells: pickRandomSpells(),
      traditions: [],
      items: {
        weapons: ["Unarmed Strike"],
        armor: [],
        otherItems: [],
        currency: {
          bits: 0,
          copper: 0,
          silver: 0,
          gold: 0,
        },
      },
      languages: ["Common"],
      professions: [],
      details: [],
      choices,

      temporaryEffects: [],
      characterState: {
        damage: 0,
        injured: false,
        temporaryEffects: [
          {
            _id: new ObjectId(),
            name: "Unarmed Strike",
            equipped: true,
          },
        ],
        equipped: [],
        expended: [],
        overrides,
        afflictions: [],
      },
    };

    const data = await insertIntoCollection("characters", newCharacterData);
    response.status(200).send(newCharacterData);
  } catch (e) {
    console.log(e);
    response.status(504).send(e);
  }
};

export default cors(handler);
