export const constants = {
    http: {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        maxTimeout: 10 * 1000,
    },
};

export const functions = {
    sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    },
    encodeURI(url: string) {
        if (url === decodeURI(url)) return encodeURI(url);
        return url;
    },
};
