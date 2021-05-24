const MangaDex = require("../../dist/extractors/manga/mangadex").default;

const MANGA_URL = "https://mangadex.tv/manga/mayo_chiki";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new MangaDex({
        logger: LOGGER,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
