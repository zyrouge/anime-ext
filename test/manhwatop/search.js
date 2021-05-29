const Manhwatop = require("../../dist/extractors/manga/manhwatop").default;
const util = require("../util");

const SEARCH_TERMS = "sweet home";

const start = async () => {
    const extractor = new Manhwatop({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
