const MangaDex = require("../../dist/extractors/manga/mangadex").default;
const util = require("../util");

const MANGA_URL = "https://mangadex.tv/manga/mayo_chiki";

const start = async () => {
    const extractor = new MangaDex({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
