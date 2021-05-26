const TenshiDotMoe =
    require("../../dist/extractors/anime/tenshidotmoe").default;

const SEARCH_TERMS = "masamune";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new TenshiDotMoe({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
