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

    // Take baseline BEFORE upload
    const before = new Set(fs.readdirSync(downloadPath));

    // Upload file
    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    // Give Angular time to parse and possibly throw
    await new Promise(r => setTimeout(r, 500));

    // Skip if Angular logged ANY error
    if (processingError) {
      console.log("  ✖ Skipping due to console error.");
      processingError = false;
      continue;
    }

    console.log("  Waiting for ZIP...");

    // Wait for new file with timeout
    const zip = await waitForNewFile(downloadPath, before, 15000);

    if (!zip) {
      console.log("  ✖ Timeout waiting for ZIP.");
      continue;
    }

    console.log("  ZIP downloaded:", zip);
    console.log("  Done.");
  }

  await browser.close();
}

async function waitForNewFile(dir, before, timeoutMs) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 300));

    const after = new Set(fs.readdirSync(dir));
    for (const f of after) {
      if (!before.has(f)) return f;
    }
  }

  return null; // timeout
}

runBatch();
