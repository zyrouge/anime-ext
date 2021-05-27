export interface Logger {
    info(text: string): string;
    debug(text: string): string;
    error(text: string): string;
}

export interface RequesterOptions {
    headers: Record<string, any>;
    timeout?: number;
    credentials?: boolean;
}

export interface Requester {
    get(url: string, options: RequesterOptions): Promise<string>;
    post(url: string, body: any, options: RequesterOptions): Promise<string>;
}
