import cheerio from "cheerio";
import { Logger, Requester } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "MyAnimeList-schedule",
    baseUrl: "https://myanimelist.net/anime/season/schedule",
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface ScheduleOptions {
    logger?: Partial<Logger>;
    http: Requester;
}

export interface AnimeEntity {
    name: string;
    url: string;
    image: string;
    episode: string;
    description: string;
    type: string;
    genre: string[];
    date: string;
    score: string;
}

export interface ScheduleResult {
    date: string;
    entities: AnimeEntity[];
}

/**
 * MyAnimeList.com Anime Schedule
 */
const schedule = async (options: ScheduleOptions) => {
    try {
        options.logger?.debug?.(
            `(${config.name}) Schedule url: ${config.baseUrl}!`
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

        const results: ScheduleResult[] = [];
        $(".seasonal-anime-list").each(function () {
            const container = $(this);

            const animes: ScheduleResult = {
                date: container.find(".anime-header").text().trim(),
                entities: [],
            };

            container.find(".seasonal-anime").each(function () {
                const ele = $(this);

                const link = ele.find(".link-title");
                const title = link.text().trim();
                const url = link.attr("href");
                const img =
                    ele.find("img").attr("src") ||
                    ele.find("img").attr("data-src");
                const ep = ele.find(".eps").text().trim();
                const description = ele.find(".synopsis").text().trim();
                const type = ele.find(".source").text().trim();
                const genre = ele
                    .find(".genre")
                    .map(function () {
                        return $(this).text().trim();
                    })
                    .toArray();
                const date = ele.find(".remain-time").text().trim();
                const score = ele.find(".score").text().trim();

                if (url && title) {
                    animes.entities.push({
                        name: title,
                        url,
                        image: img || "",
                        episode: ep,
                        description,
                        type,
                        genre,
                        date,
                        score,
                    });
                }
            });

            results.push(animes);
        });

        options.logger?.debug?.(
            `(${config.name}) No. of links parsed: ${results.length} (${config.baseUrl})`
        );

        return results;
    } catch (err) {
        options.logger?.debug?.(
            `(${config.name}) Failed to parse: ${err?.message}!`
        );

        throw new Error(`Something went wrong: ${err?.message}!`);
    }
};

export default schedule;
