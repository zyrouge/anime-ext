import { SourceRetriever, AnimeExtractorDownloadResult } from "./model";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
    "x-requested-with": "XMLHttpRequest",
});

const sbplay: SourceRetriever = {
    name: "StreamAni-Load",
    validate: (url) => /https:\/\/streamani\.net\/load\.php\?.*/.test(url),
    async fetch(url, options) {
        try {
            const headers = Object.assign(defaultHeaders(), options.headers);

            const res = await options.http.get(functions.encodeURI(url), {
                headers,
                timeout: constants.http.maxTimeout,
                credentials: true,
            });

            const results: AnimeExtractorDownloadResult[] = [];
            for (const [, url, label] of [
                ...res.matchAll(
                    /file:\s+['"](.*?)['"].*?label:\s+['"](.*?)['"]/g
                ),
            ]) {
                if (url && label) {
                    results.push({
                        url,
                        quality: label,
                        type: ["downloadable"],
                    });
                }
            }

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default sbplay;
