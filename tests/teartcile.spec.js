const fs = require('fs');
const { test, expect } = require('@playwright/test');
require('dotenv').config();
import data from '../data.json';

const articleIDs = data.subrataAssignment;
const editorName = 'Subrata';
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
// Create a shared flag to track if the file has been cleared
let SfileCleared = false;
// let NfileCleared = false;
// test.describe.configure({ mode: 'serial' });
test.describe('Your test suite description', () => {

    let page; // Declare the page variable outside the beforeAll hook
    test.beforeAll(async ({ browser }) => {
        let context = await browser.newContext({
            downloadsPath: './downloads',
        });
        page = await context.newPage();

        await page.goto('https://production.jow.medknow.com/login');
        await page.getByRole('textbox', { name: 'User ID / Email ID' }).fill('EDITORS0071@GMAIL.COM');
        await page.getByPlaceholder('Password').fill('Editing@1234');
        await page.getByRole('link', { name: 'Login' }).click();
        // Clear the file only if it hasn't been cleared already
        if (!SfileCleared) {
            fs.writeFileSync('email.txt', '');
            SfileCleared = true;
        }
    });
    for (const articleID of articleIDs) {
        test(`test : ${articleID}`, async () => {
            await page.waitForLoadState() // Pause for 2 seconds
            await page.getByLabel('Search by Article Id/Task Name').fill(articleID);
            await page.waitForLoadState('networkidle') // Pause for 2 seconds
            await page.waitForTimeout(2000);
            await page.getByRole('link', { name: 'Start' }).click();
            await page.waitForLoadState() // Pause for 2 seconds
            await page.getByRole('button', { name: 'Author Details' }).click({ force: true });
            await expect(await page.getByRole('heading', { name: 'Author Details' })
            ).toBeVisible();
            const tableElement = await page.locator('#articleCommentTable').last().locator('tbody');
            const rowCount = await tableElement.locator('tr').count();
            const textsFromNthColumn = [];
            let showArticleId = false;
            let outputHTML = '';
            for (let i = 0; i < rowCount; i++) {
                const columns = await tableElement.locator('tr').nth(i).locator('td');
                const copyrightColumn = await columns.nth(6).innerText(); // Assuming the `copyright` column is the sixth column (0-indexed)

                if (copyrightColumn.trim() === 'NO') {
                    const name = await columns.nth(1).innerText();
                    const email = await columns.nth(2).innerText();

                    textsFromNthColumn.push({ name, email });
                    showArticleId = true;
                    outputHTML = `${textsFromNthColumn.map((row, idx) => `${idx + 1}. ${row.name} - ${row.email}`).join('\n')}\n`;

                }
            }
            showArticleId && fs.appendFileSync('email.txt', `\n\n\n${articleID}\n${outputHTML}`);
            await page.getByRole('button', { name: '×' }).click();
            const downloadPromise = page.waitForEvent('download');
            await page.getByRole('link', { name: ' Download' }).click();
            const download = await downloadPromise;
            await download.saveAs(`./downloadedTE/${formattedDate}/${editorName}/${download.suggestedFilename()}`);
            await page.getByRole('link', { name: 'Cancel' }).click();
        })
    }
});