const Manhwatop = require("../../dist/extractors/manga/manhwatop").default;
const util = require("../util");

const MANGA_URL = "https://manhwatop.com/manga/sweet-home";

const start = async () => {
    const extractor = new Manhwatop({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
