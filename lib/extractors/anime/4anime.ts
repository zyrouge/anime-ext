import axios from "axios";
import cheerio from "cheerio";
import {
    AnimeExtractorConstructorOptions,
    AnimeExtractorValidateResults,
    AnimeExtractorSearchResult,
    AnimeExtractorEpisodeResult,
    AnimeExtractorDownloadResult,
    AnimeExtractorModel,
} from "./model";
import { constants } from "../../util";

export const config = {
    baseUrl: "https://4anime.to",
    searchUrl: (search: string) => `https://4anime.to/?s=${search}`,
    animeRegex: /^https:\/\/4anime\.to\/anime\/.*/,
    episodeRegex: /^https:\/\/4anime\.to\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * 4Anime Extractor
 */
export default class FourAnime implements AnimeExtractorModel {
    name = "4anime";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate 4Anime URL
     * @param url 4Anime URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * 4Anime Search (avoid using this)
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            const url = config.searchUrl(encodeURIComponent(terms));
            this.options.logger?.debug?.(`(${this.name}) Search URL: ${url}`);

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorSearchResult[] = [];

            const links = $(".container a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const ele = $(this);

                const title = ele.find("div");
                const url = ele.attr("href");
                const thumbnail = ele.find("img").attr("src");
                const air = ele.find("span");

                if (url) {
                    const year = $(air[0]).text().trim() || "unknown";
                    const season = $(air[2]).text().trim() || "unknown";

                    results.push({
                        title: title.text().trim(),
                        url: url.trim(),
                        thumbnail: thumbnail?.trim(),
                        air: `${year} (${season})`,
                    });
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get episode URLs from 4Anime URL
     * @param url 4Anime anime URL
     */
    async getEpisodeLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorEpisodeResult[] = [];

            const links = $(".episodes a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const episode = $(this);
                const url = episode.attr("href");

                if (url) {
                    results.push({
                        episode: +episode.text().trim(),
                        url: url.trim(),
                    });
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get download URLs from 4Anime episode URL
     * @param url 4Anime episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const src = $("source").attr("src");
            if (!src)
                throw new Error(`Could not find download url for: ${url}`);

            const result: AnimeExtractorDownloadResult = {
                quality: src.match(/([\w\d]+)\.[\w\d]+$/)?.[1] || "unknown",
                url: src.trim(),
                type: ["downloadable", "streamable"],
                headers: config.defaultHeaders(),
            };

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: 1 (${url})`
            );

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
