import qs from "qs";
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
    baseUrl: "https://simply.moe",
    searchUrl: "https://simply.moe/wp-admin/admin-ajax.php",
    animeRegex: /^https:\/\/simply\.moe\/anime\/.*/,
    episodeRegex: /^https:\/\/simply.moe\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Simply.moe Extractor
 */
export default class SimplyDotMoe implements AnimeExtractorModel {
    name = "Simply.moe";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Simply.moe URL
     * @param url Simply.moe URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Simply.moe Search (not implemented)
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
                    action: "ajaxsearchlite_search",
                    aslp: terms,
                    asid: 1,
                    options:
                        "qtranslate_lang=0&set_intitle=None&customset%5B%5D=anime",
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

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${config.searchUrl})`
            );

            const results: AnimeExtractorSearchResult[] = [];
            $(".item").each(function () {
                const ele = $(this);

                const title = ele.find(".name");
                const url = title.attr("href");
                const image = ele.find(".thumb").attr("src");
                const meta = ele.find(".meta .yearzi");

                if (url) {
                    const metas: string[] = [];
                    meta.each(function () {
                        const ele = $(this);

                        const content = ele.text().trim();
                        metas.push(content);
                    });

                    results.push({
                        title: title.text().trim(),
                        url,
                        thumbnail: image ? `${config.baseUrl}${image}` : "",
                        air: metas.length
                            ? metas.reverse().join(" ")
                            : "unknown",
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
     * Get episode URLs from Simply.moe URL
     * @param url Simply.moe anime URL
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
            $(".episodez.range a").each(function () {
                const episode = $(this);
                const url = episode.attr("href");

                if (url) {
                    episodes.push({
                        episode: episode.text().trim(),
                        url: url.trim(),
                    });
                }
            });

            const result: AnimeExtractorInfoResult = {
                title: $(".info-container .title").text().trim(),
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
     * Get download URLs from Simply.moe episode URL
     * @param url Simply.moe episode URL
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

            const results: AnimeExtractorDownloadResult[] = [];

            const urls = [...data.matchAll(/(file":"(.*?)", label: "(.*?)")/g)];
            urls.forEach((src) => {
                const [, , url, label] = src;
                if (url && url.startsWith("http")) {
                    results.push({
                        url,
                        quality: label || "unknown",
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
