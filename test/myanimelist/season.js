const Season = require("../../dist/integrations/myanimelist/season").default;
const util = require("../util");

const start = async () => {
    const season = await Season({
        logger: util.logger,
        http: util.http,
    });

    console.log(season);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
