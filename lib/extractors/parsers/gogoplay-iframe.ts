import cheerio from "cheerio";
import { Requester } from "../../types";
import { constants, functions } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

export default async (
    url: string,
    options: {
        http: Requester;
    }
) => {
    try {
        const data = await options.http.get(functions.encodeURI(url), {
            headers: Object.assign(defaultHeaders(), {
                Referer: url,
            }),
            timeout: constants.http.maxTimeout,
        });

        const $ = cheerio.load(data);
        const items = $(".list-server-items .linkserver");

        const sources: string[] = [];
        items.each(function () {
            const ele = $(this);

            let srcLink = ele.attr("data-video");
            if (!srcLink && ele.hasClass("active")) srcLink = url;

            if (srcLink) {
                if (!srcLink.startsWith("http")) srcLink = `https:${srcLink}`;
                sources.push(srcLink);
            }
        });

        return sources;
    } catch (err) {
        throw err;
    }
};