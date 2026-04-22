const { chromium } = require("playwright");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";
const DEFAULT_PASSWORD = "Password@123";

const USERS_TO_FIX = [
    { "email": "v3_tester_1_7526@bhartiyerishtey.com", "name": "Anjali Kumar" },
    { "email": "v3_tester_2_5111@bhartiyerishtey.com", "name": "Sanjay Kumar" },
    { "email": "v3_tester_3_7536@bhartiyerishtey.com", "name": "Megha Kumar" },
    { "email": "v3_tester_4_4048@bhartiyerishtey.com", "name": "Deepak Kumar" },
    { "email": "v3_tester_5_4227@bhartiyerishtey.com", "name": "Neha Kumar" },
    { "email": "v3_tester_6_2782@bhartiyerishtey.com", "name": "Arjun Kumar" },
    { "email": "v3_tester_7_2778@bhartiyerishtey.com", "name": "Kavita Kumar" },
    { "email": "v3_tester_8_1177@bhartiyerishtey.com", "name": "Karan Kumar" },
    { "email": "v3_tester_9_2820@bhartiyerishtey.com", "name": "Priya Kumar" },
    { "email": "v3_tester_10_6239@bhartiyerishtey.com", "name": "Rohit Kumar" },
    { "email": "v3_tester_11_1962@bhartiyerishtey.com", "name": "Sneha Kumar" },
    { "email": "v3_tester_12_2459@bhartiyerishtey.com", "name": "Sanjay Kumar" },
    { "email": "v3_tester_13_5652@bhartiyerishtey.com", "name": "Priya Kumar" },
    { "email": "v3_tester_14_6199@bhartiyerishtey.com", "name": "Vijay Kumar" },
    { "email": "v3_tester_15_1726@bhartiyerishtey.com", "name": "Ritu Kumar" },
    { "email": "v3_tester_16_4271@bhartiyerishtey.com", "name": "Karan Kumar" },
    { "email": "v3_tester_17_8214@bhartiyerishtey.com", "name": "Kavita Kumar" },
    { "email": "v3_tester_18_9351@bhartiyerishtey.com", "name": "Arjun Kumar" },
    { "email": "v3_tester_19_171@bhartiyerishtey.com", "name": "Kavita Kumar" },
    { "email": "v3_tester_20_2231@bhartiyerishtey.com", "name": "Amit Kumar" }
];

async function downloadImage(url, filePath) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
        fs.writeFileSync(filePath, res.data);
        return true;
    } catch (err) {
        return false;
    }
}

(async () => {
    console.log("🛠 Starting UI-ONLY Profile Fixer...");

    const browser = await chromium.launch({ headless: false, slowMo: 300 });
    const stats = { fixed: 0, skipped: 0, failed: 0 };

    for (const user of USERS_TO_FIX) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        page.setDefaultTimeout(60000);

        try {
            console.log(`\n👤 [${user.email}] Processing...`);

            // 1. LOGIN
            console.log("   ➤ Navigating to Login...");
            await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

            await page.fill('#login-email', user.email);
            await page.fill('#login-password', DEFAULT_PASSWORD);
            await page.click('#login-submit');

            // Wait for Dashboard/Profile
            await Promise.race([
                page.waitForURL('**/dashboard', { timeout: 30000 }),
                page.waitForURL('**/profile', { timeout: 30000 })
            ]);
            await page.waitForLoadState('networkidle');
            console.log("   ✅ LOGIN SUCCESS");

            // Navigate to Profile
            await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });

            // Check if fix needed
            const completionText = await page.innerText('div:has-text("% Complete")').catch(() => "0%");
            const percentage = parseInt(completionText) || 0;

            if (percentage < 100) {
                console.log(`   ➤ Filling Profile Form (Current: ${percentage}%)...`);
                
                const isMale = user.name.includes("Amit") || user.name.includes("Rahul") || user.name.includes("Vikas") || user.name.includes("Rohit") || user.name.includes("Karan") || user.name.includes("Sanjay") || user.name.includes("Arjun") || user.name.includes("Vijay") || user.name.includes("Deepak");

                // Fill using exact placeholders or labels
                await page.fill('input[placeholder="Your full name"]', user.name);
                await page.selectOption('select:near(label:has-text("Gender"))', isMale ? "A Groom" : "A Bride");
                await page.fill('input[type="date"]', "1995-10-20");
                await page.fill('input[placeholder="e.g., 170"]', "175");
                
                await page.selectOption('select:near(label:has-text("Religion"))', "Hindu");
                await page.fill('input[placeholder="e.g., Brahmin"]', "General");
                await page.fill('input[placeholder="e.g., Mumbai, MH"]', "Delhi, DL");
                
                await page.fill('input[placeholder="e.g., B.Tech"]', "Graduate");
                await page.fill('input[placeholder="e.g., Software Engineer"]', "Professional");
                await page.selectOption('select:near(label:has-text("Annual Income"))', "10-20L");
                
                await page.fill('textarea[placeholder*="Tell potential matches"]', "I am looking for a life partner who values traditions and has a modern outlook on life.");

                // Upload Photo
                const imgUrl = isMale ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random()*50)}.jpg` : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random()*50)}.jpg`;
                const imgPath = path.resolve(__dirname, `photo_${user.email.split('@')[0]}.jpg`);
                
                if (await downloadImage(imgUrl, imgPath)) {
                    console.log("   ➤ Uploading Photo...");
                    const [fileChooser] = await Promise.all([
                        page.waitForEvent('filechooser'),
                        page.click('span:has-text("add_photo_alternate")')
                    ]);
                    await fileChooser.setFiles(imgPath);
                    await page.waitForTimeout(2000); // Allow preview to load
                    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
                }

                // SAVE FLOW
                console.log("   ➤ Clicking Save Profile...");
                
                // SETUP waitForResponse BEFORE click
                const saveResponsePromise = page.waitForResponse(
                    res => res.url().includes('/api/profile') && res.request().method() === 'PUT',
                    { timeout: 30000 }
                );

                await page.click('button:has-text("Save Profile")');

                const saveResponse = await saveResponsePromise;
                console.log(`   ➤ API Status: ${saveResponse.status()}`);

                if (saveResponse.status() === 200) {
                    await page.waitForSelector('text=Profile saved successfully', { timeout: 10000 });
                    console.log("   ✅ Profile Saved Successfully");
                    stats.fixed++;
                } else {
                    const errorBody = await saveResponse.text();
                    console.error(`   ❌ SAVE FAILED: ${saveResponse.status()} - ${errorBody}`);
                    stats.failed++;
                }
            } else {
                console.log("   ⏭ Profile Already Complete. Skipping.");
                stats.skipped++;
            }

        } catch (err) {
            console.error(`   ❌ ERROR: ${err.message}`);
            stats.failed++;
        } finally {
            await context.close();
        }
    }

    console.log("\n" + "=".repeat(40));
    console.log("🏁 UI AUTOMATION SUMMARY");
    console.log("=".repeat(40));
    console.table({
        "Total": USERS_TO_FIX.length,
        "Fixed": stats.fixed,
        "Skipped": stats.skipped,
        "Failed": stats.failed
    });

    await browser.close();
})();
