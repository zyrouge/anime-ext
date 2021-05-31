const got = require("got").default;

module.exports = {
    logger: {
        info: console.log,
        debug: console.log,
        error: console.error,
    },
    http: {
        async get(url, options) {
            const res = await got.get(url, {
                headers: options.headers,
                timeout: options.timeout,
                responseType: "text",
            });

            return res.body;
        },
        async post(url, body, options) {
            const res = await got.post(url, body, {
                headers: options.headers,
                timeout: options.timeout,
                responseType: "text",
            });

            return res.body;
        },
    },
};
