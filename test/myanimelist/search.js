const search =
    require("../../dist/lib/integrations/myanimelist/search-anime").default;

const SEARCH_TERMS = "mayo chiki";

const LOGGER = {
    info: console.log,
    debug: console.log,
    error: console.error,
};

const start = async () => {
    const results = await search(SEARCH_TERMS, {
        logger: LOGGER,
    });

    console.log(results);
};

start();
