import { Logger } from "../types";

export interface ExtractorConstructorOptions {
    logger?: Partial<Logger>;
}

export type ExtractorValidateResults = "anime_url" | "episode_url" | boolean;

export interface ExtractorSearchResult {
    title: string;
    url: string;
    thumbnail?: string;
    air?: string;
}

export interface ExtractorEpisodeResult {
    episode: number;
    url: string;
}

export const ExtractorDownloadResultTypes = [
    "streamable",
    "downloadable",
    "external_embed",
] as const;
export type ExtractorDownloadResultTypesType =
    typeof ExtractorDownloadResultTypes[number];

export interface ExtractorDownloadResult {
    quality: string;
    url: string;
    type: ExtractorDownloadResultTypesType[];
    headers?: Record<string, any>;
}

export interface ExtractorModel {
    name: string;
    options: ExtractorConstructorOptions;

    validateURL(url: string): ExtractorValidateResults;
    search(terms: string): Promise<ExtractorSearchResult[]>;
    getEpisodeLinks(url: string): Promise<ExtractorEpisodeResult[]>;
    getDownloadLinks(url: string): Promise<ExtractorDownloadResult[]>;
}
