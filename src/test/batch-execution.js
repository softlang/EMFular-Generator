import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

async function runBatch() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  // Treat ALL console errors as fatal
  let processingError = false;

  page.on("console", msg => {
    if (msg.type() === "error") {
      const text = msg.text();
      console.error("CONSOLE ERROR:", text);
      processingError = true;
    }
  });

  // Enable downloads
  const downloadPath = path.resolve("./out");
  fs.mkdirSync(downloadPath, { recursive: true });

  // Per-file choices directory
  const choicesDir = path.resolve("./choices");
  fs.mkdirSync(choicesDir, { recursive: true });

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath
  });

  // Open Angular app
  await page.goto("http://localhost:4200", { waitUntil: "networkidle0" });

  // Find all .ecore files
  const files = fs.readdirSync("./ecores").filter(f => f.endsWith(".ecore"));

  for (const file of files) {
    console.log("Processing:", file);

    // Load per-file choice if exists (not applied yet)
    const choicePath = path.join(choicesDir, file + ".json");
    if (fs.existsSync(choicePath)) {
      const existing = JSON.parse(fs.readFileSync(choicePath, "utf8"));
      console.log("  Found existing choice:", existing);
    }

    // Capture old blob URL BEFORE upload
    const oldHref = await page.evaluate(() => {
      const a = document.getElementById("downloadLink");
      return a ? a.href : null;
    });

    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    // Give Angular time to parse and possibly throw
    await new Promise(r => setTimeout(r, 500));

    if (processingError) {
      console.log("  ✖ Skipping due to console error.");
      processingError = false;
      continue;
    }

    console.log("  Waiting for generation (zip)...");

    // Wait for the blob URL to change (REAL generation completion)
    await page.waitForFunction(
      (oldHref) => {
        const a = document.getElementById("downloadLink");
        return a && a.href && a.href !== oldHref;
      },
      { timeout: 60000 },
      oldHref
    );

    console.log("  Generation complete.");

    // Wait for file to appear
    await new Promise(r => setTimeout(r, 500));

    // Find newest downloaded JSON
    const newest = fs.readdirSync(downloadPath)
      .map(f => ({ f, t: fs.statSync(path.join(downloadPath, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]?.f;

    if (newest && newest.endsWith(".json")) {
      const json = JSON.parse(fs.readFileSync(path.join(downloadPath, newest), "utf8"));

      // Extract package/root from generator output
      const pkg = json.package || json.packageName;
      const root = json.root || json.rootClass;

      if (pkg || root) {
        const newChoice = { ecore: file };
        if (pkg) newChoice.package = pkg;
        if (root) newChoice.root = root;

        console.log("  Writing choice:", newChoice);
        fs.writeFileSync(choicePath, JSON.stringify(newChoice, null, 2));
      }
    }

    console.log("  Done.");
  }

  await browser.close();
}

runBatch();
