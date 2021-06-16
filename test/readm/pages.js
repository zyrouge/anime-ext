const ReadM = require("../../dist/extractors/manga/readm").default;
const util = require("../util");

const MANGA_URL = "https://readm.org/manga/4669/2/all-pages";

const start = async () => {
    const extractor = new ReadM({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getChapterPages(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
