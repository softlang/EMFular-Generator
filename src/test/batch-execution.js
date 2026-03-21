import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// --- CENTRALIZED SELECTORS ---
const MODAL_SELECTOR =
  "mat-dialog-container, .mat-dialog-container, .mat-mdc-dialog-container";

// --- Passive modal helpers ---
async function waitForModal(page, timeout = 2000) {
  try {
    await page.waitForSelector(MODAL_SELECTOR, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function extractModalData(page) {
  // 1. Wait for modal to appear
  try {
    await page.waitForSelector(MODAL_SELECTOR, { timeout: 10000 });
  } catch {
    return null;
  }

  // 2. Extract candidates (sync DOM code)
  const candidates = await page.evaluate((MODAL_SELECTOR) => {
    const modal = document.querySelector(MODAL_SELECTOR);
    if (!modal) return [];

    const radios = Array.from(modal.querySelectorAll("mat-radio-button"));
    return radios.map(r => {
      const label = r.querySelector("label");
      return label ? label.innerText.trim() : "(missing label)";
    });
  }, MODAL_SELECTOR);

  // 3. Track checked radio while dialog is open
  let lastChosen = null;

  while (true) {
    const state = await page.evaluate((MODAL_SELECTOR) => {
      const modal = document.querySelector(MODAL_SELECTOR);
      if (!modal) {
        return { open: false, chosen: null };
      }

      const selected = modal.querySelector("mat-radio-button.mat-mdc-radio-checked");
      if (!selected) {
        return { open: true, chosen: null };
      }

      const label = selected.querySelector("label");
      const chosen = label ? label.innerText.trim() : null;
      return { open: true, chosen };
    }, MODAL_SELECTOR);

    if (!state.open) break;
    if (state.chosen) lastChosen = state.chosen;

    await new Promise(r => setTimeout(r, 100));
  }

  return { candidates, chosen: lastChosen };
}

async function waitForModalClose(page) {
  await page.waitForFunction(
    (selector) => !document.querySelector(selector),
    { timeout: 60000 },
    MODAL_SELECTOR
  );
}

// --- Override setter ---
async function setOverrideFields(page, choice) {
  if (choice.package) {
    await page.evaluate(value => {
      const el = document.getElementById("packageOverride");
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, choice.package);
  }

  if (choice.root) {
    await page.evaluate(value => {
      const el = document.getElementById("rootOverride");
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, choice.root);
  }
}

async function runBatch() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  let processingError = false;

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.error("CONSOLE ERROR:", msg.text());
      processingError = true;
    }
  });

  const downloadPath = path.resolve("./out");
  fs.mkdirSync(downloadPath, { recursive: true });

  const choicesDir = path.resolve("./choices");
  fs.mkdirSync(choicesDir, { recursive: true });

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath
  });

  await page.goto("http://localhost:4200", { waitUntil: "networkidle0" });

  const files = fs.readdirSync("./ecores").filter(f => f.endsWith(".ecore"));

  for (const file of files) {
    console.log("Processing:", file);

    const choicePath = path.join(choicesDir, file + ".json");
    const hasChoice = fs.existsSync(choicePath);

    if (hasChoice) {
      const choice = JSON.parse(fs.readFileSync(choicePath, "utf8"));
      console.log("  Found existing choice:", choice);
      await setOverrideFields(page, choice);
    }

    const oldHref = await page.evaluate(() => {
      const a = document.getElementById("downloadLink");
      return a ? a.href : null;
    });

    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    await new Promise(r => setTimeout(r, 500));

    if (processingError) {
      console.log("  ✖ Skipping due to console error.");
      processingError = false;
      continue;
    }

    // --- Passive modal reading ---
    if (!hasChoice) {
      console.log("  No choice file → passively reading dialogs");

      let packageCandidates, packageChoice;
      let rootCandidates, rootChoice;

      // PACKAGE MODAL
      if (await waitForModal(page, 10000)) {
        const data = await extractModalData(page);
        if (data) {
          packageCandidates = data.candidates;
          packageChoice = data.chosen;
          console.log("  Package modal:", data);
        }
        await waitForModalClose(page);
      }

      // ROOT MODAL
      if (await waitForModal(page, 10000)) {
        const data = await extractModalData(page);
        if (data) {
          rootCandidates = data.candidates;
          rootChoice = data.chosen;
          console.log("  Root modal:", data);
        }
        await waitForModalClose(page);
      }

      if (packageChoice || rootChoice) {
        const choice = {
          ecore: file,
          packageCandidates,
          package: packageChoice,
          rootCandidates,
          root: rootChoice
        };
        fs.writeFileSync(choicePath, JSON.stringify(choice, null, 2));
        console.log("  Stored new choice:", choicePath);
      }
    }

    // --- Wait for generation ---
    console.log("  Waiting for generation (zip)...");
    await page.waitForFunction(
      oldHref => {
        const a = document.getElementById("downloadLink");
        return a && a.href && a.href !== oldHref;
      },
      { timeout: 60000 },
      oldHref
    );

    console.log("  Generation complete.");
    console.log("  Done.");
  }

  await browser.close();
}

runBatch();
