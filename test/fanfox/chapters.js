const FanFox = require("../../dist/extractors/manga/fanfox").default;
const util = require("../util");

const MANGA_URL = "https://fanfox.net/manga/masamune_kun_no_revenge/";

const start = async () => {
    const extractor = new FanFox({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
