import axios from "axios";
import { SourceRetriever, ExtractorDownloadResult } from "./model";
import { constants } from "../../util";

const defaultHeaders = () => ({
    "User-Agent": constants.http.userAgent,
});

const gogoplay: SourceRetriever = {
    name: "Gogoplay-streaming",
    validate: (url: string) => url.includes("/streaming.php"),
    async fetch(url: string) {
        try {
            const headers = Object.assign(defaultHeaders(), {
                Referer: url,
            });

            const { data: currentData } = await axios.get<any>(
                url.replace("streaming.php", "ajax.php"),
                {
                    headers,
                    responseType: "json",
                }
            );

            let sources: any[] = [];
            Array.isArray(currentData.source) &&
                sources.push(...currentData.source);
            Array.isArray(currentData.source_bk) &&
                sources.push(...currentData.source_bk);

            const results: ExtractorDownloadResult[] = [];
            sources.forEach((src: any) => {
                if (src.file) {
                    results.push({
                        quality: src.label || "unknown",
                        url: src.file,
                        type: ["downloadable", "streamable"],
                        headers,
                    });
                }
            });

            return results;
        } catch (err) {
            throw err;
        }
    },
};

export default gogoplay;
