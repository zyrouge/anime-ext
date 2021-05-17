const child_process = require("child_process");
const util = require("util");

const log = (tag, txt) => console.log(`[${tag}] ${txt}`);
const err = (tag, txt) => console.error(`[${tag}] ${txt}`);
const exec = util.promisify(child_process.exec);

const build = async () => {
    const { stdout, stderr } = await exec("npm run build");
    if (stderr) {
        log("ts-build", "Build failed!");
        err("ts-build", stderr);
        return;
    }

    log("ts-build", "Build success");
    log("ts-build", stdout);
};

const version = async () => {
    if (process.argv.includes("--no-version")) {
        log("version", "Skipping version due to '--no-version' arg!");
        return;
    }

    const { stdout, stderr } = await exec("npm version patch");
    if (stderr) {
        log("version", "Version update failed!");
        err("version", stderr);
        return;
    }

    log("version", `Version updated to ${stdout}!`);
};

const git = async () => {
    if (process.argv.includes("--no-git")) {
        log("Skipping git due to '--no-git' arg!");
        return;
    }

    {
        const { stdout, stderr } = await exec("git add .");
        if (stderr) {
            log("git", "Failed to add files!");
            err("git", stderr);
            return;
        }

        log("git", "Added files to git!");
        log("git", stdout);
    }

    {
        const { stdout, stderr } = await exec(
            `git commit -m "${require("../package.json").version}"`
        );
        if (stderr) {
            log("git", "Failed to commit files!");
            err("git", stderr);
            return;
        }

        log("git", "Committed files to git!");
        log("git", stdout);
    }
};

const push = async () => {
    if (process.argv.includes("--no-push")) {
        log("Skipping push due to '--no-push' arg!");
        return;
    }

    const { stdout, stderr } = await exec("git push");
    if (stderr) {
        log("git", "Failed to push files!");
        err("git", stderr);
        return;
    }

    log("git", "Pushed files to git!");
    log("git", stdout);
};

const merge = async () => {
    if (process.argv.includes("--no-merge")) {
        log("Skipping merge due to '--no-merge' arg!");
        return;
    }

    {
        const { stdout, stderr } = await exec("git checkout main");
        if (stderr) {
            log("git", "Failed to switch to main branch!");
            err("git", stderr);
            return;
        }

        log("git", "Switched to main branch!");
        log("git", stdout);
    }

    await git();
    await push();

    {
        const { stdout, stderr } = await exec("git checkout next");
        if (stderr) {
            log("git", "Failed to switch to next branch!");
            err("git", stderr);
            return;
        }

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
