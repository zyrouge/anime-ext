const Simplydotmoe =
    require("../../dist/lib/extractors/anime/simplydotmoe").default;

const ANIME_URL = "https://simply.moe/anime/86-eighty-six";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Simplydotmoe({
        logger: LOGGER,
    });

    const episodes = await extractor.getEpisodeLinks(ANIME_URL);
    console.log(episodes);
};

start();
