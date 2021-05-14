export interface Logger {
    info(text: string): string;
    debug(text: string): string;
    error(text: string): string;
}
