import axios from "axios";
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
    baseUrl: "https://fanfox.net",
    searchUrl: (search: string) => `https://fanfox.net/search?title=${search}`,
    mangaRegex: /^https:\/\/fanfox\.net\/manga.*/,
    chapterRegex: /^https:\/\/fanfox\.net\/manga.*?\/\d+\.html$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * FanFox.net Extractor
 */
export default class FanFox implements MangaExtractorModel {
    name = "FanFox.net";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions = {}) {
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

            const url = config.searchUrl(encodeURIComponent(terms));
            this.options.logger?.debug?.(`(${this.name}) Search URL: ${url}`);

            const { data } = await axios.get<string>(url, {
                withCredentials: true,
                headers: config.defaultHeaders(),
                responseType: "text",
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

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
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
                        volume: vol?.trim() || "unknown",
                        chapter: chap?.trim() || "unknown",
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
    async getChapterPageImages(url: string) {
        try {
            url = url.replace(/https?:\/\/fanfox/, "https://m.fanfox");

            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const { data } = await axios.get<string>(url, {
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);

            const pages: {
                page: number;
                url: string;
                isCurrent: boolean;
            }[] = [];

            $("select.mangaread-page")
                .first()
                .find("option")
                .each(function () {
                    const ele = $(this);

                    let url = ele.val();
                    if (typeof url === "string") {
                        if (!url.startsWith("http")) url = `https:${url}`;

                        pages.push({
                            page: +ele.text(),
                            url: url,
                            isCurrent: !!ele.attr("selected"),
                        });
                    }
                });

            const results: MangaExtractorChapterPagesResult[] = [];

            for (const page of pages) {
                let image: string | undefined;

                if (page.isCurrent) {
                    image = $(".mangaread-img img").attr("src");
                } else {
                    try {
                        const { data } = await axios.get<string>(page.url, {
                            headers: config.defaultHeaders(),
                            responseType: "text",
                            timeout: constants.http.maxTimeout,
                        });

                        image = data.match(
                            /<img src="(.*?)".*id="image".*>/
                        )?.[1];

                        await functions.sleep(10);
                    } catch (err) {
                        this.options.logger?.debug?.(
                            `(${this.name}) Failed to parse page: ${page.url} (${url})`
                        );
                    }
                }

                if (image) {
                    if (!image.startsWith("http")) image = `https:${image}`;

                    results.push({
                        page: page.page,
                        image: image.trim(),
                    });
                }
            }

            this.options.logger?.debug?.(
                `(${this.name}) No. of pages resolved after fetching: ${results.length} (${url})`
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
