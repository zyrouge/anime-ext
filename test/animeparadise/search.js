const AnimeParadise =
    require("../../dist/extractors/anime/animeparadise").default;
const util = require("../util");

const SEARCH_TERMS = "dr. stone";

const start = async () => {
    const extractor = new AnimeParadise({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
