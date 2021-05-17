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
import GogoParser from "../parsers/gogoplay-iframe";
import { getExtractor } from "../sources";
import { constants } from "../../util";

export const config = {
    baseUrl: "https://gogo-stream.com",
    searchUrl: (search: string) =>
        `https://gogo-stream.com/search.html?keyword=${search}`,
    animeRegex: /^https:\/\/Gogostream\.to\/anime\/.*/,
    episodeRegex: /^https:\/\/Gogostream\.to\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Gogostream Extractor
 */
export default class Gogostream implements AnimeExtractorModel {
    name = "Gogostream";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate Gogostream URL
     * @param url Gogostream URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Gogostream Search
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            terms = terms.split(" ").join("+");
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

            const list = $(".listing.items .video-block a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${list.length} (${url})`
            );

            list.each(function () {
                const ele = $(this);

                const title = ele.find(".name");
                const url = ele.attr("href");
                const thumbnail = ele.find("img").attr("src");
                const air = ele.find(".date");

                if (url) {
                    results.push({
                        title: title.text().trim(),
                        url: `${config.baseUrl}${url.trim()}`,
                        thumbnail: thumbnail?.trim(),
                        air: new Date(air.text().trim())
                            .toLocaleDateString()
                            .replace(/\//g, "-"),
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
     * Get episode URLs from Gogostream URL
     * @param url Gogostream anime URL
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

            const links = $(".video-info-left .listing.items a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const ele = $(this);

                const episode = ele.find(".name");
                const url = ele.attr("href");

                if (url) {
                    const ep = episode.text().trim().match(/\d+$/)?.[0];
                    results.push({
                        episode: ep ? +ep : "unknown",
                        url: `${config.baseUrl}${url.trim()}`,
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
     * Get download URLs from Gogostream episode URL
     * @param url Gogostream episode URL
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

            let iframeUrl = $(".play-video iframe").attr("src");
            if (!iframeUrl)
                throw new Error(`Could not find download urls for: ${url}`);

            const results: AnimeExtractorDownloadResult[] = [];

            if (!iframeUrl.startsWith("http")) iframeUrl = `https:${iframeUrl}`;
            const sources = await GogoParser(iframeUrl);
            for (const src of sources) {
                const extractor = getExtractor(src);
                if (extractor) {
                    try {
                        const res = await extractor.fetch(src);
                        results.push(...res);
                    } catch (err) {
                        this.options.logger?.debug?.(
                            `(${this.name}) Could not parse download source: ${src} (${url})`
                        );
                    }
                }

                results.push({
                    quality: "unknown",
                    url: src,
                    type: ["external_embed"],
                    headers: config.defaultHeaders(),
                });
            }

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
