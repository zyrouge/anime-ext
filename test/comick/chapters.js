const ComicK = require("../../dist/extractors/manga/comick").default;
const util = require("../util");

const MANGA_URL =
    "https://comick.fun/comic/masamune-kun-no-revenge?chap-order=0";

const start = async () => {
    const extractor = new ComicK({
        logger: util.logger,
        http: util.http,
    });

    const chapters = await extractor.getInfo(MANGA_URL);
    console.log(chapters);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
