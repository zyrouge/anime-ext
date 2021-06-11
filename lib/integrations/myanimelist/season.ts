import cheerio from "cheerio";
import { Logger, Requester } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "MyAnimeList-season",
    baseUrl: "https://myanimelist.net/anime/season",
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface SeasonOptions {
    logger?: Partial<Logger>;
    http: Requester;
}

export interface AnimeEntity {
    name: string;
    url: string;
    date: string;
    type: string;
    tags: string[];
    description: string;
    image: string;
    score: string;
    episode: string;
}

export interface SeasonResult {
    season: string;
    entities: AnimeEntity[];
}

/**
 * MyAnimeList.com Anime Season
 */
const season = async (options: SeasonOptions) => {
    try {
        options.logger?.debug?.(
            `(${config.name}) Season url: ${config.baseUrl}!`
        );

        const data = await options.http.get(
            functions.encodeURI(config.baseUrl),
            {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            }
        );

        const $ = cheerio.load(data);
        options.logger?.debug?.(
            `(${config.name}) DOM creation successful! (${config.baseUrl})`
        );

        const results: SeasonResult = {
            season: $(".season_nav .on").text().trim(),
            entities: [],
        };

        $(".seasonal-anime").each(function () {
            const ele = $(this);

            const link = ele.find(".link-title");
            const title = link.text().trim();
            const url = link.attr("href");
            const img =
                ele.find("img").attr("src") || ele.find("img").attr("data-src");
            const date = ele.find(".remain-time").text().trim();
            const description = ele.find(".synopsis").text().trim();
            const type = ele.find(".source").text().trim();
            const tags = ele
                .find(".genre")
                .map(function () {
                    return $(this).text().trim();
                })
                .toArray();
            const score = ele.find(".score").text().trim();
            const ep = ele.find(".eps").text().trim();

            if (url && title) {
                results.entities.push({
                    name: title,
                    url,
                    description,
                    image: img || "",
                    type,
                    date,
                    tags,
                    score,
                    episode: ep,
                });
            }
        });

        options.logger?.debug?.(
            `(${config.name}) No. of links parsed: ${results.entities.length} (${config.baseUrl})`
        );

        return results;
    } catch (err) {
        options.logger?.debug?.(
            `(${config.name}) Failed to parse: ${err?.message}!`
        );

        throw new Error(`Something went wrong: ${err?.message}!`);
    }
};

export default season;
