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

    const input = await page.$("input[type=file]");
    await input.uploadFile(`./ecores/${file}`);

    // Give Angular time to parse and possibly throw
    await new Promise(r => setTimeout(r, 500));

    if (processingError) {
      console.log("  ✖ Skipping due to console error.");
      processingError = false;
      continue;
    }

    console.log("  Waiting for download anchor...");

    await page.waitForFunction(() => {
      const a = document.getElementById('downloadLink');
      return a && a.href && a.href.startsWith('blob:');
    }, { timeout: 15000 });

    console.log("  Download anchor detected.");
    console.log("  Done.");
  }

  await browser.close();
}

runBatch();
