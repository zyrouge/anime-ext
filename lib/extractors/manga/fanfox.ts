import cheerio from "cheerio";
import {
    MangaExtractorConstructorOptions,
    MangaExtractorValidateResults,
    MangaExtractorSearchResult,
    MangaExtractorModel,
    MangaExtractorChapterResult,
    MangaExtractorInfoResult,
    MangaExtractorChapterPagesResult,
    MangaExtractorPageImageResult,
} from "./model";
import { constants, functions } from "../../util";

export const config = {
    baseUrl: "https://fanfox.net",
    searchUrl: (search: string) => `https://fanfox.net/search?title=${search}`,
    mangaRegex: /^https:\/\/fanfox\.net\/manga.*/,
    chapterRegex: /^https:\/\/fanfox\.net\/manga.*?\/\d+\.html$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
            Cookie: "isAdult=1;",
        };
    },
};

/**
 * FanFox.net Extractor
 */
export default class FanFox implements MangaExtractorModel {
    name = "FanFox.net";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate FanFox.net URL
     * @param url FanFox.net URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * FanFox.net Search
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
            $(".line-list li").each(function () {
                const ele = $(this);

                const title = ele.find(".manga-list-4-item-title a");
                const url = title.attr("href");
                const image = ele.find("img").attr("src");
                const latestChap = ele
                    .find(".manga-list-4-item-tip:contains('Latest Chapter:')")
                    .text()
                    .trim();

                if (url) {
                    let append = "";

                    if (latestChap)
                        append += ` (Latest Chapter: ${latestChap.replace(
                            /^Latest Chapter\:/,
                            ""
                        )})`;

                    results.push({
                        title: `${title.text().trim()}${append}`,
                        url: `${config.baseUrl}${url.trim()}`,
                        image: image?.trim() || "",
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
     * Get chapter URLs from FanFox.net URL
     * @param url FanFox.net chapter URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Chapter links requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const chapters: MangaExtractorChapterResult[] = [];
            $("#chapterlist li a").each(function () {
                const ele = $(this);

                const title = ele.find(".title3").text().trim();
                const url = ele.attr("href");

                if (url) {
                    const shortTitle = title.match(/-(.*)/)?.[1];
                    const vol = title.match(/Vol.(\d+)/)?.[1];
                    const chap = title.match(/Ch.([\d.]+)/)?.[1];

                    chapters.push({
                        title: shortTitle?.trim() || title,
                        volume: vol?.trim() || "-",
                        chapter: chap?.trim() || "-",
                        url: `${config.baseUrl}${url.trim()}`,
                    });
                }
            });

            const result: MangaExtractorInfoResult = {
                title: $(".detail-info-right-title-font").text().trim(),
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
     * Get page image URLs from FanFox.net page URL
     * @param url FanFox.net page URL
     */
    async getChapterPages(url: string) {
        try {
            url = url.replace(/https?:\/\/fanfox/, "https://m.fanfox");

            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);

            const result: MangaExtractorChapterPagesResult = {
                type: "page_urls",
                entities: [],
            };

            $("select.mangaread-page")
                .first()
                .find("option")
                .each(function () {
                    const ele = $(this);

                    let url = ele.val();
                    if (typeof url === "string") {
                        if (!url.startsWith("http")) url = `https:${url}`;

                        result.entities.push({
                            page: ele.text().trim(),
                            url,
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

    /**
     * Get page image URLs from FanFox.net page URL
     * @param url FanFox.net page URL
     */
    async getPageImage(url: string) {
        try {
            url = url.replace(/https?:\/\/fanfox/, "https://m.fanfox");

            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const page = data
                .match(/<option.*?selected=.*?>(.*?)<\/option>/)?.[1]
                ?.trim();
            const image = data
                .match(/<img src="(.*?)".*id="image".*>/)?.[1]
                ?.trim();
            if (!page || !image) throw new Error("No images were found");

            const result: MangaExtractorPageImageResult = {
                page,
                image,
            };

            return result;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
