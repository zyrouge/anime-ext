import { SourceRetriever, AnimeExtractorDownloadResult } from "./model";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const gogoplay: SourceRetriever = {
    name: "Gogoplay-loadserver",
    validate: (url) =>
        url.includes("/load.php") || url.includes("/loadserver.php"),
    async fetch(url, options) {
        try {
            const headers = Object.assign(defaultHeaders(), {
                Referer: url,
            });

            const data = await options.http.get(functions.encodeURI(url), {
                headers,
                timeout: constants.http.maxTimeout,
            });

            const urls = [
                ...data.matchAll(
                    /file:\s+[\'\"](https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*)[\'\"]/g
                ),
            ].map((x) => x[1]);

            const results: AnimeExtractorDownloadResult[] = <any[]>urls
                .filter((x) => x)
                .map((x) => {
                    const result: AnimeExtractorDownloadResult = {
                        quality: "unknown",
                        url: x!,
                        type: ["downloadable"],
                        headers,
                    };

                    if (!result.url.includes(".m3u8")) {
                        result.type.push("streamable");
                    }

                    return result;
                });

            results.push({
                quality: "unknown",
                url,
                type: ["embedable"],
                headers,
            });

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default gogoplay;
