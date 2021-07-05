import { SourceRetriever, AnimeExtractorDownloadResult } from "./model";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const sbplay: SourceRetriever = {
    name: "Streamtape",
    validate: (url) => /https:\/\/streamtape\.com\/.*/.test(url),
    async fetch(url, options) {
        try {
            const headers = Object.assign(defaultHeaders(), options.headers);

            const res = await options.http.get(functions.encodeURI(url), {
                headers,
                timeout: constants.http.maxTimeout,
            });

            const results: AnimeExtractorDownloadResult[] = [];

            const link = res.match(
                /id="videolink"[\s\S]+\.innerHTML[\s]+=[\s\S]+(id=.*?)['"]/
            )?.[1];
            if (link && link.startsWith("id") && /&token=.*$/.test(link)) {
                results.push({
                    url: `https://streamtape.com/get_video?${link}`,
                    quality: "unknown",
                    type: ["streamable", "downloadable"],
                });
            }

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default sbplay;
