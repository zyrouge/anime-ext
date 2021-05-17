const { execSync } = require("child_process");

const log = (tag, txt) => console.log(`[${tag}] ${txt}`);
const exec = (...args) => execSync(...args).toString();

const build = () => {
    const stdout = exec("npm run build");
    log("ts-build", "Build success");
    if (stdout) log("ts-build", stdout);
};

const version = () => {
    if (process.argv.includes("--no-version")) {
        log("version", "Skipping version due to '--no-version' arg!");
        return;
    }

    const stdout = exec("npm version patch");
    if (stdout) log("version", `Version updated to ${stdout.trim()}!`);
};

const git = () => {
    if (process.argv.includes("--no-git")) {
        log("Skipping git due to '--no-git' arg!");
        return;
    }

    {
        const stdout = exec("git add .");
        log("git", "Added files to git!");
        if (stdout) log("git", stdout);
    }

    {
        const stdout = exec(
            `git commit -m "${require("../package.json").version}"`
        );
        log("git", "Committed files to git!");
        if (stdout) log("git", stdout);
    }
};

const push = () => {
    if (process.argv.includes("--no-push")) {
        log("Skipping push due to '--no-push' arg!");
        return;
    }

    const stdout = exec("git push");
    log("git", "Pushed files to git!");
    if (stdout) log("git", stdout);
};

const merge = () => {
    if (process.argv.includes("--no-merge")) {
        log("Skipping merge due to '--no-merge' arg!");
        return;
    }

    {
        const stdout = exec("git checkout main");
        log("git", "Switched to main branch!");
        if (stdout) log("git", stdout);
    }

    git();
    push();

    {
        const stdout = exec("git checkout next");
        log("git", "Switched back to next branch!");
        if (stdout) log("git", stdout);
    }
};

const start = () => {
    const start = Date.now();

    build();
    git();
    version();
    push();
    merge();

    log("release-it", `Successfully completed in ${Date.now() - start}ms!`);
};

start();
