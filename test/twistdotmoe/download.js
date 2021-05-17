const Twistdotmoe =
    require("../../dist/lib/extractors/anime/twistdotmoe").default;

const EPISODE_URL =
    "https://twist.moe/a/seishun-buta-yarou-wa-bunny-girl-senpai-no-yume-wo-minai/13";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Twistdotmoe({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

start();
