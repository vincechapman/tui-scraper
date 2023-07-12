// @ts-check

import {PrismaClient} from "@prisma/client";
import fs from "fs";
import {proxyFetch} from "./anonymousFetch.js";

const prisma = new PrismaClient();
const baseUrl = "https://www.tui.co.uk";

async function getAccommodations(destination) {
    try {

        if (!destination.code && !destination.id) {
            console.log("NO CODE:", destination.name);
        }

        if (!destination.url) {
            console.log("No valid url for:", destination.name);
            return;
        }

        const url = baseUrl + destination.url;

        if (destination.description) {
            console.log("Already in database");
            return;
        }

        proxyFetch(url)
            .then(r => r.text())
            .then(response => (async () => {
                let source = response.slice();

                // Finding start
                let index = source.indexOf("var geoNavJsonData = ");
                source = source.slice(index);
                index = source.indexOf("{");
                source = source.slice(index);

                // Finding end
                index = source.indexOf("</script>");
                source = source.slice(0, index).trim();
                source = source.slice(0, source.length -1);

                const geoNavJsonData = JSON.parse(source);

                fs.writeFile("geoNavJsonData.json", JSON.stringify(geoNavJsonData), err => {
                    if (err) {
                        console.error(err)
                    }
                });

                const allAccommodations = geoNavJsonData["accommodations"];
                for (const k in allAccommodations) {
                    const accommodations = allAccommodations[k];
                    for (const l in accommodations)  {
                        const accommodation = accommodations[l];

                        const images = [];
                        for (const m in accommodation["galleryImages"]) {
                            const image = accommodation["galleryImages"][m];
                            images.push(image["mainSrc"]);
                        }

                        console.log("Adding accommodation:", accommodation["name"])

                        console.log("NAME:", destination.name)
                        console.log("CODE:", destination.code);
                        console.log("ID:", destination.id)

                        await prisma.destination.upsert({
                            where: {
                                id: accommodation["code"]
                            },
                            update: {
                                name: accommodation["name"],
                                url: accommodation["url"],
                                images: images.join(" "),
                                type: accommodation["accommodationType"],
                                longitude: accommodation["featureCodesAndValues"]["longitude"][0],
                                latitude: accommodation["featureCodesAndValues"]["latitude"][0],
                                description: accommodation["featureCodesAndValues"]["introduction"] ? accommodation["featureCodesAndValues"]["introduction"].join("<br/>") : undefined,
                                rating: accommodation["featureCodesAndValues"]["tRating"] ? accommodation["featureCodesAndValues"]["tRating"][0] : undefined,
                                parents: {connect: {id: destination.code ? destination.code.trim() : destination.id.trim()}}
                            },
                            create: {
                                id: accommodation["code"],
                                name: accommodation["name"],
                                url: accommodation["url"],
                                images: images.join(" "),
                                type: accommodation["accommodationType"],
                                longitude: accommodation["featureCodesAndValues"]["longitude"][0],
                                latitude: accommodation["featureCodesAndValues"]["latitude"][0],
                                description: accommodation["featureCodesAndValues"]["introduction"] ? accommodation["featureCodesAndValues"]["introduction"].join("<br/>") : undefined,
                                rating: accommodation["featureCodesAndValues"]["tRating"] ? accommodation["featureCodesAndValues"]["tRating"][0] : undefined,
                                parents: {connect: {id: destination.code ? destination.code.trim() : destination.id.trim()}}
                            }
                        })
                    }
                }

            })())
            .catch(reason => console.error("Fetch error:", reason));

    } catch (e) {
        console.error("ERROR while updating", destination.name);
        // throw e;
    }
}

async function updateCountry(country) {

    const url = baseUrl + country.url;

    console.log("Country:", url);

    proxyFetch(url)
        .then(r => r.text())
        .then(response => (async () => {
            let source = response.slice();

            let index = source.indexOf("destinationList =");

            if (index === -1) {
                console.error("Destination List not found in source code.");
                return;
            } else {
                console.log("Destination List found.");
            }

            source = source.slice(index);
            index = source.indexOf("{");
            source = source.slice(index);

            index = source.indexOf("var componentHeading");
            source = source.slice(0, index).trim();
            source = source.slice(0, source.length - 1);

            let destinationList;

            try {
                destinationList = JSON.parse(source);
            } catch (e) {
                switch (e.name) {
                    case "SyntaxError":
                        console.error("Syntax Error:", e);
                        console.log(source);
                        return;
                    default:
                        throw e;
                }
            }

            // TODO comment out when done debugging
            fs.writeFile("destinationList.json", JSON.stringify(destinationList), err => {
                if (err) {
                    console.error(err)
                }
            });

            for (const j in destinationList.locations) {
                const destination = destinationList.locations[j];

                // Gathering images
                const images = [];
                for (const k in destination.images) {
                    const image = destination.images[k];
                    images.push(image.url);
                }

                // Building description

                let description = "";

                description += destination["featureCodesAndValues"]["strapline"] ? `<p>${destination["featureCodesAndValues"]["strapline"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro1Title"] ? `<h3>${destination["featureCodesAndValues"]["intro1Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro1Body"] ? `<p>${destination["featureCodesAndValues"]["intro1Body"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro2Title"] ? `<h3>${destination["featureCodesAndValues"]["intro2Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro2Body"] ? `<p>${destination["featureCodesAndValues"]["intro2Body"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro3Title"] ? `<h3>${destination["featureCodesAndValues"]["intro3Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro3Body"] ? `<p>${destination["featureCodesAndValues"]["intro3Body"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro4Title"] ? `<h3>${destination["featureCodesAndValues"]["intro4Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro4Body"] ? `<p>${destination["featureCodesAndValues"]["intro4Body"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro5Title"] ? `<h3>${destination["featureCodesAndValues"]["intro5Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro5Body"] ? `<p>${destination["featureCodesAndValues"]["intro5Body"]}</p>` : "";

                description += destination["featureCodesAndValues"]["intro6Title"] ? `<h3>${destination["featureCodesAndValues"]["intro6Title"]}</h3>` : "";
                description += destination["featureCodesAndValues"]["intro6Body"] ? `<p>${destination["featureCodesAndValues"]["intro6Body"]}</p>` : "";
                
                // Creating/updating destination in database
                await prisma.destination.upsert({
                    where:  {
                        id: destination.code
                    },
                    update: {
                        name: destination.name,
                        type: destination.locationType,
                        url: destination.url,
                        images: images.join(" "),
                        description: description,
                        parents: {connect: {id: country.id}}
                    },
                    create: {
                        id: destination.code,
                        name: destination.name,
                        type: destination.locationType,
                        url: destination.url,
                        images: images.join(" "),
                        description: description,
                        parents: {connect: {id: country.id}}
                    }
                })

                // Calls function that collects more info about the destination, e.g. available hotels
                await sortType(destination);
            }
        })())
        .catch(reason => console.error("Fetch error:", reason));
}

async function getHotels() {
    const destinations = await prisma.destination.findMany();

    for (const i in destinations) {
        const destination = destinations[i];
        console.log(destination.name)
        await sortType(destination);

    }
}

async function sortType(destination) {
    switch (destination.type) {
        case "COUNTRY":
            await updateCountry(destination);
            break;
        case "DESTINATION":
            await getAccommodations(destination);
            break;
        case null:
            await updateCountry(destination);
            await getAccommodations(destination);
            break;
        default:
            console.error("UNKNOWN DESTINATION TYPE GIVEN:", destination.type, destination.name);
    }
}

await getHotels();