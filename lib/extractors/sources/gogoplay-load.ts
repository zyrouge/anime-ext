import axios from "axios";
import { SourceRetriever, ExtractorDownloadResult } from "./model";
import { constants } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const gogoplay: SourceRetriever = {
    name: "Gogoplay-loadserver",
    validate: (url: string) =>
        url.includes("/load.php") || url.includes("/loadserver.php"),
    async fetch(url: string) {
        try {
            const headers = Object.assign(defaultHeaders(), {
                Referer: url,
            });

            const { data } = await axios.get<string>(url, {
                headers,
                responseType: "text",
            });

            const urls = [
                ...data.matchAll(
                    /file:\s+[\'\"](https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*)[\'\"]/g
                ),
            ].map((x) => x[1]);

            const results: ExtractorDownloadResult[] = <any[]>urls
                .filter((x) => x)
                .map((x) => ({
                    quality: "unknown",
                    url: x,
                    type: ["downloadable", "streamable"],
                    headers,
                }));

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default gogoplay;
