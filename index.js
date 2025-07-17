//!/usr/bin/env node

// =========================
// Imports & Config
// =========================
import { retro } from "gradient-string";
import {
  createInterface,
  emitKeypressEvents,
  clearLine,
  cursorTo,
} from "readline";
import { Chalk as _Chalk } from "chalk";
import { exec, spawn } from "child_process";
import path from "path";
import fs from "fs";

try {
  const chalk = new _Chalk();
  const termW = process.stdout.columns || 80;
  const promptIndent = "      ";

  console.clear();

  // =========================
  // Logo (Responsive)
  // =========================
  const picoLogo = `█▀▀ █▀▀█ █▀▀ █▀▀█ ▀▀█▀▀ █▀▀ ░░ █▀▀█ ░▀░ █▀▀ █▀▀█ ░░ █▀▀█ █▀▀█ █▀▀█ 
█░░ █▄▄▀ █▀▀ █▄▄█ ░░█░░ █▀▀ ▀▀ █░░█ ▀█▀ █░░ █░░█ ▀▀ █▄▄█ █░░█ █░░█ 
▀▀▀ ▀░▀▀ ▀▀▀ ▀░░▀ ░░▀░░ ▀▀▀ ░░ █▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀▀ ░░ ▀░░▀ █▀▀▀ █▀▀▀ `;

  const create = `█▀▀ █▀▀█ █▀▀ █▀▀█ ▀▀█▀▀ █▀▀ 
█░░ █▄▄▀ █▀▀ █▄▄█ ░░█░░ █▀▀ 
▀▀▀ ▀░▀▀ ▀▀▀ ▀░░▀ ░░▀░░ ▀▀▀ `;

  const pico = `█▀▀█ ░▀░ █▀▀ █▀▀█ 
█░░█ ▀█▀ █░░ █░░█ 
█▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀▀ `;

  const app = `█▀▀█ █▀▀█ █▀▀█ 
█▄▄█ █░░█ █░░█ 
▀░░▀ █▀▀▀ █▀▀▀ `;

  if (picoLogo.split("\n")[0].length > termW) {
    [create, pico, app].forEach((elem) => {
      elem.split("\n").forEach((line) => console.log(retro(centerText(line))));
    });
  } else {
    picoLogo
      .split("\n")
      .forEach((line) => console.log(retro(centerText(line))));
  }

  console.log("");
  console.log(
    chalk.yellow("      create-pico-app"),
    chalk.yellowBright("v1.0.0")
  );
  console.log("");
  console.log(chalk.blueBright("   ◼  Where should we create your new app?"));

  // =========================
  // Utility Functions
  // =========================
  function centerText(txt) {
    const spaces = Math.max(0, Math.floor((termW - txt.length) / 2));
    return " ".repeat(spaces) + txt;
  }

  async function inputWithPlaceholder(placeholder) {
    return new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });
      let input = "";
      let run = true;
      process.stdout.write(promptIndent + chalk.gray(placeholder));
      process.stdin.setRawMode(true);
      emitKeypressEvents(process.stdin);

      const redrawLine = () => {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0);
        process.stdout.write(
          promptIndent + (input.length === 0 ? chalk.gray(placeholder) : input)
        );
      };

      process.stdin.on("keypress", (str, key) => {
        if (!run) return;
        if (key.sequence === "\r") {
          process.stdout.write("\n");
          rl.close();
          resolve(input || placeholder);
          run = false;
        } else if (key.name === "backspace") {
          input = input.slice(0, -1);
          redrawLine();
        } else if (key.sequence >= " " && key.sequence <= "~") {
          input += key.sequence;
          redrawLine();
        }
      });
    });
  }

  function yesOrNoInput(question) {
    return new Promise((resolve) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });
      console.log(question);
      process.stdout.write(promptIndent + chalk.gray("(Y/N)"));
      emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      function redraw(selected) {
        clearLine(process.stdout, 0);
        cursorTo(process.stdout, 0);
        const y = selected === true ? chalk.whiteBright("Y") : "Y";
        const n = selected === false ? chalk.whiteBright("N") : "N";
        process.stdout.write(promptIndent + chalk.gray(`(${y}/${n})`));
        if (selected !== null) {
          process.stdin.setRawMode(false);
          rl.close();
          resolve(selected);
        }
      }

      process.stdin.on("keypress", (str, key) => {
        if (key.name === "y") redraw(true);
        else if (key.name === "n") redraw(false);
      });
    });
  }

  // =========================
  // Get Valid Project Path
  // =========================
  let APP_PATH = "";
  while (true) {
    APP_PATH = await inputWithPlaceholder("./my-new-app");
    if (fs.existsSync(APP_PATH)) {
      console.log(
        chalk.redBright(
          "  💀  That folder already exists. Please choose another name."
        )
      );
    } else {
      break;
    }
  }

  // =========================
  // Loading Animation
  // =========================
  let i = 0,
    interval = null,
    drawing = true;
  const gradientText = retro("███████████████████");
  const chars = Array.from(gradientText.match(/(?:\x1b\[[0-9;]*m)?█/g));
  const smoothChars = [...chars, ...[...chars].reverse()];

  function startLoadingAnimation(text) {
    drawing = true;
    interval = setInterval(() => {
      if (!drawing) return;
      const frame = smoothChars
        .slice(i % smoothChars.length, (i + 4) % smoothChars.length)
        .join("");
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(` ${frame} ${chalk.yellowBright(text)}`);
      i++;
    }, 100);
  }

  function stopLoadingAnimation() {
    drawing = false;
    clearInterval(interval);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }

  // =========================
  // Actions
  // =========================
  function cloneTemplate(dest) {
    return new Promise((resolve, reject) => {
      const repoURL =
        "https://github.com/pico190/pico-reactrouter-template.git";
      exec(`git clone --depth 1 ${repoURL} "${dest}"`, (err) => {
        if (err) return reject(err);
        exec(`rm -rf "${path.join(dest, ".git")}"`, resolve);
      });
    });
  }

  function installDependencies() {
    return new Promise((resolve, reject) => {
      exec(`cd ${APP_PATH} && npm install`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function initializeGit() {
    return new Promise((resolve, reject) => {
      exec(`cd ${APP_PATH} && git init`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function openProjectInVscode() {
    return new Promise((resolve, reject) => {
      exec(`code ${APP_PATH}`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  function runDev() {
    return new Promise((resolve, reject) => {
      const child = spawn("npm", ["run", "dev"], {
        cwd: APP_PATH,
        stdio: "inherit", // Inherit parent stdio (console)
        shell: true, // Necesario para que funcione bien en Windows y Linux
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          console.error(`  💀  npm run dev exited with code ${code}`);
          reject(new Error(`npm run dev failed with code ${code}`));
        }
      });
    });
  }

  // =========================
  // Execute Setup Steps
  // =========================
  startLoadingAnimation("Copying files...");
  await cloneTemplate(APP_PATH);
  stopLoadingAnimation();
  console.log(`${chalk.greenBright("   ✔  Template copied.\n")}`);

  if (
    await yesOrNoInput(
      chalk.blueBright("   ◼  Do you want to install dependencies?")
    )
  ) {
    console.log("");
    console.log("");
    startLoadingAnimation("Installing dependencies...");
    await installDependencies();
    stopLoadingAnimation();
    console.log(`${chalk.greenBright("   ✔  Dependencies installed.\n")}`);
  } else {
    console.log(
      `${chalk.yellowBright("\n\n   ▢  Dependencies were not installed.\n")}`
    );
  }

  if (
    await yesOrNoInput(chalk.blueBright("   ◼  Do you want to initialize git?"))
  ) {
    console.log("");
    console.log("");
    startLoadingAnimation("Initializing git...");
    await initializeGit();
    stopLoadingAnimation();
    console.log(`${chalk.greenBright("   ✔  Git initialized.\n")}`);
  } else {
    console.log(
      `${chalk.yellowBright("\n\n   ▢  Git was not initialized.\n")}`
    );
  }

  if (
    await yesOrNoInput(
      chalk.blueBright("   ◼  Do you want to open project in vscode?")
    )
  ) {
    console.log("");
    console.log("");
    startLoadingAnimation("Opening project in vscode...");
    await openProjectInVscode();
    stopLoadingAnimation();
    console.log(`${chalk.greenBright("   ✔  Project opened in VSCode.\n")}`);
  } else {
    console.log(
      `${chalk.yellowBright("\n\n   ▢  Project was not opened in vscode.\n")}`
    );
  }

  if (
    await yesOrNoInput(
      `${chalk.blueBright("   ◼  Do you want to run")} ${chalk.blue(
        "npm run dev"
      )} ${chalk.blueBright("?")}`
    )
  ) {
    console.clear();
    runDev();
  } else {
    console.log(`${chalk.yellowBright("   ▢  Okay! That's it.")}`);
  }
} catch (err) {
  console.log("   💀  Something went wrong. Please try again.");
  console.error(err);
}
