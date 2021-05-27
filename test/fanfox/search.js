const FanFox = require("../../dist/extractors/manga/fanfox").default;
const util = require("../util");

const SEARCH_TERMS = "masamune kun no revenge";

const start = async () => {
    const extractor = new FanFox({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
