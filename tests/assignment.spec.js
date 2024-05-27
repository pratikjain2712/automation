const fs = require('fs');
const { test, expect } = require('@playwright/test');
import data from '../data.json';
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
import sendEmailFunction from '../emailer';
import { generateUniqueFolderName } from '../util/createZip';
import { appendDataToGoogleSheet } from '../sheetAuth';
// Create a shared flag to track if the file has been cleared
let SfileCleared = false;
test.describe.configure({ mode: 'serial' });
let page;
const clearFilesIfNeeded = () => {
    if (!SfileCleared) {
        fs.writeFileSync('subrata.txt', '');
        fs.writeFileSync('subrata-file-not-found.txt', '');
        fs.writeFileSync('subrata-excel.txt', '');
        SfileCleared = true;
    }
};


const performArticleSearchAndDownload = async (articleID, author) => {
    await expect(page.getByText('My Task List')).toBeVisible();
    console.log('Article ID:', articleID);
    await page.getByLabel('Search:').fill(articleID);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Showing 1 to 1/)).toBeVisible();
    await page.getByRole('link', { name: 'Start' }).click();
    await page.waitForLoadState() // Pause for 2 seconds

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.getByRole('link', { name: ' Download' }).click();
    const fileNotFound = await page.getByText('File Not Found').count();
    if (fileNotFound > 0) {
        console.log('File not found:', articleID);
        fs.appendFileSync('subrata-file-not-found.txt', `${articleID}\n`);
        return
    }
    fs.appendFileSync(`${author}-excel.txt`, `${articleID}\n\n`);
    appendDataToGoogleSheet(articleID);
    // fs.appendFileSync(`${author}.txt`, `${articleID}\n\n`);
    try {
        const download = await downloadPromise;
        await download.saveAs(`./downloadedTE/${formattedDate}/${author}/${download.suggestedFilename()}`);
    } catch (downloadError) {
        console.log('Error downloading the file:', downloadError.message, articleID);
    }
    await page.getByRole('button', { name: 'Author Details' }).click({ force: true });
    await expect(await page.getByRole('heading', { name: 'Author Details' })).toBeVisible();
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
        await page.goto('https://production.jow.medknow.com/mytask')
        await page.waitForLoadState('networkidle');
    });
    const assignments = [
        { assignment: data.subrataAssignment || [], author: 'subrata' },
    ];
    const uniqueFolderName = generateUniqueFolderName();
    const targetFolderPath = `./downloadedTE/${formattedDate}/${uniqueFolderName}/`;

    test.afterAll(async () => {
        const info = await sendEmailFunction('Subrata', data.subrataAssignment, `./downloadedTE/${formattedDate}/${assignments[0].author}/`, `batch-${formattedDate}.zip`);
        console.log(`Email sent to Subrata with info:`, info.response);
        // fs.mkdir(targetFolderPath, { recursive: true }, (err) => {
        //     if (err) {
        //         console.log('Error creating directory:', err);
        //     } else {
        //         console.log('Directory created successfully');

        //         // Move the files to the new directory
        //         fs.rename(`./downloadedTE/${formattedDate}/${assignments[0].author}/`, targetFolderPath, (err) => {
        //             if (err) {
        //                 console.log('Error moving files:', err);
        //             } else {
        //                 console.log('Files moved successfully');
        //             }
        //         });

        //     }

        // });
    }, 500000)


    for (const { assignment, author } of assignments) {
        for (const articleID of assignment) {
            test(`Perform ${author} Assignment for ${articleID}`, async () => {
                await performArticleSearchAndDownload(articleID, author);
                await page.getByRole('button', { name: '' }).click();
                await page.goto('https://production.jow.medknow.com/mytask')
            });
        }
    }
});