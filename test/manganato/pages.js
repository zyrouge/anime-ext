const MangaNato = require("../../dist/extractors/manga/manganato").default;
const util = require("../util");

const MANGA_URL = "https://readmanganato.com/manga-as956601/chapter-1";

const start = async () => {
    const extractor = new MangaNato({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getChapterPages(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
