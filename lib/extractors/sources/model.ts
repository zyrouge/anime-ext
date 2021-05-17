import { AnimeExtractorDownloadResult } from "../anime/model";

export interface SourceRetriever {
    name: string;
    validate(url: string): boolean;
    fetch(url: string): Promise<AnimeExtractorDownloadResult[]>;
}

export { AnimeExtractorDownloadResult } from "../anime/model";
