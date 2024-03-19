
const fs = require('fs');
const { test, expect } = require('@playwright/test');
import articleIds from '../batchToUpload.json';
const path = require('path');
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
test.describe.configure({ mode: 'serial' });
let page;

const performArticleSearchAndUpload = async (articleID) => {
    const tasksTable = await page.waitForSelector('#dashboardTaskTable tbody');
    await tasksTable.waitForSelector('tr');
    console.log('Article ID:', articleID);
    await page.getByLabel('Search by Article Id/Task Name').fill(articleID);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    const entriesText = await page.locator('#dashboardTaskTable_info').innerText();
    if (entriesText === 'Showing 1 to 1 of 1 entries') {
        await page.getByRole('link', { name: 'Start' }).click();
        await page.waitForLoadState() // Pause for 2 seconds
        await page.getByRole('button', { name: ' Complete Action' }).click({ force: true });
        await expect(await page.getByRole('heading', { name: 'Upload File' })).toBeVisible();
        const filePathDocx = `./batchUploader/${articleID}.docx`;
        const filePathDoc = `./batchUploader/${articleID}.doc`;
        const filePath = fs.existsSync(filePathDocx) ? filePathDocx : filePathDoc;
        await page.waitForSelector('#addtask #attachment');
        await page.locator('#addtask #attachment').setInputFiles(filePath);
        await page.screenshot({ path: `./articlesUploaded/${articleID}.png` });
        await page.getByRole('button', { name: 'Submit Task' }).click();
        await page.waitForTimeout(2000); // Adjust the timeout as needed
    }
    else {
        console.log('No matching entry found for the article ID:', articleID);
    }
}

test.describe('Your test suite description', () => {
    test.beforeAll(async ({ browser }) => {
        let context = await browser.newContext();
        page = await context.newPage();
        await page.goto('https://production.jow.medknow.com/login');
        await page.getByRole('textbox', { name: 'User ID / Email ID' }).fill('EDITORS0071@GMAIL.COM');
        await page.getByPlaceholder('Password').fill('Editing@1234');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.waitForLoadState('networkidle');
    });
    for (const articleID of articleIds) {
        console.log(articleID);
        test(`Perform upload for ${articleID}`, async () => {
            await performArticleSearchAndUpload(articleID);
            await page.goto('https://production.jow.medknow.com/dashboard')
        });
    }
});