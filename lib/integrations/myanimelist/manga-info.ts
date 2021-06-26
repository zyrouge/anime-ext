import cheerio from "cheerio";
import { Logger, Requester } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "MyAnimeList-manga-info",
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface InfoOptions {
    logger?: Partial<Logger>;
    http: Requester;
}

export interface CharacterEntity {
    name: string;
    url: string;
    image: string;
    role: string;
}

export interface StaffEntity {
    name: string;
    url: string;
    image: string;
    role: string;
}

export interface RecommendationEntity {
    title: string;
    url: string;
    thumbnail: string;
}

export interface InfoResult {
    title: string;
    synopsis: string;
    image: string;
    stats: {
        score: string;
        rank: string;
        popularity: string;
    };
    members: string;
    season: string;
    info: {
        type: string;
        episodes: string;
        status: string;
        aired: string;
        premiered: string;
        broadcast: string;
        producers: string;
        licensors: string;
        studios: string;
        source: string;
        genres: string;
        duration: string;
        rating: string;
    };
    characters: CharacterEntity[];
    recommendations: RecommendationEntity[];
}

/**
 * MyAnimeList.com Manga Information
 */
const search = async (url: string, options: InfoOptions) => {
    try {
        options.logger?.debug?.(
            `(${config.name}) Manga info requested: ${url}!`
        );

        const data = await options.http.get(functions.encodeURI(url), {
            headers: config.defaultHeaders(),
            timeout: constants.http.maxTimeout,
        });

        const $ = cheerio.load(data);
        options.logger?.debug?.(
            `(${config.name}) DOM creation successful! (${url})`
        );

        const information: any = {};
        $("h2:contains('Information')")
            .nextUntil("h2")
            .each(function () {
                const ele = $(this);

                const key = $(ele.find("span")[0]).text().trim();
                let val = "";

                const links = ele.find("a");
                if (links.length) {
                    let contents: string[] = [];
                    links.each(function () {
                        const cont = $(this);
                        contents.push(cont.text().trim());
                    });
                    if (contents.length) val = contents.join(", ");
                }
                if (!val) val = ele.text().trim().replace(key, "").trim();

                if (key.length > 1 && val) {
                    information[key.slice(0, -1).toLowerCase()] = val;
                }
            });

        const [charactersTable, staffTable] = $(".detail-characters-list").map(
            function () {
                return $(this);
            }
        );

        const characters: CharacterEntity[] = [];
        charactersTable?.find("> div > table > tbody > tr").each(function () {
            const ele = $(this);
            const [charImg, charInfo] = ele
                .find("> td")
                .map(function () {
                    return $(this);
                })
                .toArray();

            const name = charInfo?.find("a");
            if (name) {
                characters.push({
                    name: name.text().trim(),
                    url: name.attr("href") || "",
                    image: charImg?.find("img").attr("data-src") || "",
                    role: charInfo?.find("small").text().trim() || "",
                });
            }
        });

        const recommendations: RecommendationEntity[] = [];
        $("#manga_recommendation li.btn-anime a").each(function () {
            const ele = $(this);

            recommendations.push({
                title: ele.find(".title").text().trim(),
                url: ele.attr("href") || "",
                thumbnail: ele.find("img").attr("data-src") || "",
            });
        });

        const stats = $(".stats-block");

        const result: InfoResult = {
            title: $(".h1-title > span").contents().first().text().trim(),
            synopsis: $("[itemprop='description']").text().trim(),
            image: $("#contentWrapper img").attr("data-src") || "",
            stats: {
                score: stats.find(".score").text().trim(),
                rank: stats.find(".ranked strong").text().trim(),
                popularity: stats.find(".popularity strong").text().trim(),
            },
            members: stats.find(".members strong").text().trim(),
            season: stats.find(".season").text().trim(),
            info: information,
            characters,
            recommendations,
        };

        return result;
    } catch (err) {
        options.logger?.debug?.(
            `(${config.name}) Failed to parse: ${err?.message}!`
        );

        throw new Error(`Something went wrong: ${err?.message}!`);
    }
};

export default search;
