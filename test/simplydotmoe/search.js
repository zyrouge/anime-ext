const Simplydotmoe =
    require("../../dist/extractors/anime/simplydotmoe").default;

const SEARCH_TERMS = "fruit";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
