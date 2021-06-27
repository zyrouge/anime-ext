import cheerio from "cheerio";
import { URLSearchParams } from "url";
import { Requester } from "../../types";
import { constants, functions } from "../../util";
import { AnimeExtractorDownloadResult } from "../anime/model";
import { getExtractor } from "../sources";
import { SourceRetriever } from "../sources/model";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

export default async (
    url: string,
    options: {
        http: Requester;
    }
) => {
    try {
        const id = url
            .split(/(\?|&)id=/)
            .pop()
            ?.split("&")[0];
        if (!id) return [];

        const data = await options.http
            .get(
                functions.encodeURI(
                    `https://gogo-stream.com/download?id=${id}`
                ),
                {
                    headers: Object.assign(defaultHeaders(), {
                        Referer: url,
                    }),
                    timeout: constants.http.maxTimeout,
                }
            )
            .catch(async () => {
                return null;
            });
        if (!data) return [];

        const $ = cheerio.load(data);
        const items = $(".dowload a");

        const urls: AnimeExtractorDownloadResult[] = [];
        const sources: SourceRetriever["fetch"][] = [];

        items.each(function () {
            const ele = $(this);

            const url = ele.attr("href");
            if (url) {
                if (
                    /.*\.(mov|avi|wmv|flv|3gp|mp4|mpg)$/.test(url) &&
                    !url.includes("streamtape.com")
                ) {
                    urls.push({
                        quality:
                            ele.text().match(/\([A-Za-z0-9]+/)?.[1] ||
                            "unknown",
                        type: ["streamable", "downloadable"],
                        url,
                    });
                } else if (url.includes("/download.php")) {
                    urls.push({
                        quality:
                            ele.text().match(/\([A-Za-z0-9]+/)?.[1] ||
                            "unknown",
                        type: ["downloadable"],
                        url,
                    });
                } else {
                    const extractor = getExtractor(url);
                    if (extractor) {
                        sources.push(
                            extractor.fetch.bind(extractor, url, options)
                        );
                    }
                }
            }
        });

        for (const ext of sources) {
            const res = await ext(url, options);
            urls.push(...res);
        }

        return urls;
    } catch (err) {
        throw err;
    }
};
