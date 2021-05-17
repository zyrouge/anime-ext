const FanFox = require("../../dist/lib/extractors/manga/fanfox").default;

const MANGA_URL = "https://fanfox.net/manga/masamune_kun_no_revenge/";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new FanFox({
        logger: LOGGER,
    });

    const chapters = await extractor.getChapterLinks(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
