const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;
const util = require("../util");

const ANIME_URL =
    "https://kawaiifu.com/season/winter-2017/masamune-kun-no-revenge.html";

const start = async () => {
    const extractor = new Kawaiifu({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
