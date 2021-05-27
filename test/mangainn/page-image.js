const MangaInn = require("../../dist/extractors/manga/mangainn").default;
const util = require("../util");

const PAGE_URL = "https://www.mangainn.net/mayo-chiki/2/1";

const start = async () => {
    const extractor = new MangaInn({
        logger: util.logger,
        http: util.http,
    });

    const page = await extractor.getPageImage(PAGE_URL);
    console.log(page);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
