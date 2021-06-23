import cheerio from "cheerio";
import {
    AnimeExtractorConstructorOptions,
    AnimeExtractorValidateResults,
    AnimeExtractorSearchResult,
    AnimeExtractorEpisodeResult,
    AnimeExtractorInfoResult,
    AnimeExtractorDownloadResult,
    AnimeExtractorModel,
} from "./model";
import { constants, functions } from "../../util";

export const config = {
    baseUrl: "https://animeparadise.org",
    searchUrl: (search: string) =>
        `https://animeparadise.org/search.php?query=${search}`,
    animeRegex: /^https:\/\/animeparadise\.org\/anime\.php\?.*/,
    episodeRegex: /^https:\/\/animeparadise\.org\/watch\.php\?.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * AnimeParadise.org Extractor
 */
export default class AnimeParadise implements AnimeExtractorModel {
    name = "AnimeParadise.org";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate AnimeParadise.org URL
     * @param url AnimeParadise.org URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * AnimeParadise.org Search
     * @param terms AnimeParadise.org term
     */
    async search(terms: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            const url = config.searchUrl(terms);
            this.options.logger?.debug?.(`(${this.name}) Search URL: ${url}`);

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorSearchResult[] = [];
            $(".media").each(function () {
                const ele = $(this);

                const link = ele.find("a").first();
                const title = link.text().trim();
                const url = link.attr("href");
                const thumbnail = ele.find("img").attr("src");
                const tags = ele
                    .find(".tag")
                    .map(function () {
                        return `(${$(this).text().trim()})`;
                    })
                    .toArray();

                if (url) {
                    results.push({
                        title: `${title}${
                            tags.length ? ` ${tags.join(" ")}` : ""
                        }`,
                        url: `${config.baseUrl}/${url.trim()}`,
                        thumbnail: thumbnail?.trim() || "",
                        air: "unknown",
                    });
                }
            });

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get episode URLs from AnimeParadise.org URL
     * @param url AnimeParadise.org anime URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const episodes: AnimeExtractorEpisodeResult[] = [];
            $(".container > .columns a.box").each(function () {
                const ele = $(this);

                const episode = ele.find(".title").text().trim();
                const url = ele.attr("href");

                if (url) {
                    episodes.push({
                        episode: episode || "unknown",
                        url: `${config.baseUrl}/${url}`,
                    });
                }
            });

            const tags = $(".column > .tag")
                .map(function () {
                    return `(${$(this).text().trim()})`;
                })
                .toArray();
            const result: AnimeExtractorInfoResult = {
                title: `${$(".column strong").text().trim()}${
                    tags.length ? ` ${tags.join(" ")}` : ""
                }`,
                thumbnail: $(".column.is-one-fifth img").attr("src") || "",
                episodes,
            };

            return result;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get download URLs from AnimeParadise.org episode URL
     * @param url AnimeParadise.org episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorDownloadResult[] = [];
            $("video source").each(function () {
                const ele = $(this);

                const src = ele.attr("src");

                if (src) {
                    results.push({
                        quality: "unknown",
                        url: src,
                        type: ["downloadable", "streamable"],
                        headers: config.defaultHeaders(),
                    });
                }
            });

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
