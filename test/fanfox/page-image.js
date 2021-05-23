const FanFox = require("../../dist/extractors/manga/fanfox").default;

const PAGE_URL =
    "https://m.fanfox.net/manga/masamune_kun_no_revenge/v01/c001/48.html";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new FanFox({
        logger: LOGGER,
    });

    const page = await extractor.getPageImage(PAGE_URL);
    console.log(page);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
