const FourAnime = require("../../dist/extractors/anime/4anime").default;

const SEARCH_TERMS = "highschool dxd";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new FourAnime({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
