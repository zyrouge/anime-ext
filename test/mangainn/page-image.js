const MangaInn = require("../../dist/extractors/manga/mangainn").default;

const PAGE_URL = "https://www.mangainn.net/mayo-chiki/2/1";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new MangaInn({
        logger: LOGGER,
    });

    const page = await extractor.getPageImage(PAGE_URL);
    console.log(page);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
