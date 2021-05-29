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
    MangaExtractorPageImageResult,
} from "./model";
import { constants, functions } from "../../util";

export const config = {
    baseUrl: "https://www.mangainn.net",
    searchUrl: "https://www.mangainn.net/service/advanced_search",
    mangaRegex: /^https:\/\/www\.mangainn\.net\/.*/,
    chapterRegex: /^https:\/\/www\.mangainn\.net\/.*?\/.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
            "x-requested-with": "XMLHttpRequest",
        };
    },
};

/**
 * MangaInn.net Extractor
 */
export default class MangaInn implements MangaExtractorModel {
    name = "Mangainn.net";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate MangaInn.net URL
     * @param url MangaInn.net URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * MangaInn.net Search
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            const data = await this.options.http.post(
                functions.encodeURI(config.searchUrl),
                qs.stringify({
                    type: "all",
                    "manga-name": terms,
                    status: "both",
                }),
                {
                    headers: Object.assign(config.defaultHeaders(), {
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                    }),
                    timeout: constants.http.maxTimeout,
                }
            );

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${config.searchUrl})`
            );

            const results: MangaExtractorSearchResult[] = [];
            $(".row").each(function () {
                const ele = $(this);

                const title = ele.find(".manga-title a");
                const url = title.attr("href");
                const image = ele.find(".img-responsive").attr("src");

                if (url) {
                    results.push({
                        title: title.text().trim(),
                        image: image?.trim() || "",
                        url,
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
     * Get chapter URLs from MangaInn.net URL
     * @param url MangaInn.net chapter URL
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
            $(".chapter-list li a").each(function () {
                const ele = $(this);

                const title = ele.find(".val").text().trim();
                const url = ele.attr("href");

                if (url) {
                    const [shortTitle, chap] = title.split("-");

                    chapters.push({
                        title: shortTitle?.trim() || title,
                        volume: "-",
                        chapter: chap?.trim() || "-",
                        url,
                    });
                }
            });

            const result: MangaExtractorInfoResult = {
                title: $(".content .widget-heading").first().text().trim(),
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
     * Get page image URLs from MangaInn.net page URL
     * @param url MangaInn.net page URL
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
                type: "page_urls",
                entities: [],
            };

            $(".selectPage.pull-right select")
                .first()
                .find("option")
                .each(function () {
                    const ele = $(this);

                    let url = ele.val();
                    if (typeof url === "string") {
                        result.entities.push({
                            page: ele.text().split(" ").pop()?.trim() || "",
                            url: url,
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
     * Get page image URLs from MangaInn.net page URL
     * @param url MangaInn.net page URL
     */
    async getPageImage(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const page = data
                .match(/<option.*?selected=.*?>(.*?)<\/option>/)?.[1]
                ?.split(" ")
                .pop();
            const image = data.match(
                /<img src="(.*?)".*id="chapter_img">/
            )?.[1];
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
