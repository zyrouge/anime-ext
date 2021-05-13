import axios from "axios";
import cheerio from "cheerio";
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
        };
    },
};

/**
 * Gogoanime Extractor
 */
export default class Gogoanime implements ExtractorModel {
    name = "Gogoanime";
    options: ExtractorConstructorOptions;

    constructor(options: ExtractorConstructorOptions = {}) {
        this.options = options;
    }

    /**
     * Validate Gogoanime URL
     * @param url Gogoanime URL
     */
    validateURL(url: string) {
        let result: ExtractorValidateResults = false;

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
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: ExtractorSearchResult[] = [];

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
                `(${this.name}) Failed to scrape Gogoanime: ${err}`
            );

            throw new Error("Failed to scrape Gogoanime!");
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
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const episodesUrl = config.episodesUrl(
                $("#episode_page a.active").attr("ep_start") as string,
                $("#episode_page a.active").attr("ep_end") as string,
                $("input#movie_id").val() as string
            );

            const { data: episodesData } = await axios.get<string>(
                episodesUrl,
                {
                    headers: config.defaultHeaders(),
                    responseType: "text",
                }
            );

            const e$ = cheerio.load(episodesData);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const results: ExtractorEpisodeResult[] = [];

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
                `(${this.name}) Failed to scrape Gogoanime: ${err}`
            );

            throw new Error("Failed to scrape Gogoanime!");
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
            });

            const $ = cheerio.load(data);
            this.options.logger?.debug?.(
                `(${this.name}) DOM creation successful! (${url})`
            );

            const dwlLinks: string[] = [];
            $(".anime_muti_link a").each(function () {
                const ele = $(this);

                let link = ele.attr("data-video");
                if (link) {
                    if (!link.startsWith("http")) link = `https:${link}`;
                    dwlLinks.push(link);
                }
            });

            this.options.logger?.debug?.(
                `(${this.name}) No. of source links after parsing: ${dwlLinks.length} (${url})`
            );

            const results: ExtractorDownloadResult[] = [];

            for (const dwlLink of dwlLinks) {
                try {
                    const { data: dwlData } = await axios.get<string>(dwlLink, {
                        headers: config.defaultHeaders(),
                        responseType: "text",
                        timeout: 5000,
                    });

                    const dwlUrls = [
                        ...dwlData.matchAll(
                            /file:\s+[\'\"](https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*)[\'\"]/g
                        ),
                    ].map((x) => x[1]);

                    if (dwlUrls && dwlUrls.length) {
                        dwlUrls.forEach((dwlUrl) => {
                            results.push({
                                quality: "unknown",
                                url: dwlUrl,
                                type: "downloadable",
                            });
                        });
                    }

                    results.push({
                        quality: "unknown",
                        url: dwlLink,
                        type: "viewable",
                    });
                } catch (err) {
                    this.options.logger?.debug?.(
                        `(${this.name}) Failed to parse: ${dwlLink} (${url})`
                    );
                }
            }

            this.options.logger?.debug?.(
                `(${this.name}) No. of links after parsing: ${results.length} (${url})`
            );

            return results;
        } catch (err) {
            this.options.logger?.error?.(
                `(${this.name}) Failed to scrape Gogoanime: ${err}`
            );

            throw new Error("Failed to scrape Gogoanime!");
        }
    }
}
