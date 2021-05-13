import axios from "axios";
import cheerio from "cheerio";
import {
    ExtractorConstructorOptions,
    ExtractorValidateResults,
    ExtractorSearchResult,
    ExtractorEpisodeResult,
    ExtractorDownloadResult,
    ExtractorModel,
} from "./model";
import { constants } from "../util";

export const config = {
    baseUrl: "https://simply.moe",
    searchUrl: (search: string) => `https://simply.moe/?s=${search}`,
    animeRegex: /^https:\/\/simply\.moe\/anime\/.*/,
    episodeRegex: /^https:\/\/simply.moe\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
        };
    },
};

/**
 * Simply.moe Extractor
 */
export default class SimplyDotMoe implements ExtractorModel {
    name = "Simply.moe";
    options: ExtractorConstructorOptions;

    constructor(options: ExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate Simply.moe URL
     * @param url Simply.moe URL
     */
    validateURL(url: string) {
        let result: ExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Simply.moe Search (not implemented)
     * @param terms Search term
     */
    async search(terms: string) {
        this.options.logger?.debug?.(
            `(${this.name}) Search for this site is not implemented yet!`
        );

        const results: ExtractorSearchResult[] = [];
        return results;
    }

    /**
     * Get episode URLs from Simply.moe URL
     * @param url Simply.moe anime URL
     */
    async getEpisodeLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: ExtractorEpisodeResult[] = [];

            const links = $(".episodez.range a");
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
                `(${this.name}) Failed to scrape: ${err}`
            );

            throw new Error(`Failed to scrape: ${err}`);
        }
    }

    /**
     * Get download URLs from Simply.moe episode URL
     * @param url Simply.moe episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const link = $(".opt-download a").attr("href");
            if (!link)
                throw new Error(`Could not find download url for: ${url}`);

            const result: ExtractorDownloadResult = {
                quality: link.match(/([\w\d]+)\.[\w\d]+$/)?.[1] || "unknown",
                url: link.trim(),
                type: "downloadable",
            };

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: 1 (${url})`
            );

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err}`
            );

            throw new Error(`Failed to scrape: ${err}`);
        }
    }
}
