const fs = require('fs');
const { test, expect } = require('@playwright/test');
import data from '../data.json';
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
let NfileCleared = false;
// Create a shared flag to track if the file has been cleared
let SfileCleared = false;
test.describe.configure({ mode: 'serial' });
let page;
const clearFilesIfNeeded = () => {
    if (!SfileCleared || !NfileCleared) {
        fs.writeFileSync('subrata.txt', '');
        fs.writeFileSync('noor.txt', '');
        SfileCleared = true;
        NfileCleared = true;
    }
};


const performArticleSearchAndDownload = async (articleID, author) => {
    const tasksTable = await page.waitForSelector('#dashboardTaskTable tbody');
    await tasksTable.waitForSelector('tr');
    console.log('Article ID:', articleID);
    await page.getByLabel('Search by Article Id/Task Name').fill(articleID);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    await expect(await page.locator('#dashboardTaskTable_info')).toHaveText('Showing 1 to 1 of 1 entries');
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
    showArticleId && fs.appendFileSync(`${author}.txt`, `\n\n\n${articleID}\n${outputHTML}`);
    await page.getByRole('button', { name: '×' }).click();
    const   Promise = page.waitForEvent('download', { timeout: 15000 });
    await page.getByRole('link', { name: ' Download' }).click();
    try {
        const download = await downloadPromise;
        await download.saveAs(`./downloadedTE/${formattedDate}/${author}/${download.suggestedFilename()}`);
    } catch (downloadError) {
        console.log('Error downloading the file:', downloadError.message, articleID);
    }
}

test.describe('Your test suite description', () => {
    clearFilesIfNeeded();
    // Declare the page variable outside the beforeAll hook
    test.beforeAll(async ({ browser }) => {
        let context = await browser.newContext({
            downloadsPath: './downloads',
        });
        page = await context.newPage();
        await page.goto('https://production.jow.medknow.com/login');
        await page.getByRole('textbox', { name: 'User ID / Email ID' }).fill('EDITORS0071@GMAIL.COM');
        await page.getByPlaceholder('Password').fill('Editing@1234');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.waitForLoadState('networkidle');
    });

    const assignments = [
        { assignment: data.noorAssignment || [], author: 'noor' },
        { assignment: data.subrataAssignment || [], author: 'subrata' },
    ];
    for (const { assignment, author } of assignments) {
        const formattedEXCELAssignment = assignment?.map((task) => `${task}`).join('\n');
        fs.appendFileSync(`${author}.txt`, `${formattedEXCELAssignment}\n\n`);
        const formattedAssignment = assignment?.map((task, index) => `${index + 1}. ${task}`).join('\n');
        fs.appendFileSync(`${author}.txt`, `${formattedAssignment}\n\n`);
    };

    for (const { assignment, author } of assignments) {
        for (const articleID of assignment) {
            test(`Perform ${author} Assignment for ${articleID}`, async () => {
                await performArticleSearchAndDownload(articleID, author);
                await page.getByRole('link', { name: 'Cancel' }).click();
            });
        }
    }

});