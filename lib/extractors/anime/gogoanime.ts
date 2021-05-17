import axios from "axios";
import cheerio from "cheerio";
import {
    AnimeExtractorConstructorOptions,
    AnimeExtractorValidateResults,
    AnimeExtractorSearchResult,
    AnimeExtractorEpisodeResult,
    AnimeExtractorDownloadResult,
    AnimeExtractorModel,
} from "./model";
import GogoParser from "../parsers/gogoplay-iframe";
import { getExtractor } from "../sources";
import { constants } from "../../util";

export const config = {
    baseUrl: "https://www1.gogoanime.ai",
    searchUrl: (search: string) =>
        `https://www1.gogoanime.ai/search.html?keyword=${search}`,
    episodesUrl: (start: string, end: string, id: string) =>
        `https://ajax.gogo-load.com/ajax/load-list-episode?ep_start=${start}&ep_end=${end}&id=${id}`,
    animeRegex: /^https:\/\/www1.gogoanime.ai\/category\/.*/,
    episodeRegex: /^https:\/\/www1.gogoanime.ai\/.*-episode-\w+$/,
    defaultHeaders() {
        return {
            "User-Agent": constants.http.userAgent,
            Referer: this.baseUrl,
        };
    },
};

/**
 * Gogoanime Extractor
 */
export default class Gogoanime implements AnimeExtractorModel {
    name = "Gogoanime";
    options: AnimeExtractorConstructorOptions;

    constructor(options: AnimeExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate Gogoanime URL
     * @param url Gogoanime URL
     */
    validateURL(url: string) {
        let result: AnimeExtractorValidateResults = false;

        if (config.animeRegex.test(url)) result = "anime_url";
        else if (config.episodeRegex.test(url)) result = "episode_url";

        return result;
    }

    /**
     * Gogoanime Search (avoid using this)
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
                headers: config.defaultHeaders(),
                responseType: "text",
                timeout: constants.http.maxTimeout,
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorSearchResult[] = [];

            const links = $(".items li");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const ele = $(this);

                const title = ele.find(".name a");
                const url = title.attr("href");
                const thumbnail = ele.find(".img img").attr("src");
                const air = ele.find(".released");

                if (url) {
                    const year =
                        $(air[0]).text().replace("Released:", "").trim() ||
                        "unknown";

                    results.push({
                        title: title.text().trim(),
                        url: `${config.baseUrl}${url.trim()}`,
                        thumbnail: thumbnail?.trim(),
                        air: year,
                    });
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
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
     * Get episode URLs from Gogoanime URL
     * @param url Gogoanime URL
     */
    async getEpisodeLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Episode links requested for: ${url}`
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

            const episodesUrl = config.episodesUrl(
                <string>$("#episode_page a.active").attr("ep_start"),
                <string>$("#episode_page a.active").attr("ep_end"),
                <string>$("input#movie_id").val()
            );

            const { data: episodesData } = await axios.get<string>(
                episodesUrl,
                {
                    headers: config.defaultHeaders(),
                    responseType: "text",
                    timeout: constants.http.maxTimeout,
                }
            );

            const e$ = cheerio.load(episodesData);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorEpisodeResult[] = [];

            const links = e$("#episode_related a");
            this.options.logger?.debug?.(
                `(${this.name}) No. of links found: ${links.length} (${url})`
            );

            links.each(function () {
                const ele = e$(this);

                const episode = ele.find(".name");
                const url = ele.attr("href");

                if (url) {
                    results.push({
                        episode: +episode.text().replace("EP", "").trim(),
                        url: `${config.baseUrl}${url.trim()}`,
                    });
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
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
     * Get download URLs from Gogoanime episode URL
     * @param url Episode URL
     */
    async getDownloadLinks(url: string) {
        try {
            this.options.logger?.debug?.(
                `(${this.name}) Download links requested for: ${url}`
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

            let iframeUrl = $(".play-video iframe").attr("src");
            if (!iframeUrl)
                throw new Error(`Could not find download urls for: ${url}`);

            const results: AnimeExtractorDownloadResult[] = [];

            if (!iframeUrl.startsWith("http")) iframeUrl = `https:${iframeUrl}`;
            const sources = await GogoParser(iframeUrl);
            for (const src of sources) {
                const extractor = getExtractor(src);
                if (extractor) {
                    try {
                        const res = await extractor.fetch(src);
                        results.push(...res);
                    } catch (err) {
                        this.options.logger?.debug?.(
                            `(${this.name}) Could not parse download source: ${src} (${url})`
                        );
                    }
                }

                results.push({
                    quality: "unknown",
                    url: src,
                    type: ["external_embed"],
                    headers: config.defaultHeaders(),
                });
            }

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
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
