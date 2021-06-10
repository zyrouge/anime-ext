import cheerio from "cheerio";
import { Logger, Requester } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "AniDB-season",
    origin: "https://anidb.net",
    baseUrl: "https://anidb.net/anime/season/",
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
}

export interface SeasonResult {
    season: string;
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

        const results: SeasonResult = {
            season: $(".g_section.content h2").text().trim(),
            entities: [],
        };

        $(".g_bubblewrap.g_bubble.container .g_bubble.box").each(function () {
            const ele = $(this);

            const link = ele.find(".thumb a");
            const img = link.find("img").attr("src");
            const title = ele.find(".data .name");
            const date = ele.find(".data .date");
            const description = ele.find(".data .desc");
            const type = ele.find(".data .general");
            const tags = ele.find(".data .tags .tagname");
            const url = link.attr("href");

            if (url && title) {
                results.entities.push({
                    name: title.text().trim(),
                    url: `${config.origin}${url}`,
                    description: description.text().trim(),
                    image: img?.trim() || "",
                    type: type.text().trim(),
                    date: date.text().trim(),
                    tags: tags
                        .map(function () {
                            return $(this).text().trim();
                        })
                        .toArray(),
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
