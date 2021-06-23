import { Logger, Requester } from "../../types";

export interface MangaExtractorConstructorOptions {
    logger?: Partial<Logger>;
    http: Requester;
}

export type MangaExtractorValidateResults =
    | "manga_url"
    | "chapter_url"
    | boolean;

export interface MangaExtractorSearchResult {
    title: string;
    url: string;
    thumbnail: string;
}

export interface MangaExtractorChapterResult {
    title: string;
    volume: string;
    chapter: string;
    url: string;
}

export interface MangaExtractorInfoResult {
    title: string;
    thumbnail: string;
    chapters: MangaExtractorChapterResult[];
}

export interface MangaExtractorChapterPagesEntity {
    page: string;
    url: string;
}

export interface MangaExtractorChapterPagesResult {
    type: "image_urls" | "page_urls";
    entities: MangaExtractorChapterPagesEntity[];
    headers?: Record<string, string>;
}

export interface MangaExtractorPageImageResult {
    image: string;
}

export interface MangaExtractorModel {
    name: string;
    options: MangaExtractorConstructorOptions;

    validateURL(url: string): MangaExtractorValidateResults;
    search(terms: string): Promise<MangaExtractorSearchResult[]>;
    getInfo(url: string): Promise<MangaExtractorInfoResult>;
    getChapterPages(url: string): Promise<MangaExtractorChapterPagesResult>;
    getPageImage?(
        url: string,
        headers?: Record<string, string>
    ): Promise<MangaExtractorPageImageResult>;
}
