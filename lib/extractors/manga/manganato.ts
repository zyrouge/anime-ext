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
    baseUrl: "https://manganato.com",
    searchUrl: "https://readmanganato.com/getstorysearchjson",
    mangaRegex: /^https:\/\/readmanganato\.com\/manga-.*/,
    chapterRegex: /^https:\/\/readmanganato\.com\/manga-.*\/chapter-.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * MangaNato.com Extractor
 * @deprecated Avoid using this due to the website's caching method
 */
export default class MangaNato implements MangaExtractorModel {
    name = "MangaNato.com";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate MangaNato.com URL
     * @param url MangaNato.com URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * MangaNato.com Search
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
                    searchword: terms,
                }),
                {
                    headers: Object.assign(config.defaultHeaders(), {
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                    }),
                    timeout: constants.http.maxTimeout,
                }
            );

            const parsed: any[] = JSON.parse(data);
            const results: MangaExtractorSearchResult[] = parsed.map((x) => ({
                title: cheerio.load(x.name).text(),
                url: x.link_story,
                image: x.image,
            }));

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get chapter URLs from MangaNato.com URL
     * @param url MangaNato.com chapter URL
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
            $(".panel-story-chapter-list .row-content-chapter li a").each(
                function () {
                    const ele = $(this);

                    const title = ele.text().trim();
                    const url = ele.attr("href");

                    if (url) {
                        const [volchap, shortTitle] = title.split(":");
                        const vol = volchap?.match(/Vol\.(.*?) /)?.[1]?.trim();
                        const chap = volchap
                            ?.match(/Chapter (.*)/)?.[1]
                            ?.trim();

                        chapters.push({
                            title:
                                (vol || chap) && shortTitle
                                    ? shortTitle?.trim()
                                    : title,
                            volume: vol || "-",
                            chapter: chap || "-",
                            url,
                        });
                    }
                }
            );

            const result: MangaExtractorInfoResult = {
                title: $(".story-info-right h1").text().trim(),
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
     * Get page image URLs from MangaNato.com page URL
     * @param url MangaNato.com page URL
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
            };

            $(".container-chapter-reader img").each(function () {
                const ele = $(this);

                const url = ele.attr("src");
                const alt = ele.attr("alt")?.match(/page (\d+)/)?.[1];

                if (typeof url === "string") {
                    result.entities.push({
                        page: alt?.trim() || "-",
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
}
