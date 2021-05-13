import axios from "axios";
import cheerio from "cheerio";
import { constants } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

export const GogoIframeParser = async (url: string) => {
    try {
        const { data } = await axios.get(url, {
            headers: defaultHeaders(),
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

export default GogoIframeParser;
