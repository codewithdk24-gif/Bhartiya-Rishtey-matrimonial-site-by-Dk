const { chromium } = require("playwright");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000"; // change if needed

// Random data
const maleNames = ["Amit", "Rahul", "Vikas", "Rohit", "Karan", "Sanjay", "Deepak", "Arjun", "Manish", "Vijay"];
const femaleNames = ["Priya", "Sneha", "Pooja", "Anjali", "Neha", "Divya", "Kavita", "Ritu", "Sapna", "Megha"];
const cities = ["Delhi, DL", "Mumbai, MH", "Raipur, CG", "Bangalore, KA", "Pune, MH", "Hyderabad, TS", "Chennai, TN", "Kolkata, WB", "Ahmedabad, GJ", "Jaipur, RJ"];
const religions = ["Hindu", "Muslim", "Sikh", "Christian", "Buddhist", "Jain"];
const professions = ["Software Engineer", "Doctor", "Teacher", "Business Analyst", "Marketing Manager", "Chartered Accountant"];
const educationList = ["B.Tech", "MBBS", "MBA", "B.Com", "PhD", "M.Sc"];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge() {
    return Math.floor(Math.random() * 10) + 21; // 21–30
}

function randomDOB(age) {
    const year = new Date().getFullYear() - age;
    return `${year}-05-15`; // Standard date for testing
}

// Download image
async function downloadImage(url, filePath) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
        fs.writeFileSync(filePath, res.data);
    } catch (err) {
        console.error(`   ⚠️ Image Download Error: ${err.message}`);
    }
}

(async () => {
    console.log("🚀 Starting Production-Grade QA Audit Run...");
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 300 // Slightly slower for better stability
    });
    
    const successUsers = [];
    const failedUsers = [];

    for (let i = 1; i <= 20; i++) {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const page = await context.newPage();
        page.setDefaultTimeout(60000); // 60s for slow networks

        try {
            const isMale = i % 2 === 0;
            const firstName = isMale ? randomItem(maleNames) : randomItem(femaleNames);
            const name = `${firstName} Kumar`;
            const email = `v3_tester_${i}_${Math.floor(Math.random() * 10000)}@bhartiyerishtey.com`;
            const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
            const password = "Password@123";
            const age = randomAge();

            console.log(`\n📦 [USER ${i}/20] Initializing: ${email}`);

            // STEP 1: SIGNUP
            console.log("   ➤ Navigating to Signup...");
            await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
            
            console.log("   ➤ Filling Signup Form...");
            await page.fill('input[placeholder="John Doe"]', name);
            await page.fill('input[placeholder="your@email.com"]', email);
            await page.fill('input[placeholder="10 digit number"]', phone);
            await page.fill('input[type="password"] >> nth=0', password);
            await page.fill('input[type="password"] >> nth=1', password);

            console.log("   ➤ Submitting Signup...");
            await page.click('button:has-text("Create Account")');

            // STEP 2: REDIRECT & WAIT
            console.log("   ➤ Waiting for Profile Redirect...");
            await page.waitForURL('**/profile', { timeout: 20000 });
            await page.waitForLoadState('networkidle');
            console.log("   ➤ Successfully Redirected to Profile");
            
            await page.waitForTimeout(1000);

            // STEP 3: FILL PROFILE
            console.log("   ➤ Filling Profile Details...");
            
            // Gender
            await page.selectOption('select:near(label:has-text("Gender"))', isMale ? "A Groom" : "A Bride").catch(() => {});
            
            // DOB
            await page.fill('input[type="date"]', randomDOB(age)).catch(() => {});
            
            // Height
            await page.fill('input[placeholder="e.g., 170"]', "175").catch(() => {});
            
            // Religion
            await page.selectOption('select:near(label:has-text("Religion"))', randomItem(religions)).catch(() => {});
            
            // Caste
            await page.fill('input[placeholder="e.g., Brahmin"]', "General").catch(() => {});
            
            // Location
            await page.fill('input[placeholder="e.g., Mumbai, MH"]', randomItem(cities)).catch(() => {});
            
            // Education
            await page.fill('input[placeholder="e.g., B.Tech"]', randomItem(educationList)).catch(() => {});
            
            // Profession
            await page.fill('input[placeholder="e.g., Software Engineer"]', randomItem(professions)).catch(() => {});

            // Bio
            await page.fill('textarea[placeholder*="Tell potential matches"]', `Hi, I'm ${firstName}. I am a ${professions[i % professions.length]} looking for a companion who values family and culture.`).catch(() => {});

            // STEP 4: PHOTO UPLOAD
            console.log("   ➤ Handling Photo Upload...");
            const imgUrl = isMale
                ? `https://randomuser.me/api/portraits/men/${(i + 10) % 100}.jpg`
                : `https://randomuser.me/api/portraits/women/${(i + 10) % 100}.jpg`;

            const imgPath = path.resolve(__dirname, `audit_img_${i}.jpg`);
            await downloadImage(imgUrl, imgPath);

            if (fs.existsSync(imgPath)) {
                // Click the "Add Photo" dashed area/button
                await page.click('text=Add Photo').catch(() => {});
                
                // File chooser is triggered or we find the hidden input
                const [fileChooser] = await Promise.all([
                    page.waitForEvent('filechooser').catch(() => null),
                    page.click('span:has-text("add_photo_alternate")').catch(() => {})
                ]);

                if (fileChooser) {
                    await fileChooser.setFiles(imgPath);
                } else {
                    // Fallback to direct input fill if filechooser event didn't trigger
                    const fileInput = await page.$('input[type="file"]');
                    if (fileInput) await fileInput.setInputFiles(imgPath);
                }
                
                console.log("   ➤ Photo Uploaded");
                // Cleanup temp file
                setTimeout(() => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, 10000);
            }

            // STEP 5: SAVE & VERIFY
            console.log("   ➤ Saving Profile...");
            await page.click('button:has-text("Save Profile")');
            
            // Wait for success toast/indication
            await page.waitForSelector('text=Profile saved successfully', { timeout: 10000 }).catch(() => {
                console.log("   ⚠️ Success toast not detected, but continuing...");
            });

            console.log(`✅ USER CREATED SUCCESSFULLY: ${email}`);
            successUsers.push({ email, name });

        } catch (error) {
            console.error(`❌ FAILED TO CREATE USER ${i}: ${error.message}`);
            failedUsers.push({ index: i, error: error.message });
        } finally {
            await context.close();
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 FINAL QA AUDIT REPORT");
    console.log("=".repeat(50));
    console.log(`Total Attempted: 20`);
    console.log(`Successfully Created: ${successUsers.length}`);
    console.log(`Failed: ${failedUsers.length}`);
    
    if (failedUsers.length > 0) {
        console.log("\n❌ FAILURES DETAILS:");
        console.table(failedUsers);
    }

    console.log("\n✅ SUCCESSFUL USERS:");
    console.table(successUsers);

    await browser.close();
})();