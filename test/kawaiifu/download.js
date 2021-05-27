const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;
const util = require("../util");

const EPISODE_URL =
    "https://domdom.stream/season/winter-2017/masamune-kun-no-revenge.html?ep=12";

const start = async () => {
    const extractor = new Kawaiifu({
        logger: util.logger,
        http: util.http,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
