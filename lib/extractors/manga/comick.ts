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
    baseUrl: "https://comick.fun",
    searchUrl: (search: string) =>
        `https://comick.fun/api/search_title?t=1&q=${search}`,
    chaptersLimit: 100,
    chaptersUrl: (id: number, page: number) =>
        `https://comick.fun/api/get_chapters?comicid=${id}&page=${page}&limit=${config.chaptersLimit}`,
    pagesUrl: (hid: string) => `https://comick.fun/api/get_chapter?hid=${hid}`,
    parseHid: (url: string) => url.split("/").pop()?.split("-")[0],

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
 * Comick.fun Extractor
 */
export default class ComicK implements MangaExtractorModel {
    name = "Comick.fun";
    options: MangaExtractorConstructorOptions;

    constructor(options: MangaExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Comick.fun URL
     * @param url Comick.fun URL
     */
    validateURL(url: string) {
        let result: MangaExtractorValidateResults = false;

        if (config.mangaRegex.test(url)) result = "manga_url";
        else if (config.chapterRegex.test(url)) result = "chapter_url";

        return result;
    }

    /**
     * Comick.fun Search
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
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const results: MangaExtractorSearchResult[] = JSON.parse(data).map(
                (x: any) => ({
                    title: x.title,
                    url: `${config.baseUrl}/comic/${x.slug}`,
                    thumbnail: x.md_covers?.[0]?.gpurl,
                })
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get chapter URLs from Comick.fun URL
     * @param url Comick.fun chapter URL
     */
    async getInfo(url: string) {
        try {
            url = functions.removeSearchParams(url);

            this.options.logger?.debug?.(
                `(${this.name}) Chapter links requested for: ${url}`
            );

            const data = await this.options.http.get(functions.encodeURI(url), {
                headers: config.defaultHeaders(),
                timeout: constants.http.maxTimeout,
            });

            const id = parseInt(data.match(/"id":(\d+)/)?.[1] || "");
            if (typeof id !== "number" || isNaN(id) || !isFinite(id))
                throw new Error("Could not retrieve id");

            const chapters: MangaExtractorChapterResult[] = [];

            let page = 1;
            while (true) {
                try {
                    const chaptersRaw = await this.options.http.get(
                        functions.encodeURI(config.chaptersUrl(+id, page)),
                        {
                            headers: config.defaultHeaders(),
                            timeout: constants.http.maxTimeout,
                        }
                    );
                    const chaptersData = JSON.parse(chaptersRaw).data;

                    chaptersData.chapters.forEach((x: any) => {
                        if (x.iso639_1 === "en") {
                            chapters.push({
                                title: x.title || "",
                                volume: x.vol || "",
                                chapter: x.chap || "",
                                url: `${url}/${x.hid}-chapter-${x.chap}-${x.iso639_1}`,
                            });
                        }
                    });

                    if (chaptersData.chapters.length !== config.chaptersLimit) {
                        break;
                    }

                    page += 1;
                    await functions.sleep(300);
                } catch (err) {
                    break;
                }
            }

            const result: MangaExtractorInfoResult = {
                title: data.match(/"title":"(.*?)"/)?.[1] || "",
                thumbnail: data.match(/"coverURL":"(.*?)"/)?.[1] || "",
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
     * Get page image URLs from Comick.fun page URL
     * @param url Comick.fun page URL
     */
    async getChapterPages(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Chapters pages requested for: ${url}`
            );

            const hid = config.parseHid(url);
            if (!hid) throw new Error("Could not retrieve hid");

            const data = await this.options.http.get(
                functions.encodeURI(config.pagesUrl(hid)),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const result: MangaExtractorChapterPagesResult = {
                type: "image_urls",
                entities: JSON.parse(data).data.chapter.images,
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
