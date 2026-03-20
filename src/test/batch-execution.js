import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

async function runBatch() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  // Enable downloads
  const downloadPath = path.resolve("./out");
  fs.mkdirSync(downloadPath, { recursive: true });

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath
  });

  // Open your running Angular app
  await page.goto("http://localhost:4200", { waitUntil: "networkidle0" });

  // Find all .ecore files
  const files = fs.readdirSync("./ecores").filter(f => f.endsWith(".ecore"));

  for (const file of files) {
    console.log("Processing:", file);

    // Upload file via hidden input
    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    // Wait for the ZIP to be downloaded
    console.log("  Waiting for ZIP...");
    await waitForNewFile(downloadPath);

    console.log("  Done.");
  }

  await browser.close();
}

async function waitForNewFile(dir) {
  const before = new Set(fs.readdirSync(dir));
  while (true) {
    await new Promise(r => setTimeout(r, 500));
    const after = new Set(fs.readdirSync(dir));
    for (const f of after) {
      if (!before.has(f)) return f;
    }
  }
}

runBatch();
