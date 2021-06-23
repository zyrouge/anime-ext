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
import GogoParser from "../parsers/gogoplay-iframe";
import GogoDownload from "../parsers/gogoplay-download";
import { constants, functions } from "../../util";

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

    constructor(options: AnimeExtractorConstructorOptions) {
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
     * Gogoanime Search
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

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: AnimeExtractorSearchResult[] = [];
            $(".items li").each(function () {
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
                        thumbnail: thumbnail?.trim() || "",
                        air: year,
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
     * Get episode URLs from Gogoanime URL
     * @param url Gogoanime URL
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

            const eps = $("#episode_page a");
            const epStart = <string>eps.first().attr("ep_start"),
                epEnd = <string>eps.last().attr("ep_end");
            const isSgtE = +epStart > +epEnd;

            const episodesUrl = config.episodesUrl(
                !isSgtE ? epStart : epEnd,
                isSgtE ? epStart : epEnd,
                <string>$("input#movie_id").val()
            );

            const episodesData = await this.options.http.get(
                functions.encodeURI(episodesUrl),
                {
                    headers: config.defaultHeaders(),
                    timeout: constants.http.maxTimeout,
                }
            );

            const e$ = cheerio.load(episodesData);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const episodes: AnimeExtractorEpisodeResult[] = [];
            e$("#episode_related a").each(function () {
                const ele = e$(this);

                const episode = ele.find(".name");
                const url = ele.attr("href");

                if (url) {
                    episodes.push({
                        episode: episode.text().replace("EP", "").trim(),
                        url: `${config.baseUrl}${url.trim()}`,
                    });
                }
            });

            const result: AnimeExtractorInfoResult = {
                title: $(".anime_info_body_bg h1").text().trim(),
                thumbnail: $(".anime_info_body_bg img").attr("src") || "",
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
     * Get download URLs from Gogoanime episode URL
     * @param url Episode URL
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

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            let iframeUrl = $(".play-video iframe").attr("src");
            if (!iframeUrl)
                throw new Error(`Could not find download urls for: ${url}`);

            const results: AnimeExtractorDownloadResult[] = [];

            if (!iframeUrl.startsWith("http")) iframeUrl = `https:${iframeUrl}`;
            (
                await GogoParser(iframeUrl, {
                    http: this.options.http,
                })
            ).forEach((src) => {
                results.push({
                    quality: "unknown",
                    url: src,
                    type: ["external_embed"],
                    headers: config.defaultHeaders(),
                });
            });

            results.push({
                quality: "unknown",
                url: iframeUrl,
                type: ["external_embed"],
                headers: config.defaultHeaders(),
            });

            const download = $(".dowloads a")
                .map(function () {
                    return $(this).attr("href");
                })
                .toArray()
                .filter((x) => x);

            for (const src of download) {
                results.push(
                    ...(await GogoDownload(src, {
                        http: this.options.http,
                    }))
                );
            }

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape: ${err?.message}`
            );

            throw new Error(`Failed to scrape: ${err?.message}`);
        }
    }
}
