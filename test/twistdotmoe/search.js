const Twistdotmoe = require("../../dist/extractors/anime/twistdotmoe").default;
const util = require("../util");

const SEARCH_TERMS = "bunny girl senpai";

const start = async () => {
    const extractor = new Twistdotmoe({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
