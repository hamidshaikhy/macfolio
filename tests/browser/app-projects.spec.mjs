import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

const apps=[{title:'To Do List',id:'todo-list',repo:'to-do-list',shots:3},{title:'Hamnava',id:'hamnava',repo:'hamnava',shots:5},{title:'Koja Berim',id:'koja-berim',repo:'koja-berim',shots:3}];
test.beforeEach(async({context})=>{
  await context.route('**/_vercel/insights/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
});

test('new apps share real galleries across GitHub, Projects, Safari and Spotlight',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?view=desktop');
  const dock=page.getByRole('navigation',{name:'Dock',exact:true});
  await dock.getByRole('button',{name:'GitHub',exact:true}).click();
  await expect(page.locator('.gh-project')).toHaveCount(9);
  for(const app of apps){
    const card=page.locator('.gh-project').filter({has:page.getByRole('heading',{name:app.title,exact:true})});
    await expect.poll(()=>card.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    await card.click();
    const project=page.getByRole('dialog',{name:'Projects',exact:true});
    await expect(project.locator('.project-hero h2')).toHaveText(app.title);
    await expect(project.getByRole('link',{name:/Explore source/})).toHaveAttribute('href',`https://github.com/hamidshaikhy/${app.repo}`);
    await expect(project.getByRole('link',{name:/Open live app/})).toHaveAttribute('href',`/apps/${app.id==='todo-list'?'todo':app.id}/`);
    const thumbnails=project.locator('.project-gallery-thumbnails button');
    await expect(thumbnails).toHaveCount(app.shots);
    for(let i=0;i<app.shots;i++){
      await thumbnails.nth(i).click();
      await expect.poll(()=>project.locator('.project-main-image img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      await expect(project.locator('.project-main-image img')).toHaveAttribute('src',new RegExp(`assets/projects/${app.id}/`));
    }
    await page.getByRole('button',{name:'Close Projects',exact:true}).click();
  }
  await page.getByRole('button',{name:'Close GitHub',exact:true}).click();
  await dock.getByRole('button',{name:'Safari',exact:true}).click();
  const safari=page.getByRole('dialog',{name:'Safari',exact:true});
  for(const app of apps){
    await safari.locator('.safari-projects').getByRole('button',{name:new RegExp(app.title)}).click();
    await expect(safari.locator('.project-hero h2')).toHaveText(app.title);
    await safari.getByRole('button',{name:'Safari homepage',exact:true}).click();
  }
  await page.getByRole('button',{name:'Close Safari',exact:true}).click();
  await page.getByRole('button',{name:'Spotlight',exact:true}).click();
  await page.getByRole('textbox',{name:'Search apps',exact:true}).fill('Hamnava');
  await page.locator('.spotlight-results').getByRole('button',{name:/Hamnava/}).last().click();
  await expect(page.locator('.project-hero h2')).toHaveText('Hamnava');
  await fs.mkdir('artifacts/app-projects',{recursive:true});
  await page.screenshot({path:`artifacts/app-projects/${info.project.name}-macfolio-hamnava.png`});
  expect(errors).toEqual([]);
});

test('new apps fit the mobile project gallery',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/?view=desktop');
  await page.locator('.ios-home').getByRole('button',{name:'Selected work',exact:true}).click();
  for(const app of apps){
    await page.locator('.project-sidebar').getByRole('button',{name:new RegExp(app.title)}).click();
    await expect(page.locator('.project-hero h2')).toHaveText(app.title);
    await expect.poll(()=>page.locator('.project-main-image img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    const rect=await page.locator('.projects-app').boundingBox();expect(rect.width).toBeLessThanOrEqual(390);
    await fs.mkdir('artifacts/app-projects',{recursive:true});
    await page.screenshot({path:`artifacts/app-projects/${info.project.name}-mobile-${app.id}.png`});
    await page.locator('.mobile-project-back').click();
  }
});
