const Schedule =
    require("../../dist/integrations/myanimelist/schedule").default;
const util = require("../util");

const start = async () => {
    const schedule = await Schedule({
        logger: util.logger,
        http: util.http,
    });

    console.log(schedule);
};

if (!process.env.NODE_ENV) start();

module.exports = start;
