import axios from "axios";
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
    baseUrl: "https://simply.moe",
    searchUrl: (search: string) => `https://simply.moe/?s=${search}`,
    animeRegex: /^https:\/\/simply\.moe\/anime\/.*/,
    episodeRegex: /^https:\/\/simply.moe\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Simply.moe Extractor
 */
export default class SimplyDotMoe implements AnimeExtractorModel {
    name = "Simply.moe";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate Simply.moe URL
     * @param url Simply.moe URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

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

        const results: AnimeExtractorSearchResult[] = [];
        return results;
    }

    /**
     * Get episode URLs from Simply.moe URL
     * @param url Simply.moe anime URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const { data } = await axios.get<string>(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const episodes: AnimeExtractorEpisodeResult[] = [];
            $(".episodez.range a").each(function () {
                const episode = $(this);
                const url = episode.attr("href");

                if (url) {
                    episodes.push({
                        episode: +episode.text().trim(),
                        url: url.trim(),
                    });
                }
            });

            const result: AnimeExtractorInfoResult = {
                title: $(".info-container .title").text().trim(),
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
     * Get download URLs from Simply.moe episode URL
     * @param url Simply.moe episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const { data } = await axios.get<string>(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const link = $(".opt-download a").attr("href");
            if (!link)
                throw new Error(`Could not find download url for: ${url}`);

            const result: AnimeExtractorDownloadResult = {
                quality: link.match(/([\w\d]+)\.[\w\d]+$/)?.[1] || "unknown",
                url: link.trim(),
                type: ["downloadable", "streamable"],
                headers: config.defaultHeaders(),
            };

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
