import cheerio from "cheerio";
import { Logger, Requester } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "AniDB-season",
    origin: "https://anidb.net",
    baseUrl: "https://anidb.net/anime/schedule/",
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
    image: string;
    info: string;
}

export interface SeasonResult {
    date: string;
    entities: AnimeEntity[];
}

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

        const results: SeasonResult[] = [];
        $(".g_section.content > h2").each(function () {
            const heading = $(this);

            const animes: SeasonResult = {
                date: heading.text().trim(),
                entities: [],
            };

            heading
                .nextUntil("h2")
                .find("> .schedule")
                .each(function () {
                    const ele = $(this);

                    const link = ele.find(".thumb a");
                    const img = link.find("img").attr("src");
                    const url = link.attr("href");
                    const title = ele.find(".data .name a").text().trim();
                    const ep = ele.find(".data .ep").text().trim();

                    if (url && title) {
                        animes.entities.push({
                            name: title,
                            url: `${config.origin}${url}`,
                            image: img || "",
                            info: ep,
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

export default season;
