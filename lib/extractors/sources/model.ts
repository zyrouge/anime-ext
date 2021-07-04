import { Requester } from "../../types";
import { AnimeExtractorDownloadResult } from "../anime/model";

export interface SourceRetrieverOptions {
    http: Requester;
    headers?: Record<string, string>;
}

export interface SourceRetriever {
    name: string;
    validate(url: string): boolean;
    fetch(
        url: string,
        options: SourceRetrieverOptions
    ): Promise<AnimeExtractorDownloadResult[]>;
}

export { AnimeExtractorDownloadResult } from "../anime/model";
