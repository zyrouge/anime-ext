const Gogostream = require("../../dist/lib/extractors/gogostream").default;

const SEARCH_TERMS = "mayo chiki";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const extractor = new Gogostream({
        logger: LOGGER,
    });

    const search = await extractor.search(SEARCH_TERMS);
    console.log(search);
};

start();
