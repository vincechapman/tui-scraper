// @ts-check

import {proxyFetch} from "./anonymousFetch.js";
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

async function parseChildren(childList, parentId) {

    for (const j in childList) {

        let child = childList[j];

        async function addToDb() {

            console.log("Adding", child);

            await prisma.destination.upsert({
                where:  {
                    id: child.id
                },
                update: {
                    name: child.name,
                    type: child.type,
                    url: child.url,
                    parents: {connect: {id: parentId}}
                },
                create: {
                    id: child.id,
                    name: child.name,
                    type: child.type,
                    url: child.url,
                    parents: {connect: {id: parentId}}
                }
            });

            console.log("Completed");

            if ("children" in child) await parseChildren(child["children"], child.id);
        }

        if (child.type === "COUNTRY") {
            child = await proxyFetch(`https://www.tui.co.uk/searchpanel/availability/search?searchengine=elastic&apiType=destinationguide&language=en&siteID=th&searchvariant=variantB&key=${child.id}`)
                .then(r => r.json())
            await addToDb();
        } else {
            await addToDb();
        }
    }
}

/**
 * Returns Continents, Countries, Regions, and Destinations. But not Hotels or Resorts.
 * @returns {Promise<void>}
 */
async function getTuiDestinations() {

    const url = "https://www.tui.co.uk/searchpanel/availability/search?searchengine=elastic&apiType=suggestions&language=en&siteID=th";

    const response = await proxyFetch(url).then(r => r.json());

    const continents = response["allContinentHierarchy"];

    for (const i in continents) {

        const continent = continents[i];

        await prisma.destination.upsert({
            where:  {
                id: continent.id
            },
            update: {
                name: continent.name,
                type: continent.type,
                url: continent.url
            },
            create: {
                id: continent.id,
                name: continent.name,
                type: continent.type,
                url: continent.url
            }
        });

        await parseChildren(continent.children, continent.id)
    }

}

await getTuiDestinations();
