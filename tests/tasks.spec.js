const fs = require('fs');
const { test, expect } = require('@playwright/test');
require('dotenv').config();
// const todaysDate = new Date().toLocaleDateString('en-GB').split('/').join('-');
const todaysDate = '30-11-2023';
const today = new Date();
// Create a shared flag to track if the file has been cleared
let datafileCleared = false;
test.describe.configure({ mode: 'serial' });
let subrataAssignment = [], noorAssignment = [];
let matchingArticleIds = [];
let page;
const clearFilesIfNeeded = () => {
    if (!datafileCleared) {
        fs.writeFileSync('data.json', '');
        datafileCleared = true;
    }
};

test.describe('Your test suite description', () => {
    // Declare the page variable outside the beforeAll hook
    test.beforeAll(async ({ browser }) => {
        clearFilesIfNeeded()
        let context = await browser.newContext({
            downloadsPath: './downloads',
        });
        page = await context.newPage();
        await page.goto('https://production.jow.medknow.com/login');
        await page.getByRole('textbox', { name: 'User ID / Email ID' }).fill('EDITORS0071@GMAIL.COM');
        await page.getByPlaceholder('Password').fill('Editing@1234');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.goto('https://production.jow.medknow.com/mytask');
        await page.waitForLoadState() // Pause for 2 seconds
        await page.locator('#mytaskTable_length select').selectOption('100');
        await page.getByLabel('Search:').fill(todaysDate);
        await page.getByLabel('Schedule Start Date: activate to sort column ascending').click();
        await page.getByLabel('Schedule Start Date: activate to sort column descending').click();
        const table = await page.locator('#mytaskTable').last();
        const rows = await table.locator('tbody');
        const rowCount = await rows.locator('tr').count();
        const searchedDate = todaysDate; // Replace with your searched date
        for (let i = 0; i < rowCount; i++) {
            const columns = await rows.locator('tr').nth(i).locator('td');
            const scheduleStartDate = await columns.nth(6).innerText();
            if (scheduleStartDate === searchedDate) {
                // Assuming the `copyright` column is the sixth column (0-indexed)
                // const status = await columns.nth(5).innerText(); // Assuming the `copyright` column is the sixth column (0-indexed)
                const journalId = await columns.nth(1).innerText();
                const articleId = await columns.nth(3).innerText();
                matchingArticleIds.push({
                    articleId,
                    journalId,
                });
                // if (status === 'Yet-to-Start') {
                //     const journalId = await columns.nth(1).innerText();
                //     const articleId = await columns.nth(3).innerText();
                //     matchingArticleIds.push({
                //         articleId,
                //         journalId,
                //     });
                // }
            }
        }
        if (matchingArticleIds.length > 5) {
            const allowedJournalsForNoor = [
                "ACA", "IJPM", "IDOJ", "MJDRDYPU", "IJD", "ABR",
                "CRST", "INDIANJPSYCHIATRY", "JCRT", "JBPS",
                "JIAOMR", "NJCP", "JEHP", "JFMPC", "IJEM",
                "JOMFP", "JPBS"
            ];
            const noorJournals = [];
            const subrataJournals = [];

            for (const journal of matchingArticleIds) {
                if (allowedJournalsForNoor.includes(journal.journalId.toUpperCase())) {
                    noorJournals.push(journal);
                } else {
                    subrataJournals.push(journal);
                }
            }

            const totalJournals = matchingArticleIds.length;
            const noorAllocation = Math.min(Math.floor(totalJournals * 0.2), noorJournals.length);
            noorAssignment = noorJournals.slice(0, noorAllocation).map(journal => journal.articleId);
            const remainingSubrataJournals = subrataJournals.concat(noorJournals.slice(noorAllocation));
            subrataAssignment = remainingSubrataJournals.map(journal => journal.articleId);
        }
        else {
            // If the number of matching articles is 5 or fewer, assign all to Subrata
            subrataAssignment = matchingArticleIds.map(journal => journal.articleId);
            noorAssignment = []; // Set noorAssignment to an empty array
        }
        console.log('Subrata Journals:', subrataAssignment, subrataAssignment.length);
        console.log('Noor Journals:', noorAssignment, noorAssignment.length);

    });
    test.describe('Fetch Articles', () => {
        test('Fetch articles and write to a json file', async () => {
            const data = {
                subrataAssignment,
                noorAssignment,
            };
            fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
            console.log('Data has been written to data.json');
        });
    });
});