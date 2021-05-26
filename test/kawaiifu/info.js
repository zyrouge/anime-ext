const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;

const ANIME_URL =
    "https://kawaiifu.com/season/winter-2017/masamune-kun-no-revenge.html";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Kawaiifu({
        logger: LOGGER,
    });

    const episodes = await extractor.getInfo(ANIME_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
