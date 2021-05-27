import cheerio, { Cheerio, Element } from "cheerio";
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
    baseUrl: "https://kawaiifu.com",
    searchUrl: (search: string) =>
        `https://kawaiifu.com/search-movie?keyword=${search}`,
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
 * Kawaiifu.com Extractor
 */
export default class TenshiDotMoe implements AnimeExtractorModel {
    name = "Kawaiifu.com";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Kawaiifu.com URL
     * @param url Kawaiifu.com URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Kawaiifu.com Search
     * @param terms Kawaiifu.com term
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
            $(".today-update .item").each(function () {
                const ele = $(this);

                const thumb = ele.find(".thumb");
                const url = thumb.attr("href");
                const thumbnail = thumb.find("img").attr("src");
                const [cat, title] = ele.find(".info a").map(function () {
                    return $(this);
                });

                if (title && url) {
                    results.push({
                        title: title.text().trim(),
                        url,
                        thumbnail: thumbnail || "",
                        air: cat ? cat.text().trim().slice(1, -1) : "unknown",
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
     * Get episode URLs from Kawaiifu.com URL
     * @param url Kawaiifu.com anime URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const sdata = await this.options.http.get(
                functions.encodeURI(url),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const s$ = cheerio.load(sdata);

            let server: string | undefined;
            s$(".list-server a").each(function () {
                const ele = s$(this);

                if (ele.css("display") !== "block") {
                    const url = ele.attr("href");
                    if (url) {
                        server = url;
                        return false;
                    }
                }
            });
            if (!server)
                throw new Error(`Could not parse episodes url for: ${url}`);

            const edata = await this.options.http.get(server, {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const e$ = cheerio.load(edata);
            let eplist: Cheerio<Element> | undefined;
            e$(".list-ep").each(function () {
                const ele = e$(this);

                if (ele.css("display") !== "block") {
                    eplist = ele;
                    return false;
                }
            });
            if (!eplist)
                throw new Error(`Could not parse episodes url for: ${url}`);

            const episodes: AnimeExtractorEpisodeResult[] = [];
            eplist.find("a").each(function () {
                const ele = e$(this);

                const url = ele.attr("href");
                if (url) {
                    episodes.push({
                        episode: ele.text().trim() || "unknown",
                        url,
                    });
                }
            });

            const result: AnimeExtractorInfoResult = {
                title:
                    s$(".desc h2.title").text().trim() ||
                    s$(".desc .sub-title").text().trim(),
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
     * Get download URLs from Kawaiifu.com episode URL
     * @param url Kawaiifu.com episode URL
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

            const video = $(".player source");
            const src = video.attr("src");
            if (!src)
                throw new Error(`Could not find download url for: ${url}`);

            const result: AnimeExtractorDownloadResult = {
                quality: video.attr("data-quality") || "unknown",
                url: src,
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
