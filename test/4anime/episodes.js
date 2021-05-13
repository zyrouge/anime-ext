const FourAnime = require("../dist/extractors/4anime").default;

const ANIME_URL = "https://4anime.to/anime/high-school-dxd";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new FourAnime({
        logger: LOGGER,
    });

    const episodes = await extractor.getEpisodeLinks(ANIME_URL);
    console.log(episodes);
};

start();
