import axios from "axios";
import cheerio from "cheerio";
import { Logger } from "../../types";
import { constants } from "../../util";

export const config = {
    name: "MyAnimeList-top",
    baseUrl: (type?: string) =>
        `https://myanimelist.net/topanime.php${
            type && type !== "all" ? `?type=${type}` : ""
        }`,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

export interface SearchOptions {
    logger?: Partial<Logger>;
}

export const TopAnimeTypes = [
    "airing",
    "upcoming",
    "tv",
    "movie",
    "ova",
    "ona",
    "special",
    "bypopularity",
    "favorite",
] as const;
export type TopAnimeTypesType = typeof TopAnimeTypes[number];

export interface TopResult {
    rank: string;
    title: string;
    url: string;
    score: string;
    series: string;
    run: string;
    image: string;
}

const top = async (
    type: TopAnimeTypesType | "all",
    options: SearchOptions = {}
) => {
    try {
        options.logger?.debug?.(
            `(${config.name}) Requested animes in ${type} category!`
        );

        const url = config.baseUrl(encodeURIComponent(type));
        options.logger?.debug?.(`(${config.name}) Top animes url: ${url}!`);

        const { data } = await axios.get<string>(url, {
            headers: config.defaultHeaders(),
            responseType: "text",
            timeout: constants.http.maxTimeout,
        });

        const $ = cheerio.load(data);
        options.logger?.debug?.(
            `(${config.name}) DOM creation successful! (${url})`
        );

        const results: TopResult[] = [];
        $(".ranking-list").each(function () {
            const ele = $(this);

            const title = ele.find(".title h3 a");
            const url = title.attr("href");
            const [series, run] = ele
                .find(".information")
                .text()
                .trim()
                .split("\n")
                .map((x) => x.trim());

            if (url) {
                results.push({
                    rank: ele.find(".rank").text().trim(),
                    title: title.text().trim(),
                    url,
                    score: ele.find(".score").text().trim(),
                    series: series || "-",
                    run: run || "-",
                    image: ele.find("img").attr("data-src")?.trim() || "",
                });
            }
        });

        options.logger?.debug?.(
            `(${config.name}) No. of anime links parsed: ${results.length} (${url})`
        );

        return results;
    } catch (err) {
        options.logger?.debug?.(
            `(${config.name}) Failed to parse: ${err?.message}!`
        );

        throw new Error(`Something went wrong: ${err?.message}!`);
    }
};

export default top;
