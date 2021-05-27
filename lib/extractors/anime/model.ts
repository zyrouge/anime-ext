import { Logger, Requester } from "../../types";

export interface AnimeExtractorConstructorOptions {
    logger?: Partial<Logger>;
    http: Requester;
}

export type AnimeExtractorValidateResults =
    | "anime_url"
    | "episode_url"
    | boolean;

export interface AnimeExtractorSearchResult {
    title: string;
    url: string;
    thumbnail: string;
    air: string;
}

export interface AnimeExtractorEpisodeResult {
    episode: string;
    url: string;
}

export interface AnimeExtractorInfoResult {
    title: string;
    episodes: AnimeExtractorEpisodeResult[];
}

export const AnimeExtractorDownloadResultTypes = [
    "streamable",
    "downloadable",
    "embedable",
    "external_download",
    "external_embed",
] as const;

export type AnimeExtractorDownloadResultTypesType =
    typeof AnimeExtractorDownloadResultTypes[number];

export interface AnimeExtractorDownloadResult {
    quality: string;
    url: string;
    type: AnimeExtractorDownloadResultTypesType[];
    headers?: Record<string, any>;
}

export interface AnimeExtractorModel {
    name: string;
    options: AnimeExtractorConstructorOptions;

    validateURL(url: string): AnimeExtractorValidateResults;
    search(terms: string): Promise<AnimeExtractorSearchResult[]>;
    getInfo(url: string): Promise<AnimeExtractorInfoResult>;
    getDownloadLinks(url: string): Promise<AnimeExtractorDownloadResult[]>;
}
