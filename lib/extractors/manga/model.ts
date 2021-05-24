import { Logger } from "../../types";

export interface MangaExtractorConstructorOptions {
    logger?: Partial<Logger>;
}

export type MangaExtractorValidateResults =
    | "manga_url"
    | "chapter_url"
    | boolean;

export interface MangaExtractorSearchResult {
    title: string;
    url: string;
    image?: string;
}

export interface MangaExtractorChapterResult {
    title: string;
    volume: string;
    chapter: string;
    url: string;
}

export interface MangaExtractorInfoResult {
    title: string;
    chapters: MangaExtractorChapterResult[];
}

export interface MangaExtractorChapterPagesEntity {
    page: string;
    url: string;
}

export interface MangaExtractorChapterPagesResult {
    type: "image_urls" | "page_urls";
    entities: MangaExtractorChapterPagesEntity[];
}

export interface MangaExtractorPageImageResult {
    page: string;
    image: string;
}

export interface MangaExtractorModel {
    name: string;
    options: MangaExtractorConstructorOptions;

    validateURL(url: string): MangaExtractorValidateResults;
    search(terms: string): Promise<MangaExtractorSearchResult[]>;
    getInfo(url: string): Promise<MangaExtractorInfoResult>;
    getChapterPages(url: string): Promise<MangaExtractorChapterPagesResult>;
    getPageImage?(url: string): Promise<MangaExtractorPageImageResult>;
}
