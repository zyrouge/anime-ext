export interface ExtractorConstructorOptions {
    logger?: {
        info?(text: string): string;
        debug?(text: string): string;
        error?(text: string): string;
    };
}

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

export interface ExtractorDownloadResult {
    quality: string;
    url: string;
}

export interface ExtractorModel {
    name: string;
    options: ExtractorConstructorOptions;

    search(terms: string): Promise<ExtractorSearchResult[]>;
    getEpisodeLinks(url: string): Promise<ExtractorEpisodeResult[]>;
    getDownloadLinks(url: string): Promise<ExtractorDownloadResult[]>;
}
