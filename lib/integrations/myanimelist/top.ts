import axios from "axios";
import cheerio from "cheerio";
import { Logger } from "../../types";
import { constants } from "../../util";

export const config = {
    name: "MyAnimeList-search",
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

            const rank = ele.find(".rank").text().trim();
            const titleEle = ele.find(".title h3 a");

            const title = titleEle.text().trim();
            const url = titleEle.attr("href");
            if (!url) return;

            const score = ele.find(".score").text().trim();
            const [series, run] = ele
                .find(".information")
                .text()
                .trim()
                .split("\n")
                .map((x) => x.trim());

            results.push({
                rank,
                title,
                url,
                score,
                series: series || "-",
                run: series || "-",
            });
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
