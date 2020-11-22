### Playwright Mini

[![npm version](https://img.shields.io/npm/v/playwright-mini.svg)](https://www.npmjs.com/package/playwright-mini)
![CI](https://github.com/shirshak55/playwright-mini/workflows/CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/sindresorhus/got/badge.svg?branch=mini)](https://coveralls.io/github/shirshak55/playwright-mini?branch=mini)
[![Downloads](https://img.shields.io/npm/dm/playwright-mini.svg)](https://npmjs.com/playwright-mini)
[![Install size](https://packagephobia.now.sh/badge?p=playwright-mini)](https://packagephobia.now.sh/result?p=playwright-mini)

[docs](#usage)

It is simple replacement of puppeteer extra but for playwright.

### Why Playwright?

Because google killed puppetter. Its not maintained properly. Lots of old bugs related to cookies are not fixed. And I dont see any future with puppetter.

### Usage?

First create a project

```bash
mkdir automation
cd automation
yarn init
```

Create a tsconfig.json file and make it look like this. Feel free to adjust it :)

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "declaration": false,
    "declarationMap": false,
    "inlineSourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": false,
    "downlevelIteration": true,
    "strict": true,
    "noEmitOnError": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,

    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "files": ["./src/index.ts"],
  "exclude": ["node_modules"]
}
```

```
yarn add meow playwright playwright-mini source-map-support
yarn add --dev typescript @types/node
```

After adding package.json should look like this. (Add scripts section so we can do `yarn watch` and `yarn start` later)

```json
{
  "name": "automation",
  "version": "1.0.0",
  "main": "index",
  "license": "MIT",
  "scripts": {
    "start": "node dist/main",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "meow": "^8.0.0",
    "playwright": "^1.6.1",
    "playwright-mini": "^1.0.0",
    "source-map-support": "^0.5.19"
  },
  "devDependencies": {
    "@types/node": "^14.14.7",
    "typescript": "^4.0.5"
  }
}
```

Create `src` directory with `index.ts` file inside it

```ts
import "source-map-support/register"
import { Browser, BrowserContext, firefox, Page } from "playwright"
import { pageStealth } from "playwright-mini"

async function main() {
  // If you want to sue chromium import chromium and change headless as ur wish
  let browser = await firefox.launch({ headless: false })
  let context = await browser.newContext({ ignoreHTTPSErrors: true })

  let page = await context.newPage()

  await pageStealth(page)

  await page.goto("https://fast.com")
}

main().catch((e) => {
  cm.error("Error from Main", e)
})
```

### Why not same structure as Puppetter Mini?

First I don't like that approach 12 gadget inside 12 folder and one package depending on another package. I am not necessarily saying that approach is bad as its clealy working for thm. I would like to keep it simple and flat.

### What is included in this pacakge?

I don't plan adding too much for simplicity. I just want to add only necessary stuff thats required for automation. Like I am not going to include adblocker extension etc.

- [x] Stealth
- [ ] Captcha

### Others

You may want to checkout (scrapper tools)[https://github.com/shirshak55/scrapper-tools]. It provides easy way to make scrapper tools and comes with csv parsers and various other widgets.

### Thanks

- @berstend his repo is main inspiration to do this.
- @shirshak55 thats me :D
- @playwright-team

### Disclaimer

I use it to automate my workflow. Like my bank gives 1 month data but to make summary of my expenditure I need 6 month data. Clearly I don't want to be in mercy of bank so the solution is to automate my workflow.
