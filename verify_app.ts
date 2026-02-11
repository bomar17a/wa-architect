
import { chromium } from 'playwright';

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });

        console.log('Navigating to http://localhost:3000/ ...');
        await page.goto('http://localhost:3000/');

        await page.waitForSelector('text=Start Your Narrative');

        // The hero section is at the top, so we shouldn't need to scroll much, 
        // but let's make sure the cards on the right are visible.

        console.log('Taking screenshot of the Landing Page (Hero)...');
        // Capture specific element if possible, or just the viewport
        await page.screenshot({ path: 'hero_verification.png', fullPage: false });

        console.log('Success! Screenshot saved to hero_verification.png');
        await browser.close();
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
})();
