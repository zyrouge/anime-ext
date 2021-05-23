import axios from "axios";
import cheerio from "cheerio";
import { Logger } from "../../types";
import { constants } from "../../util";

export const config = {
    name: "MyAnimeList-search",
    baseUrl: (terms: string) =>
        `https://myanimelist.net/anime.php?q=${terms}&cat=anime`,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface SearchOptions {
    logger?: Partial<Logger>;
}

export interface SearchResult {
    title: string;
    url: string;
    description: string;
    thumbnail: string;
    type: string;
    episodes: string;
    score: string;
}

const search = async (terms: string, options: SearchOptions = {}) => {
    try {
        options.logger?.debug?.(`(${config.name}) Search terms: ${terms}!`);

        const url = config.baseUrl(terms);
        options.logger?.debug?.(`(${config.name}) Search url: ${url}!`);

        const { data } = await axios.get<string>(encodeURI(url), {
            headers: config.defaultHeaders(),
            responseType: "text",
            timeout: constants.http.maxTimeout,
        });

        const $ = cheerio.load(data);
        options.logger?.debug?.(
            `(${config.name}) DOM creation successful! (${url})`
        );

        const items = $(".js-categories-seasonal tr");
        options.logger?.debug?.(
            `(${config.name}) No. of items found: ${items.length} (${url})`
        );

        const results: SearchResult[] = [];

        items.each(function () {
            const ele = $(this);

            const [pic, info, type, eps, score] = ele
                .find("td")
                .map(function () {
                    return $(this);
                });

            const link = pic?.find("a").attr("href");
            const img = pic?.find("img").attr("data-src");
            const title = info?.find("strong");
            const description = info?.find(".pt4");

            if (link && title) {
                results.push({
                    title: title.text().trim(),
                    url: link,
                    description: description?.text().trim() || "",
                    thumbnail: img?.trim() || "",
                    type: type?.text().trim() || "",
                    episodes: eps?.text().trim() || "",
                    score: score?.text().trim() || "",
                });
            }
        });

        options.logger?.debug?.(
            `(${config.name}) No. of links parsed: ${results.length} (${url})`
        );

        return results;
    } catch (err) {
        options.logger?.debug?.(
            `(${config.name}) Failed to parse: ${err?.message}!`
        );

        throw new Error(`Something went wrong: ${err?.message}!`);
    }
};

export default search;
