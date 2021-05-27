import { SourceRetriever, AnimeExtractorDownloadResult } from "./model";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const gogoplay: SourceRetriever = {
    name: "Gogoplay-streaming",
    validate: (url) => url.includes("/streaming.php"),
    async fetch(url, options) {
        try {
            const headers = Object.assign(defaultHeaders(), {
                Referer: url,
            });

            const unparsed = await options.http.get(
                functions.encodeURI(url.replace("streaming.php", "ajax.php")),
                {
                    headers,
                    timeout: constants.http.maxTimeout,
                }
            );

            const currentData = JSON.parse(unparsed);
            let sources: any[] = [];
            Array.isArray(currentData.source) &&
                sources.push(...currentData.source);
            Array.isArray(currentData.source_bk) &&
                sources.push(...currentData.source_bk);

            const results: AnimeExtractorDownloadResult[] = [];
            sources.forEach((src: any) => {
                if (src.file) {
                    const result: AnimeExtractorDownloadResult = {
                        quality: src.label || "unknown",
                        url: src.file,
                        type: ["downloadable"],
                        headers,
                    };

                    if (!result.url.includes(".m3u8")) {
                        result.type.push("streamable");
                    }

                    results.push(result);
                }
            });

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default gogoplay;
