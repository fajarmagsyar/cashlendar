import { defineConfig,devices } from '@playwright/test';
import { existsSync } from 'node:fs';
const production=process.env.AUTH_E2E_PRODUCTION==='1';
export default defineConfig({
  testDir:'./tests/e2e/authenticated',workers:1,fullyParallel:false,reporter:'list',timeout:45000,
  use:{baseURL:'http://localhost:3001',trace:'retain-on-failure',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),args:['--no-sandbox']}},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:[
    {command:'pnpm exec node --experimental-strip-types tests/e2e/supabase-fixture.ts',url:'http://127.0.0.1:54329/health',timeout:60000,reuseExistingServer:false},
    {command:production ? 'pnpm build && pnpm start --port 3001' : 'pnpm dev --port 3001 --webpack',url:'http://localhost:3001/login',timeout:120000,reuseExistingServer:false,env:{NEXT_BUILD_DIR:production ? '.next-auth-production' : '.next-auth',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'local-browser-test-only',NEXT_PUBLIC_APP_URL:'http://localhost:3001'}}
  ]
});
