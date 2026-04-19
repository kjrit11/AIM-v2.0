# After cloning this repo — Phase 1 setup

This repo contains **only the source files written by Claude**. The Next.js
scaffold infrastructure (`package.json`, `node_modules/`, `next.config.js`,
`tsconfig.json`, etc.) is NOT included — it has to be generated locally so
dependencies resolve against your Node version.

## One-time setup (after cloning)

```bash
# From the repo root (wherever you cloned to)

# 1. Initialize Next.js infrastructure into a temp directory
npx create-next-app@14 _scaffold \
    --typescript \
    --tailwind \
    --app \
    --src-dir \
    --import-alias '@/*' \
    --no-eslint \
    --use-npm

# 2. Move generated scaffold files up, PRESERVING our files
#    (our existing files like src/app/page.tsx must NOT be overwritten)
cd _scaffold
for f in package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts postcss.config.mjs next.config.js; do
  [ -f "$f" ] && mv -n "$f" ../ 2>/dev/null
done
# Copy public/ and any other scaffold-only dirs
[ -d public ] && mv public ../ 2>/dev/null
cd ..
rm -rf _scaffold

# 3. Remove scaffold's tailwind.config.js if it overwrote our .ts version
#    (should not have, but be safe)
rm -f tailwind.config.js

# 4. Install dependencies
npm install clsx tailwind-merge lucide-react geist
npm install --save-dev \
    eslint@^8 \
    eslint-config-next@^14 \
    @typescript-eslint/parser@^7 \
    @typescript-eslint/eslint-plugin@^7 \
    prettier@^3 \
    prettier-plugin-tailwindcss@^0.6 \
    @types/node@^20

# 5. Verify build
npx tsc --noEmit
npm run lint
npm run build

# 6. Start dev server
npm run dev
```

Then open http://localhost:3000/design to see the component gallery.

## Windows-specific (if not using WSL)

Use `scripts/phase-1-setup.ps1` which does all of the above as PowerShell.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\phase-1-setup.ps1
```

BUT NOTE: that script was written for a fresh empty clone, not this
already-populated one. Adapt as needed, OR just follow the bash steps above
in Git Bash (which comes with Git for Windows).

## After the first `npm run build` succeeds

Commit the generated infrastructure files:

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs \
        next-env.d.ts postcss.config.mjs public/
git commit -m "chore(phase-1): Next.js scaffold infrastructure from create-next-app"
git push origin main
```

After this one-time setup, normal development flow is just:
```bash
npm run dev
```
