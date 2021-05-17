import axios from "axios";
import { enc, AES } from "crypto-js";
import {
    ExtractorConstructorOptions,
    ExtractorValidateResults,
    ExtractorSearchResult,
    ExtractorEpisodeResult,
    ExtractorDownloadResult,
    ExtractorModel,
} from "./model";
import { constants } from "../util";

export const config = {
    baseUrl: "https://twist.moe",
    searchUrl: "https://api.twist.moe/api/anime",

    decryptKey: "267041df55ca2b36f2e322d05ee2c9cf",
    getSlugFromUrl: (url: string) =>
        url.match(/https:\/\/twist\.moe\/a\/([\d\w-_]+)\/?/)?.[1],

    animePageUrl: (slug: string) => `https://twist.moe/a/${slug}`,
    episodesApiUrl: (slug: string) => `https://api.twist.moe/api/anime/${slug}`,
    sourcesApiUrl: (slug: string) =>
        `https://api.twist.moe/api/anime/${slug}/sources`,
    cdnUrl: `https://cdn.twist.moe`,

    animeRegex: /^https:\/\/twist\.moe\/a\/.*/,
    episodeRegex: /^https:\/\/twist\.moe\/a\/.*\/\d+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
            "x-access-token": "0df14814b9e590a1f26d3071a4ed7974",
        };
    },
};

export const matcher = (origin: string, keywords: string[]) =>
    !!origin
        .toLowerCase()
        .split(" ")
        .find((x) => keywords.find((s) => x.indexOf(s) > -1));

/**
 * Twist.moe Extractor
 */
export default class FourAnime implements ExtractorModel {
    name = "Twist.moe";
    options: ExtractorConstructorOptions;
    searchCache: {
        title: string;
        alt_title?: string;
        url: string;
    }[] = [];

    constructor(options: ExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate 4Anime URL
     * @param url 4Anime URL
     */
    validateURL(url: string) {
        let result: ExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * 4Anime Search (avoid using this)
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            terms = terms.toLowerCase();

            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            if (!this.searchCache.length) {
                const url = config.searchUrl;
                this.options.logger?.debug?.(
                    `(${this.name}) Search URL: ${url}`
                );

                const { data } = await axios.get<any>(url, {
                    headers: config.defaultHeaders(),
                    responseType: "json",
                });

                if (Array.isArray(data)) {
                    data.forEach((anime) => {
                        if (anime.slug.slug) {
                            this.searchCache.push({
                                title: anime.title,
                                alt_title: anime.alt_title || undefined,
                                url: config.animePageUrl(anime.slug.slug),
                            });
                        }
                    });
                }

                this.options.logger?.debug?.(
                    `(${this.name}) No. of cached animes: ${this.searchCache.length} (${url})`
                );
            }

            const searches = terms.split(" ");
            const results: (ExtractorSearchResult & { score: number })[] = [];

            this.searchCache.forEach(({ title, alt_title, url }) => {
                let points = 0;
                if (matcher(title, searches)) points += 1;
                if (title.toLowerCase().includes(terms)) points += 1;

                if (alt_title) {
                    if (matcher(alt_title, searches)) points += 1;
                    if (alt_title.toLowerCase().includes(terms)) points += 1;
                }

                if (points > 0) {
                    results.push({
                        title,
                        url,
                        score: points,
                    });
                }
            });

            return results
                .sort((a, b) => b.score - a.score)
                .slice(0, 10) as ExtractorSearchResult[];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err}`
            );

            throw new Error(`Failed to scrape: ${err}`);
        }
    }

    /**
     * Get episode URLs from 4Anime URL
     * @param url 4Anime anime URL
     */
    async getEpisodeLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const slug = config.getSlugFromUrl(url);
            if (!slug) throw new Error(`Could not parse slug from ${url}`);

            const { data } = await axios.get<any>(config.episodesApiUrl(slug), {
                headers: config.defaultHeaders(),
                responseType: "json",
            });

            const results: ExtractorEpisodeResult[] = [];

            if (data.slug.slug && Array.isArray(data.episodes)) {
                const animeUrl = config.animePageUrl(data.slug.slug);
                data.episodes.forEach((ep: any) => {
                    results.push({
                        episode: ep.number,
                        url: `${animeUrl}/${ep.number}`,
                    });
                });
            }

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err}`
            );

            throw new Error(`Failed to scrape: ${err}`);
        }
    }

    /**
     * Get download URLs from 4Anime episode URL
     * @param url 4Anime episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const slug = config.getSlugFromUrl(url);
            if (!slug) throw new Error(`Could not parse slug from ${url}`);

            const { data } = await axios.get<any>(config.sourcesApiUrl(slug), {
                headers: config.defaultHeaders(),
                responseType: "json",
            });

            const episode = +(url.match(/(\d+)$/)?.[1] || "1");
            const source = data.find((x: any) => x.number === episode)?.source;
            if (!source)
                throw new Error(`Could not find download url for: ${url}`);

            const path = AES.decrypt(source, config.decryptKey)
                .toString(enc.Utf8)
                .trim();

            const result: ExtractorDownloadResult = {
                quality:
                    path.match(/\[([\w\d]+)\]\.[\d\w]+$/)?.[1] || "unknown",
                url: `${config.cdnUrl}${path}`,
                type: ["downloadable"],
                headers: config.defaultHeaders(),
            };

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: 1 (${url})`
            );

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err}`
            );

            throw new Error(`Failed to scrape: ${err}`);
        }
    }
}
