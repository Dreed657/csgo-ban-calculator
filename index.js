const playwright = require("playwright"); 
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
    const browser = await playwright.chromium.launch({ 
		headless: false, 
	});
 
	const page = await browser.newPage(); 
	await page.goto(target + playerId + '#/matches');
    await page.locator('data-testid=uc-accept-all-button').click();

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

    const total = data.length;
    const banned = data.filter((d) => d.isBanned).length;

    const banPercentage = (banned / total) * 100;

    const ratio = 10;
    const chunkSize = total / ratio;
    const prevalence = banned / chunkSize;

    console.table([
        {name: 'Total', value: String(total)},
        {name: 'Banned', value: String(banned)},
        {name: 'Percentage', value: `${banPercentage.toFixed(2)}%`},
        {name: 'Prevalence', value: `${prevalence.toFixed(0)} out of ${ratio}`}
    ])

    process.exit(0);
}