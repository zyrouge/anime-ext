const MangaInn = require("../../dist/extractors/manga/mangainn").default;

const MANGA_URL = "https://www.mangainn.net/mayo-chiki/";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new MangaInn({
        logger: LOGGER,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;