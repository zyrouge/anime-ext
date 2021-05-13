import axios from "axios";
import cheerio from "cheerio";
import {
    ExtractorConstructorOptions,
    ExtractorSearchResult,
    ExtractorEpisodeResult,
    ExtractorDownloadResult,
    ExtractorModel,
} from "./model";
import { constants } from "../util";

export const config = {
    base: "https://4anime.to/",
    search: "?s=",
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.base,
        };
    },
};

/**
 * 4Anime Extractor
 */
export default class FourAnime implements ExtractorModel {
    name = "4anime";
    options: ExtractorConstructorOptions;

    constructor(options: ExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * 4Anime Search (avoid using this)
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            terms = terms.split(" ").join("+");
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            const url = `${config.base}${config.search}${encodeURIComponent(
                terms
            )}`;
            this.options.logger?.debug?.(`(${this.name}) Search URL: ${url}`);

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: ExtractorSearchResult[] = [];

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
                `(${this.name}) Failed to scrape 4anime: ${err}`
            );

            throw new Error("Failed to scrape 4anime!");
        }
    }

    /**
     * Get episode URLs from 4Anime URL
     * @param url Anime URL
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

            const links = $(".episodes a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const title = $(this);
                const url = title.attr("href");

                if (url) {
                    results.push({
                        episode: +title.text().trim(),
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
                `(${this.name}) Failed to scrape 4anime: ${err}`
            );

            throw new Error("Failed to scrape 4anime!");
        }
    }

    /**
     * Get download URLs from 4Anime episode URL
     * @param url Episode URL
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

            const src = $("source").attr("src");
            if (!src)
                throw new Error(`Could not find download url for: ${url}`);

            const result: ExtractorDownloadResult = {
                quality: src.match(/([\w\d]+)\.[\w\d]+$/)?.[1] || "unknown",
                url: src.trim(),
            };

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape 4anime: ${err}`
            );

            throw new Error("Failed to scrape 4anime!");
        }
    }
}
