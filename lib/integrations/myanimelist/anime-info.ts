import axios from "axios";
import cheerio from "cheerio";
import { Logger } from "../../types";
import { constants, functions } from "../../util";

export const config = {
    name: "MyAnimeList-anime-info",
    baseUrl: (terms: string) =>
        `https://myanimelist.net/anime.php?q=${terms}&cat=anime`,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface InfoOptions {
    logger?: Partial<Logger>;
}

export interface CharacterEntity {
    name: string;
    url: string;
    image: string;
    role: string;
    actor?: {
        name: string;
        url: string;
        image: string;
        language: string;
    };
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
    staffs: StaffEntity[];
    recommendations: RecommendationEntity[];
}

const search = async (url: string, options: InfoOptions = {}) => {
    try {
        options.logger?.debug?.(
            `(${config.name}) Anime info requested: ${url}!`
        );

        const { data } = await axios.get<string>(functions.encodeURI(url), {
            headers: config.defaultHeaders(),
            responseType: "text",
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
            const [charImg, charInfo, actorInfoCont] = ele
                .find("> td")
                .map(function () {
                    return $(this);
                })
                .toArray();

            const name = charInfo?.find("a");

            const [actorInfo, actorImg] =
                actorInfoCont
                    ?.find("td")
                    .map(function () {
                        return $(this);
                    })
                    .toArray() || [];

            const actorName = actorInfo?.find("a");

            if (name) {
                characters.push({
                    name: name.text().trim(),
                    url: name.attr("href") || "",
                    image: charImg?.find("img").attr("data-src") || "",
                    role: charInfo?.find("small").text().trim() || "",
                    actor: actorName
                        ? {
                              name: actorName.text().trim(),
                              url: actorName.attr("href") || "",
                              image:
                                  actorImg?.find("img").attr("data-src") || "",
                              language:
                                  actorInfo?.find("small").text().trim() || "",
                          }
                        : undefined,
                });
            }
        });

        const staffs: StaffEntity[] = [];
        staffTable?.find("tr").each(function () {
            const ele = $(this);
            const [staffImg, staffInfo] = ele
                .find("td")
                .map(function () {
                    return $(this);
                })
                .toArray();

            const name = staffInfo?.find("a");

            if (name) {
                staffs.push({
                    name: name.text().trim(),
                    url: name.attr("href") || "",
                    image: staffImg?.find("img").attr("data-src") || "",
                    role: staffInfo?.find("small").text().trim() || "",
                });
            }
        });

        const recommendations: RecommendationEntity[] = [];
        $("#anime_recommendation li.btn-anime a").each(function () {
            const ele = $(this);

            recommendations.push({
                title: ele.find(".title").text().trim(),
                url: ele.attr("href") || "",
                thumbnail: ele.find("img").attr("data-src") || "",
            });
        });

        const stats = $(".stats-block");

        const result: InfoResult = {
            title: $(".title-name strong").text().trim(),
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
            staffs,
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
