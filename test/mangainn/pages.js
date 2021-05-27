const MangaInn = require("../../dist/extractors/manga/mangainn").default;
const util = require("../util");

const MANGA_URL = "https://www.mangainn.net/mayo-chiki/2/1";

const start = async () => {
    const extractor = new MangaInn({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getChapterPages(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
