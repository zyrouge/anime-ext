const Twistdotmoe = require("../../dist/lib/extractors/twistdotmoe").default;

const SEARCH_TERMS = "bunny girl senpai";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Twistdotmoe({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

start();
