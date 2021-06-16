import { enc, AES } from "crypto-js";
import fusejs from "fuse.js";
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

export interface SearchEntity {
    title: string;
    alt_title?: string;
    url: string;
}

/**
 * Twist.moe Extractor
 */
export default class TwistDotAnime implements AnimeExtractorModel {
    name = "Twist.moe";
    options: AnimeExtractorConstructorOptions;
    searcher?: fusejs<SearchEntity>;

    constructor(options: AnimeExtractorConstructorOptions) {
        this.options = options;
    }

    /**
     * Validate Twist.moe URL
     * @param url Twist.moe URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Twist.moe Search
     * @param terms Search term
     */
    async search(terms: string) {
        try {
            terms = terms.toLowerCase();

            this.options.logger?.debug?.(
                `(${this.name}) Search terms: ${terms}`
            );

            if (!this.searcher) {
                const url = config.searchUrl;
                this.options.logger?.debug?.(
                    `(${this.name}) Search URL: ${url}`
                );

                const unparsed = await this.options.http.get(
                    functions.encodeURI(url),
                    {
                        headers: config.defaultHeaders(),
                        timeout: 30 * 1000,
                    }
                );
                const data = JSON.parse(unparsed);

                const items: SearchEntity[] = [];
                if (Array.isArray(data)) {
                    data.forEach((anime) => {
                        if (anime.slug.slug) {
                            items.push({
                                title: anime.title,
                                alt_title: anime.alt_title || undefined,
                                url: config.animePageUrl(anime.slug.slug),
                            });
                        }
                    });
                }
                this.searcher = new fusejs(items, {
                    includeScore: true,
                    keys: [
                        {
                            name: "title",
                            weight: 2,
                        },
                        "alt_title",
                    ],
                });

                this.options.logger?.debug?.(
                    `(${this.name}) No. of cached animes: ${items.length} (${url})`
                );
            }

            return <AnimeExtractorSearchResult[]>this.searcher
                .search(terms)
                .sort((a, b) => a.score! - b.score!)
                .map((x) =>
                    Object.assign(x.item, {
                        air: "unknown",
                    })
                );
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }

    /**
     * Get episode URLs from Twist.moe URL
     * @param url Twist.moe anime URL
     */
    async getInfo(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
            );

            const slug = config.getSlugFromUrl(url);
            if (!slug) throw new Error(`Could not parse slug from ${url}`);

            const unparsed = await this.options.http.get(
                functions.encodeURI(config.episodesApiUrl(slug)),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const data = JSON.parse(unparsed);
            const episodes: AnimeExtractorEpisodeResult[] = [];

            if (data.slug.slug && Array.isArray(data.episodes)) {
                const animeUrl = config.animePageUrl(data.slug.slug);
                data.episodes.forEach((ep: any) => {
                    episodes.push({
                        episode: ep.number.toString(),
                        url: `${animeUrl}/${ep.number}`,
                    });
                });
            }

            const result: AnimeExtractorInfoResult = {
                title: data.title || "",
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
     * Get download URLs from Twist.moe episode URL
     * @param url Twist.moe episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
            );

            const slug = config.getSlugFromUrl(url);
            if (!slug) throw new Error(`Could not parse slug from ${url}`);

            const unparsed = await this.options.http.get(
                functions.encodeURI(config.sourcesApiUrl(slug)),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const data = JSON.parse(unparsed);
            const episode = +(url.match(/(\d+)$/)?.[1] || "1");
            const source = data.find((x: any) => x.number === episode)?.source;
            if (!source)
                throw new Error(`Could not find download url for: ${url}`);

            const path = AES.decrypt(source, config.decryptKey)
                .toString(enc.Utf8)
                .trim();

            const result: AnimeExtractorDownloadResult = {
                quality:
                    path.match(/\[([\w\d]+)\]\.[\d\w]+$/)?.[1] || "unknown",
                url: `${config.cdnUrl}${path}`,
                type: ["external_download"],
                headers: config.defaultHeaders(),
            };

            return [result];
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
