const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;
const util = require("../util");

const SEARCH_TERMS = "masamune kun no revenge";

const start = async () => {
    const extractor = new Kawaiifu({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
