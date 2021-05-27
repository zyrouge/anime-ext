const MangaDex = require("../../dist/extractors/manga/mangadex").default;
const util = require("../util");

const SEARCH_TERMS = "mayo chiki";

const start = async () => {
    const extractor = new MangaDex({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
