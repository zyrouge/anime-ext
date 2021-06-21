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
    baseUrl: "https://tenshi.moe",
    searchUrl: (search: string) => `https://tenshi.moe/anime?q=${search}`,
    animeRegex: /^https:\/\/tenshi\.moe\/anime\/.*/,
    episodeRegex: /^https:\/\/tenshi\.moe\/anime\/.*\/.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Tenshi.moe Extractor
 * @deprecated No more returns download links
 */
export default class TenshiDotMoe implements AnimeExtractorModel {
    name = "Tenshi.moe";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Tenshi.moe URL
     * @param url Tenshi.moe URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Tenshi.moe Search
     * @param terms Tenshi.moe term
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
            $(".anime-loop li > a").each(function () {
                const ele = $(this);

                const title = ele.find(".text-primary");
                const url = ele.attr("href");
                const thumbnail = ele.find("img").attr("src");

                if (url) {
                    let aired = [];

                    const year = ele.find(".year").text().trim();
                    if (year) aired.push(year);

                    const type = ele.find(".type").text().trim();
                    if (type) aired.push(type);

                    results.push({
                        title: title.text().trim(),
                        url: url.trim(),
                        thumbnail: thumbnail?.trim() || "",
                        air: aired.length ? aired.join(" ") : "unknown",
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
     * Get episode URLs from Tenshi.moe URL
     * @param url Tenshi.moe anime URL
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
            $(".episode-loop li > a").each(function () {
                const ele = $(this);

                const episode = ele
                    .find(".episode-number")
                    .text()
                    .replace("Episode", "")
                    .trim();
                const url = ele.attr("href");

                if (url) {
                    episodes.push({
                        episode: episode || "unknown",
                        url,
                    });
                }
            });

            const result: AnimeExtractorInfoResult = {
                title: $(".entry-header").text().trim(),
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
     * Get download URLs from Tenshi.moe episode URL
     * @param url Tenshi.moe episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const preData = await this.options.http.get(
                functions.encodeURI(url),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );
            const iframe = preData.match(/<iframe src="(.*?)"/)?.[1];
            if (!iframe) {
                this.options.logger?.error?.(
                    `(${this.name}) No embeds were found`
                );

                throw new Error("No embeds were found");
            }

            const data = await this.options.http.get(
                functions.encodeURI(iframe),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );
            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorDownloadResult[] = [];
            $("#player source").each(function () {
                const ele = $(this);

                const src = ele.attr("src");
                const quality = ele.attr("title");

                if (src) {
                    results.push({
                        quality: quality || "unknown",
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
