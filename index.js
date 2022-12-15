const playwright = require("playwright");
let Spinner = require('cli-spinner').Spinner;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const target = 'https://csgostats.gg/player/';

readline.question('CSGO stats ID: ', (playerId) => {
    main(playerId);
    readline.close();
});

async function main(playerId) {
    console.log(`Gathering information for player with id - ${playerId}`)

    var spinner = new Spinner('%s');
    spinner.setSpinnerString("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏");
    spinner.start()

    const browser = await playwright.chromium.launch({
        headless: false,
    });

    const page = await browser.newPage();
    await page.goto(`${target}${playerId}#/matches`);
    await page.locator('data-testid=uc-accept-all-button').click();
    
    spinner.stop(true);
    console.log("Ordering data")
    spinner.start()

    const data = [];
    const tableRows = await page.$$('div#match-list-outer table tbody tr')

    let count = 0;

    for (let tr of tableRows) {
        const rowContent = await tr.$$("td");

        const date = await rowContent[0].textContent();
        const isBanned = await rowContent[1].innerHTML();
        const map = await rowContent[2].textContent();
        const score = await rowContent[3].textContent();

        const row = {
            id: count,
            date: date.trim(),
            isBanned: isBanned.trim() !== '',
            map: map.trim(),
            score: score.trim(),
        };

        data.push(row);
        count++;
    }

    spinner.stop(true);

    const total = data.length;
    const banned = data.filter((d) => d.isBanned).length;

    const banPercentage = (banned / total) * 100;

    const ratio = 10;
    const chunkSize = total / ratio;
    const prevalence = banned / chunkSize;

    console.log("Complete")
    console.table([
        { name: 'Total Matches', value: String(total) },
        { name: 'Total Banned Matches', value: String(banned) },
        { name: 'Percentage of banned matches', value: `${banPercentage.toFixed(2)}%` },
        { name: 'Prevalence of hackers in matches', value: `${prevalence.toFixed(0)} out of ${ratio}` }
    ])

    process.exit(0);
}