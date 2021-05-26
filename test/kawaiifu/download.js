const Kawaiifu = require("../../dist/extractors/anime/kawaiifu").default;

const EPISODE_URL =
    "https://domdom.stream/season/winter-2017/masamune-kun-no-revenge.html?ep=12";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Kawaiifu({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
