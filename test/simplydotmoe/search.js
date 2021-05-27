const Simplydotmoe =
    require("../../dist/extractors/anime/simplydotmoe").default;
const util = require("../util");

const SEARCH_TERMS = "fruit";

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
