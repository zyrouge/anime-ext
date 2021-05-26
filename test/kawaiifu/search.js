const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;

const SEARCH_TERMS = "masamune kun no revenge";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Kawaiifu({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
