const ReadM = require("../../dist/extractors/manga/readm").default;
const util = require("../util");

const SEARCH_TERMS = "masamune";

const start = async () => {
    const extractor = new ReadM({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
