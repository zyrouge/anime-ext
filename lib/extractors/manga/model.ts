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

export interface MangaExtractorChapterPagesResult {
    page: number;
    image: string;
}

export interface MangaExtractorModel {
    name: string;
    options: MangaExtractorConstructorOptions;

    validateURL(url: string): MangaExtractorValidateResults;
    search(terms: string): Promise<MangaExtractorSearchResult[]>;
    getChapterLinks(url: string): Promise<MangaExtractorChapterResult[]>;
    getChapterPageImages(
        url: string
    ): Promise<MangaExtractorChapterPagesResult[]>;
}
