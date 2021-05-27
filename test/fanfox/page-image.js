const FanFox = require("../../dist/extractors/manga/fanfox").default;
const util = require("../util");

const PAGE_URL =
    "https://m.fanfox.net/manga/masamune_kun_no_revenge/v01/c001/48.html";

const start = async () => {
    const extractor = new FanFox({
        logger: util.logger,
        http: util.http,
    });

    const page = await extractor.getPageImage(PAGE_URL);
    console.log(page);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
