const FourAnime = require("../../dist/extractors/anime/4anime").default;
const util = require("../util");

const SEARCH_TERMS = "highschool dxd";

const start = async () => {
    const extractor = new FourAnime({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
