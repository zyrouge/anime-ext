const Gogostream = require("../../dist/extractors/anime/gogostream").default;

const SEARCH_TERMS = "mayo chiki";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogostream({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;