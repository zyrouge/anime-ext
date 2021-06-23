import qs from "qs";
import cheerio from "cheerio";
import {
    MangaExtractorConstructorOptions,
    MangaExtractorValidateResults,
    MangaExtractorSearchResult,
    MangaExtractorModel,
    MangaExtractorChapterResult,
    MangaExtractorInfoResult,
    MangaExtractorChapterPagesResult,
} from "./model";
import { constants, functions } from "../../util";

export const config = {
    baseUrl: "https://manhwatop.com",
    searchUrl: (search: string) =>
        `https://manhwatop.com/?s=${search}&post_type=wp-manga&op=&author=&artist=&release=&adult=`,
    mangaRegex: /^https:\/\/manhwatop\.com\/manga\/.*/,
    chapterRegex: /^https:\/\/manhwatop\.com\/manga\/.*?\/.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Manhwatop.com Extractor
 */
export default class MangaDex implements MangaExtractorModel {
    name = "Manhwatop.com";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Manhwatop.com URL
     * @param url Manhwatop.com URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * Manhwatop.com Search
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            const url = config.searchUrl(terms);
            this.options.logger?.debug?.(`(${this.name}) Search URL: ${url}`);

            const data = await this.options.http.get(functions.encodeURI(url), {
                credentials: true,
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: MangaExtractorSearchResult[] = [];
            $(".tab-content-wrap .c-tabs-item__content").each(function () {
                const ele = $(this);

                const title = ele.find(".post-title a");
                const url = title.attr("href");
                const image = ele.find("img").attr("data-src");
                const latest = ele.find(".latest-chap .chapter");

                if (url) {
                    results.push({
                        title: `${title.text().trim()} (Latest ${latest
                            .text()
                            .trim()})`,
                        url,
                        thumbnail: image || "",
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
     * Get chapter URLs from Manhwatop.com URL
     * @param url Manhwatop.com chapter URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Chapter links requested for: ${url}`
            );

            const idata = await this.options.http.get(
                functions.encodeURI(url),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const i$ = cheerio.load(idata);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const furtherRaw = i$("#wp-manga-js-extra")
                .html()
                ?.trim()
                .match(/({.*})/)?.[1];
            if (!furtherRaw) throw new Error("No information could be parsed");

            const furtherData = JSON.parse(furtherRaw);
            if (!furtherData.ajax_url || !furtherData.manga_id)
                throw new Error("No information could be parsed");

            const fdata = await this.options.http.post(
                furtherData.ajax_url,
                qs.stringify({
                    action: "manga_get_chapters",
                    manga: furtherData.manga_id,
                }),
                {
                    headers: Object.assign(config.defaultHeaders(), {
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                        "x-requested-with": "XMLHttpRequest",
                    }),
                    timeout: constants.http.maxTimeout,
                }
            );

            const f$ = cheerio.load(fdata);
            const chapters: MangaExtractorChapterResult[] = [];
            f$(".listing-chapters_wrap .wp-manga-chapter a").each(function () {
                const ele = f$(this);

                const title = ele.text().trim();
                const url = ele.attr("href");

                if (url) {
                    chapters.push({
                        title,
                        url,
                        volume: "",
                        chapter: title.match(/\d+/)?.[0] || "",
                    });
                }
            });

            const result: MangaExtractorInfoResult = {
                title: i$(".post-title h1").text().trim(),
                thumbnail: i$(".summary_image img").attr("src") || "",
                chapters,
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
     * Get page image URLs from Manhwatop.com page URL
     * @param url Manhwatop.com page URL
     */
    async getChapterPages(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);

            const result: MangaExtractorChapterPagesResult = {
                type: "image_urls",
                entities: [],
                headers: {
                    Referer: config.baseUrl,
                },
            };

            $(".reading-content .page-break img").each(function () {
                const ele = $(this);

                const page = ele.attr("id")?.match(/\d+/)?.[0];
                const url = ele.attr("data-src");
                const ignore =
                    ele.attr("alt")?.trim() === "Follow ManhwaTop.Com";
                if (!ignore && url) {
                    result.entities.push({
                        page: page || "-",
                        url: url.trim(),
                    });
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of pages resolved after fetching: ${result.entities.length} (${url})`
            );

            return result;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
