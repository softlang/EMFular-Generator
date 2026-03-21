import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// --- Passive modal helpers ---
async function waitForModal(page, timeout = 2000) {
  try {
    await page.waitForSelector(".mat-dialog-container", { timeout });
    return true;
  } catch {
    return false;
  }
}

async function extractModalData(page) {
  return await page.evaluate(() => {
    const modal = document.querySelector(".mat-dialog-container");
    if (!modal) return null;

    const radios = Array.from(modal.querySelectorAll("mat-radio-button"));
    const candidates = radios.map(r => r.innerText.trim());

    const selected = radios.find(r => r.classList.contains("mat-radio-checked"));
    const chosen = selected ? selected.innerText.trim() : null;

    return { candidates, chosen };
  });
}

async function waitForModalClose(page) {
  await page.waitForFunction(() => {
    return !document.querySelector(".mat-dialog-container");
  }, { timeout: 60000 });
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

    // --- STEP 1: Load choice file BEFORE upload ---
    let choice = { ecore: file };
    const hasChoice = fs.existsSync(choicePath);

    if (hasChoice) {
      choice = JSON.parse(fs.readFileSync(choicePath, "utf8"));
      console.log("  Found existing choice:", choice);

      // --- STEP 2: Apply overrides BEFORE upload ---
      await setOverrideFields(page, choice);
    }

    // Capture old blob URL BEFORE upload
    const oldHref = await page.evaluate(() => {
      const a = document.getElementById("downloadLink");
      return a ? a.href : null;
    });

    // Upload file
    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    await new Promise(r => setTimeout(r, 500));

    if (processingError) {
      console.log("  ✖ Skipping due to console error.");
      processingError = false;
      continue;
    }

    // --- STEP 3: Passive modal reading ONLY if no choice file exists ---
    if (!hasChoice) {
      console.log("  No choice file → passively reading dialogs");

      // PACKAGE MODAL
      if (await waitForModal(page, 5000)) {
        const data = await extractModalData(page);
        if (data) {
          choice.packageCandidates = data.candidates;
          choice.package = data.chosen;
          console.log("  Package modal:", data);
        }
        await waitForModalClose(page); // user clicks
      }

      // ROOT MODAL
      if (await waitForModal(page, 2000)) {
        const data = await extractModalData(page);
        if (data) {
          choice.rootCandidates = data.candidates;
          choice.root = data.chosen;
          console.log("  Root modal:", data);
        }
        await waitForModalClose(page); // user clicks
      }

      fs.writeFileSync(choicePath, JSON.stringify(choice, null, 2));
      console.log("  Stored new choice:", choicePath);
    }

    // --- STEP 4: Always wait for generation to finish ---
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
