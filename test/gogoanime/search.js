const Gogoanime = require("../../dist/extractors/anime/gogoanime").default;
const util = require("../util");

const SEARCH_TERMS = "highschool dxd";

const start = async () => {
    const extractor = new Gogoanime({
        logger: util.logger,
        http: util.http,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
