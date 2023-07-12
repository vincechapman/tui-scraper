// import tuiData from './tuiData.json' assert {type: "json"};

// function main() {
//     for (const i in tuiData["continents"]) {
//         const continent = tuiData["continents"][i];
//         for (const j in continent["countries"]) {
//             const countries = continent["countries"][j];
//
//             function getAllChildren(childrenList) {
//                 for (const k in childrenList) {
//                     const child = childrenList[k];
//                     console.log(`\nCHILD: ${child["url"]}`);
//                     if ("children" in child) getAllChildren(child["children"]);
//                 }
//             }
//
//             getAllChildren(countries["destinations"]);
//         }
//     }
// }

import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';

const tuiData = {}
let tabsOpen = 0;

async function getPageData(browser, pageLink) {
    console.log("Getting page data");
    const newTab = await browser.newPage();
    tabsOpen++;
    await newTab.goto(pageLink);
    await newTab.waitForNetworkIdle();

    let countryName = undefined;

    async function getCountryName(page) {
        try {
            let $ = cheerio.load(await page.content());
            countryName = $('h1', '.UI__headingContainer').text().replace("Holidays", "").trim();

            if (countryName) tuiData[countryName] = {};
        } catch (e) {
            console.error("Failed to get country name:", e);
        }
    }
    await getCountryName(newTab);

    async function getDescription(page) {
        try {
            console.log("Getting description");
            try {
                await page.click('.EditorialContent__showAccordion');
            } catch (e) {}

            let $ = cheerio.load(await page.content());

            const description = $('.EditorialContent__contentBox').html();

            if (description) tuiData[countryName].description = description;
            console.log("Got description");
        } catch (e) {
            console.error("Failed to get description:", e);
        }
    }
    await getDescription(newTab);

    async function getImages(page) {
        try {
            if (!(countryName in tuiData)) return;

            console.log("Getting images")
            // Getting images
            const images = new Set();
            let $ = cheerio.load(await page.content());
            const numPictures = parseInt($('.Galleries__index:nth-child(2)').text().replace("/", "").trim());

            for (let i = 0; i < numPictures; i++) {
                let imgSrc = undefined;
                let imageComingSoonSrc = "https://www.tui.co.uk/static-images/_ui/mobile/osp_27.2.1_nr-202306231353/framework/tui/image_coming_soon.png";

                // Loops until valid src given
                while (!imgSrc) {
                    imgSrc = $(`picture:nth(${i}) > img`, '.GlobalDestinationsHero__heroBannerWidth').attr('src');
                    if (imgSrc === undefined) break;
                    else if (imgSrc === imageComingSoonSrc) imgSrc = undefined;
                }

                // Add image src to images set, if not undefined.
                if (imgSrc) images.add(imgSrc);

                // Click to next image
                if (i + 1 !== numPictures) {
                    await page.click('div.Galleries__galleryWrapperV2 > span:nth-child(3) > a > span');
                    await page.waitForNetworkIdle();
                    $ = cheerio.load(await page.content());
                }
            }

            tuiData[countryName].images = images;
        } catch (e) {
            console.error("Failed to get images:", e);
        }
    }
    await getImages(newTab);

    async function getChildren(page) {
        try {
            let $ = cheerio.load(await page.content());
            // console.log($('.UI__destinationListBlock').html());

            const pageLinks = [];
            if ($('.UI__destinationRow').html()) {
                $('.UI__factCol', '.UI__destinationRow').each((i, el) => {
                    pageLinks.push("https://www.tui.co.uk" + $('a', el).attr('href'));
                })
            }

            for (const j in pageLinks) {
                const destinationPage = await browser.newPage();
                tabsOpen++;
                await destinationPage.goto(pageLinks[j]);
                await destinationPage.waitForNetworkIdle();

                await getCountryName(destinationPage);

                await getDescription(destinationPage);

                await getImages(destinationPage);

                await getChildren(destinationPage);

                await destinationPage.close();
                tabsOpen--;
            }
        } catch (e) {
            console.error("Failed to get children:", e);
        }
    }
    await getChildren(newTab);

    await newTab.close();
    tabsOpen--;
}

async function main() {
   try {
       // Opening browser
       const browser = await puppeteer.launch({headless: false});
       browser.defaultBrowserContext();

       // Opening new page on browser and navigating to TUI destinations homepage
       const page = await browser.newPage();
       tabsOpen++;
       await page.goto('https://www.tui.co.uk/destinations/holiday-destinations');

       // Closing cooking banner - TODO this step may not be required
       await page.waitForSelector('#cmCloseBanner');
       await page.click('#cmCloseBanner');

       // Extracting country page links from source
       await page.waitForSelector('.UI__countryList');
       let $ = cheerio.load(await page.content());
       const countryPageLinks = [];
       $('.UI__countryList').each((i, el) => {
           countryPageLinks.push('https://www.tui.co.uk' + $('a', el).attr('href'));
       })

       // Looping through each link and opening in a new tab
       for (const i in countryPageLinks.slice(0, 3)) {
           await getPageData(browser, countryPageLinks[i]);
       }

       await browser.close();
   } catch (e) {
       console.error(e);
   } finally {
       console.log(tuiData);
   }
}

main().then(r => null);