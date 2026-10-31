import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=process.cwd(),out=join(root,'demo-iterations/v37/capture/source');
await mkdir(out,{recursive:true});
const b=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:1920,height:1080},screen:{width:1920,height:1080},deviceScaleFactor:1});
const p=await c.newPage();
async function shot(name,locator){
 if(locator) await locator.screenshot({path:join(out,name+'.png')});
 else await p.screenshot({path:join(out,name+'.png')});
}
await p.goto('http://127.0.0.1:3033/',{waitUntil:'networkidle'}); await p.waitForTimeout(600); await shot('entry-screen');
await p.goto('http://127.0.0.1:3033/demo?path=talk',{waitUntil:'networkidle'});
async function send(text){const box=p.getByRole('textbox',{name:'Your message'});await box.fill(text);await p.getByRole('button',{name:'Send',exact:true}).click();await p.waitForTimeout(400);}
await send("I want time to decide what I want, but I feel ungrateful asking. My parents keep asking me to choose.");
await p.getByRole('button',{name:'Something with someone'}).click();
await send("Actually, it's my parents. I want time to decide what I want.");
await p.getByRole('button',{name:'Yes, that’s closer'}).click();
await p.getByRole('button',{name:'Hear experiences'}).click();
await p.waitForTimeout(500);
await shot('discovery-screen');
await p.getByRole('button',{name:'Explore community'}).first().click();
await p.getByRole('tab',{name:'Discussions'}).click();
await p.waitForTimeout(500);
await p.getByRole('button',{name:/Day 4/}).click();
await p.waitForTimeout(500); await shot('peer-one-day4'); await shot('peer-one-day4-posts',p.locator('.historical-posts'));
await p.getByRole('button',{name:/Day 9/}).click();
await p.waitForTimeout(400); await shot('peer-two-day9'); await shot('peer-two-day9-host',p.locator('.host-boundary'));
await p.getByRole('button',{name:/Day 16/}).click();
await p.waitForTimeout(400); await shot('share-day16-no-replies');
const keep=p.getByRole('button',{name:'Keep this takeaway privately'}); if(await keep.count()) { await keep.click(); await p.waitForTimeout(350); await shot('private-takeaway-confirmed'); }
await p.getByRole('button',{name:'Join this example group'}).click();
await p.waitForTimeout(250);
const offer=p.getByRole('button',{name:'Offer one thing that helped'}); await offer.scrollIntoViewIfNeeded(); await offer.click();
const preview=p.locator('.dev-bounded-preview'); await preview.waitFor({state:'visible'}); await p.waitForTimeout(500);
await shot('share-preview-panel',preview);
const draft=p.getByRole('textbox',{name:'Edit the one part you may offer'});
if(await draft.count()) { await draft.focus(); await p.waitForTimeout(300); await shot('share-preview-draft-focus',preview); }
const checkbox=preview.getByRole('checkbox'); await checkbox.focus(); await p.waitForTimeout(300); await shot('share-preview-consent-focus',preview);
const later=p.getByRole('button',{name:'Maybe later'}); await later.click(); await p.waitForTimeout(350); await shot('maybe-later-selected',p.locator('.dev-choice-panel'));
await p.getByRole('button',{name:'Offer one thing that helped'}).click(); const finalPreview=p.locator('.dev-bounded-preview'); await finalPreview.waitFor({state:'visible'}); await finalPreview.getByRole('button',{name:'Review my choices'}).click(); const ending=p.locator('.agency-close'); await ending.waitFor({state:'visible'}); await p.waitForTimeout(300); await shot('final-private-and-unsent',ending);
await p.getByRole('button',{name:'Find Support'}).click(); await p.getByRole('button',{name:'Explore professional support'}).click();
await p.getByRole('heading',{name:/We don't have a verified provider/}).waitFor({state:'visible'}); await p.waitForTimeout(400); await shot('provider-no-verified');
await writeFile(join(out,'capture-stills.json'),JSON.stringify({origin:'http://127.0.0.1:3033',viewport:[1920,1080],fixture:'local prepared content',modelConnected:false,screens:['entry-screen','discovery-screen','peer-one-day4','peer-two-day9','peer-one-day4-posts','peer-two-day9-host','share-day16-no-replies','share-preview-panel','share-preview-draft-focus','share-preview-consent-focus','maybe-later-selected','final-private-and-unsent','provider-no-verified'],operations:['real UI clicks and text entry followed by local state updates','share consent remained unchecked; disabled action not activated','no service/API requests were made'],capture:'Playwright screenshots from current local app'},null,2)+'\n');
await b.close(); console.log('Captured current UI stills at 1920x1080 plus crop panels.');
