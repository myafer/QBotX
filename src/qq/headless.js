'use strict';

const Log = require('log');
const log = global.log || new Log(process.env.LOG_LEVEL || 'info');

const Puppeteer = require('puppeteer');

async function getTokens(u, p) {
    log.debug('Launching browser...');
    const browser = await Puppeteer.launch({
        args: ['--no-sandbox'],
        headless: process.env.HEADLESS_DEBUG !== 'true'
    });
    const page = await browser.newPage();
    log.debug('Going to QZone login page...');
    await page.goto('https://m.qzone.com', { waitUntil: 'domcontentloaded' });
    log.debug('Typing username and password...');
    await page.type('#u', `${u}`, { delay: 120 });
    await page.type('#p', `${p}`, { delay: 120 });
    log.debug('Clicking Login...');
    await page.click('#go');
    log.debug('Waiting for redirection...');
    await page.waitFor('#container');
    log.debug('Going to WebQQ login page...');
    await page.goto('https://w.qq.com', { waitUntil: 'networkidle2' });
    log.debug('Waiting for avatar...');
    await page.waitFor('iframe[name=ptlogin]');
    const ptLoginFrame = page.frames().find(f => f.name() === 'ptlogin');
    const ptLoginURL = ptLoginFrame.url();
    log.debug(ptLoginURL);
    if (ptLoginURL.startsWith('https://xui.ptlogin2.qq.com/cgi-bin/xlogin')) {
        ptLoginFrame.waitFor('#qlogin_list a.face');
        log.debug('Clicking avatar...');
        const avatar = await ptLoginFrame.$('#qlogin_list a.face');
        await avatar.click();
    } else if (ptLoginURL.startsWith('https://w.qq.com/proxy.html')) {
        log.debug('Nothing. Just wait for auto-login...');
    }
    log.debug('Waiting for redirection...');
    await page.waitFor('#main_container');
    log.debug('Waiting for contacts to be loaded...');
    await page.waitFor('li[id*=recent-item].list_item');
    log.debug('Getting tokens...');
    const vfwebqq = await page.evaluate('mq.vfwebqq');
    const ptwebqq = await page.evaluate('mq.ptwebqq');
    const psessionid = await page.evaluate('mq.psessionid');
    const cookies = await page.cookies('https://w.qq.com', 'https://web2.qq.com');
    log.debug(`Cookie count: ${cookies.length}`);
    const uin = cookies.find(ck => ck.name === 'uin').value;
    const cookieStr = cookies.reduce((str, ck) => `${str}${ck.name}=${ck.value}; `, '');
    if (process.env.HEADLESS_DEBUG !== 'true') await browser.close();
    const tokens = {
        uin,
        vfwebqq,
        ptwebqq,
        psessionid,
        cookieStr
    };
    log.debug(tokens);
    return tokens;
}

module.exports = {
    getTokens
};
