import { URL } from "url";
import { ExtractorDownloadResult } from "../model";

export default {
    name: "SEmbed",
    validate: (url: string) =>
        /https:\/\/sbembed\.com\/embed-.*\.html/.test(url),
    resolve(url: string) {
        try {
            const code = url.match(
                /https:\/\/sbembed\.com\/embed-(.*)\.html/
            )?.[1];
            if (!code) throw new Error("Could not parse sembed url!");

            const strUrlPrsd = new URL(url);
            const src = `/play/${code}?auto=1&referer=&`;

            console.log(strUrlPrsd.href);
        } catch (err) {
            throw err;
        }
    },
};
