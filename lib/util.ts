import util from "util";

export const constants = {
    http: {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        maxTimeout: 10 * 1000,
    },
};

export const functions = {
    sleep: util.promisify(setTimeout),
};
