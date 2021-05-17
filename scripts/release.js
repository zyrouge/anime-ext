const child_process = require("child_process");
const util = require("util");

const log = (tag, txt) => console.log(`[${tag}] ${txt}`);

const exec = util.promisify(child_process.exec);

const build = async () => {
    const { stdout } = await exec("npm run build");
    log("ts-build", "Build success");
    log("ts-build", stdout);
};

const version = async () => {
    if (process.argv.includes("--no-version")) {
        log("version", "Skipping version due to '--no-version' arg!");
        return;
    }

    const { stdout } = await exec("npm version patch");
    log("version", `Version updated to ${stdout.trim()}!`);
};

const git = async () => {
    if (process.argv.includes("--no-git")) {
        log("Skipping git due to '--no-git' arg!");
        return;
    }

    {
        const { stdout } = await exec("git add .");
        log("git", "Added files to git!");
        log("git", stdout);
    }

    {
        const { stdout } = await exec(
            `git commit -m "${require("../package.json").version}"`
        );
        log("git", "Committed files to git!");
        log("git", stdout);
    }
};

const push = async () => {
    if (process.argv.includes("--no-push")) {
        log("Skipping push due to '--no-push' arg!");
        return;
    }

    const { stdout } = await exec("git push");
    log("git", "Pushed files to git!");
    log("git", stdout);
};

const merge = async () => {
    if (process.argv.includes("--no-merge")) {
        log("Skipping merge due to '--no-merge' arg!");
        return;
    }

    {
        const { stdout } = await exec("git checkout main");
        log("git", "Switched to main branch!");
        log("git", stdout);
    }

    await git();
    await push();

    {
        const { stdout } = await exec("git checkout next");
        log("git", "Switched back to next branch!");
        log("git", stdout);
    }
};

const start = async () => {
    const start = Date.now();

    await build();
    await git();
    await version();
    await push();
    await merge();

    log("release-it", `Successfully completed in ${Date.now() - start}ms!`);
};

start();
