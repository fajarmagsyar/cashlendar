import { defineConfig,devices } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir:'./tests/e2e',testMatch:'app.spec.ts',fullyParallel:false,workers:1,reporter:'list',timeout:30000,
  use:{ baseURL:'http://localhost:3002',trace:'retain-on-failure',launchOptions:{ executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),args:['--no-sandbox'] } },
  projects:[{ name:'desktop',use:{...devices['Desktop Chrome']} },{ name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'} }],
  webServer:{ command:'pnpm build && pnpm start --port 3002',url:'http://localhost:3002/login',reuseExistingServer:false,timeout:120000,env:{NEXT_BUILD_DIR:'.next-baseline',NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',NEXT_PUBLIC_APP_URL:'http://localhost:3002'} }
});
