import { ExtractorDownloadResult } from "../model";

export interface SourceRetriever {
    name: string;
    validate(url: string): boolean;
    fetch(url: string): Promise<ExtractorDownloadResult[]>;
}

export { ExtractorDownloadResult } from "../model";
