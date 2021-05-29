const axios = require("axios").default;

module.exports = {
    logger: {
        info: console.log,
        debug: console.log,
        error: console.error,
    },
    http: {
        async get(url, options) {
            const { data } = await axios.get(url, {
                headers: options.headers,
                withCredentials: options.credentials,
                timeout: options.timeout,
                responseType: "text",
            });

            return data;
        },
        async post(url, body, options) {
            const { data } = await axios.post(url, body, {
                headers: options.headers,
                withCredentials: options.credentials,
                timeout: options.timeout,
                responseType: "text",
            });

            return data;
        },
    },
};
