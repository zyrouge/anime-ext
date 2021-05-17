const Simplydotmoe =
    require("../../dist/lib/extractors/anime/simplydotmoe").default;

const EPISODE_URL = "https://simply.moe/86-eighty-six-episode-01";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: LOGGER,
    });

    const episodes = await extractor.getDownloadLinks(EPISODE_URL);
    console.log(episodes);
};

start();
