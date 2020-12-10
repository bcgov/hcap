const puppeteer = require('puppeteer');

exports.getAuthToken = async function getAuthToken(userObject) {
  const { username, password, url } = userObject;
  const creds = await puppeteer
  .launch({ headless: false })
  .then(async browser => {
    try {
      let page = await browser.newPage();
      await page.goto(url);
      await page.click('#zocial-bceid');
      await page.waitForSelector("#user", {visible: true, timeout: 0});

      // Now we should be on the BCeID login page
      await page.type('#user', username, {delay: 50});
      await page.type('#password', password, {delay: 50});
      await page.click('[name=btnSubmit]');

      // We've made it back home with the token!
      await page.waitForSelector(".makeStyles-root-2", {visible: true});

      const localStorageData = await page.evaluate(() => {
        let json = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          json[key] = localStorage.getItem(key);
        }
        return json;
      });
      await browser.close();
      return localStorageData;

    } catch (error) {
      console.error(error);
      await browser.close();
      return {};
    }
  })
  return creds;
};
