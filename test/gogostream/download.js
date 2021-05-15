const Gogostream = require("../../dist/lib/extractors/gogostream").default;

const EPISODE_URL = "https://gogo-stream.com/videos/mayo-chiki-dub-episode-13";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogostream({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

start();
