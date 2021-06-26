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
    baseUrl: "https://mangadex.tv",
    searchUrl: (search: string) =>
        `https://mangadex.tv/search?type=titles&title=${search}&submit=`,
    mangaRegex: /^https:\/\/mangadex\.tv\/manga\/.*/,
    chapterRegex: /^https:\/\/mangadex\.tv\/chapter\/.*?\/.*/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * MangaDex.tv Extractor
 */
export default class MangaDex implements MangaExtractorModel {
    name = "MangaDex.tv";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate MangaDex.tv URL
     * @param url MangaDex.tv URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * MangaDex.tv Search
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
            $("#content .manga-entry").each(function () {
                const ele = $(this);

                const title = ele.find(".manga_title");
                const url = title.attr("href");
                const image = ele.find(".img-loading").attr("data-src");

                if (url) {
                    results.push({
                        title: title.text().trim(),
                        url: `${config.baseUrl}${url.trim()}`,
                        thumbnail: image ? `${config.baseUrl}${image}` : "",
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
     * Get chapter URLs from MangaDex.tv URL
     * @param url MangaDex.tv chapter URL
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

            var titleParser = this.parseMangaDexTitle;
            const chapters: MangaExtractorChapterResult[] = [];
            $(".chapter-container .chapter-row a").each(function () {
                const ele = $(this);

                const title = ele.text().trim();
                const url = ele.attr("href");

                if (url) {
                    const { shortTitle, chapter, volume } = titleParser(title);

                    chapters.push({
                        title: shortTitle?.trim() || title,
                        url: `${config.baseUrl}${url.trim()}`,
                        volume,
                        chapter,
                    });
                }
            });

            const image = $("#content img").attr("src");
            const result: MangaExtractorInfoResult = {
                title: $("#content .card-header > span").text().trim(),
                thumbnail: image ? `${config.baseUrl}${image}` : "",
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
     * Get page image URLs from MangaDex.tv page URL
     * @param url MangaDex.tv page URL
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

            $(".reader-image-wrapper img").each(function () {
                const ele = $(this);

                const url = ele.attr("data-src");
                if (typeof url === "string") {
                    result.entities.push({
                        page: ele.parent().attr("data-page")?.trim() || "-",
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

    parseMangaDexTitle(title: string) {
        let volume = undefined,
            chapter = undefined;

        const [vcInfo, shortTitle] = title.split(":");
        if (vcInfo && shortTitle) {
            const matchedVol = vcInfo.match(/Vol\.(.*?) /)?.[1]?.trim();
            if (matchedVol) volume = matchedVol;

            const matchedChapter = vcInfo.match(/Chapter (.*)/)?.[1]?.trim();
            if (matchedChapter) chapter = matchedChapter;
        }

        if (!volume || !chapter) {
            const matchedChapter = title.match(/\d+/)?.[0];
            if (matchedChapter) chapter = matchedChapter;
        }

        return {
            volume: volume || "-",
            chapter: chapter || "-",
            shortTitle: shortTitle?.trim(),
        };
    }
}
