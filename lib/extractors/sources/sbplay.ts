import cheerio from "cheerio";
import { SourceRetriever, AnimeExtractorDownloadResult } from "./model";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const baseUrl = "https://sbplay.org";
const sbplay: SourceRetriever = {
    name: "SbPlay",
    validate: (url) => /https:\/\/sbplay\.org\/.*/.test(url),
    async fetch(url, options) {
        try {
            if (url.includes("/embed-")) url = url.replace("embed-", "d/");

            const headers = Object.assign(defaultHeaders(), {
                Referer: url,
            });

            const res = await options.http.get(functions.encodeURI(url), {
                headers,
                timeout: constants.http.maxTimeout,
            });

            const results: AnimeExtractorDownloadResult[] = [];
            for (const x of [
                ...res.matchAll(/onclick="download_video\((.*?)\)"/g),
            ]) {
                const [code, mode, hash] = x[1]
                    ? [...x[1]?.matchAll(/'(.*?)'/g)].map((x) => x[1])
                    : [];

                if (code && mode && hash) {
                    const download = encodeURI(
                        `${baseUrl}/dl?op=download_orig&id=${code}&mode=${mode}&hash=${hash}`
                    );

                    const data = await options.http.get(download, {
                        headers,
                        timeout: constants.http.maxTimeout,
                    });

                    const $ = cheerio.load(data);
                    const url = $("a:contains('Direct Download Link')").attr(
                        "href"
                    );

                    if (url) {
                        results.push({
                            quality: "unknown",
                            url,
                            type: ["streamable", "downloadable"],
                            headers,
                        });
                    }
                }
            }

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default sbplay;
