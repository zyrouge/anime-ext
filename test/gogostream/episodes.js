const Gogostream =
    require("../../dist/lib/extractors/anime/gogostream").default;

const ANIME_URL = "https://gogo-stream.com/videos/mayo-chiki-dub-episode-13";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogostream({
        logger: LOGGER,
    });

    const episodes = await extractor.getEpisodeLinks(ANIME_URL);
    console.log(episodes);
};

start();
