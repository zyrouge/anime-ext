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
    baseUrl: "https://readm.org",
    searchUrl: "https://readm.org/service/search",
    mangaRegex: /^https:\/\/readm\.org\/manga\/.*/,
    chapterRegex: /^https:\/\/readm\.org\/manga\/.*\/all-pages$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * ReadM.org Extractor
 */
export default class ReadM implements MangaExtractorModel {
    name = "ReadM.org";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate ReadM.org URL
     * @param url ReadM.org URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * ReadM.org Search
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            this.options.logger?.debug?.(
                `(${this.name}) Search URL: ${config.searchUrl}`
            );

            const data = await this.options.http.post(
                functions.encodeURI(config.searchUrl),
                qs.stringify({
                    dataType: "json",
                    phrase: terms,
                }),
                {
                    headers: {
                        ...config.defaultHeaders(),
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                        "x-requested-with": "XMLHttpRequest",
                    },
                    timeout: constants.http.maxTimeout,
                }
            );

            const res: any[] = JSON.parse(data)?.manga || [];
            return res.map<MangaExtractorSearchResult>((x) => ({
                title: x.title,
                url: `${config.baseUrl}${x.url}`,
                image: `${config.baseUrl}${x.image}`,
            }));
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get chapter URLs from ReadM.org URL
     * @param url ReadM.org chapter URL
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
            $(".episodes-list .table-episodes-title a").each(function () {
                const ele = $(this);

                const title = ele.text().trim();
                const url = ele.attr("href");
                const [chapter, volume] = title
                    .replace("Chapter", "")
                    .trim()
                    .split("v");

                if (url) {
                    chapters.push({
                        title,
                        volume: volume?.trim() || "-",
                        chapter: chapter?.trim() || "-",
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
     * Get page image URLs from ReadM.org page URL
     * @param url ReadM.org page URL
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

            $(".ch-images img").each(function (i) {
                const ele = $(this);

                const url = ele.attr("src");
                if (url) {
                    const page = url.match(/p_(\d+)/)?.[1];

                    result.entities.push({
                        page: page ? `${+page}` : "-",
                        url: `${config.baseUrl}${url}`,
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
