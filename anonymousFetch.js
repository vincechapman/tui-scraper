import {HttpsProxyAgent} from "https-proxy-agent";
import fetch from "node-fetch";

/**
 * A wrapper for the Fetch api, that uses random proxy ip addresses to anonymize requests.
 * @param url
 * @param options
 */
export async function proxyFetch(url, options) {

    let response;
    let attempts = 0;

    const proxyAgent = new HttpsProxyAgent('http://sp4fmhda1a:bdiuJ8s1xzE7jkAcQ8@gb.smartproxy.com:30000');

    while (!response) {
        attempts++;

        try {
            return await fetch(url, {
                agent: proxyAgent,
                ...options
            });

        } catch (e) {
            if (attempts !== 10) {
                console.log("Trying again...");
            } else {
                throw e;
            }
        }
    }
}
