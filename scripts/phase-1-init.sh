#!/usr/bin/env bash
# AIM v2 — Phase 1 Repository Initialization
# ===========================================
# Run this block locally from the directory where you want the repo to live.
# Prerequisites: node 20+, npm 10+, git, an empty GitHub repo at kjrit11/Aim-v2.0

set -e  # Stop on any error

# ---------------------------------------------------------------------------
# Step 1 — Clone the empty GitHub repo (assumes it exists on GitHub)
# ---------------------------------------------------------------------------
# If you haven't created the GitHub repo yet:
#   1. Go to https://github.com/new
#   2. Repository name: Aim-v2.0
#   3. Owner: kjrit11
#   4. Private (recommended)
#   5. DO NOT initialize with README, .gitignore, or license (we want it truly empty)
#   6. Create, then clone with SSH or HTTPS

git clone git@github.com:kjrit11/Aim-v2.0.git
cd Aim-v2.0

# ---------------------------------------------------------------------------
# Step 2 — Scaffold Next.js 14 App Router with TypeScript strict
# ---------------------------------------------------------------------------
# Because the directory is not empty (has .git), create-next-app into a temp
# directory, then move the contents up.

npx create-next-app@14 _scaffold \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint \
  --use-npm

# Move scaffold contents up, then clean up
shopt -s dotglob  # include dotfiles
mv _scaffold/* ./
mv _scaffold/.* ./ 2>/dev/null || true  # ignore errors on . and ..
rmdir _scaffold
shopt -u dotglob

# ---------------------------------------------------------------------------
# Step 3 — Add production dependencies we'll need in Phase 1
# ---------------------------------------------------------------------------
npm install \
  clsx \
  tailwind-merge \
  lucide-react

# ---------------------------------------------------------------------------
# Step 4 — Add development dependencies
# ---------------------------------------------------------------------------
npm install --save-dev \
  eslint@^8 \
  eslint-config-next@^14 \
  @typescript-eslint/parser@^7 \
  @typescript-eslint/eslint-plugin@^7 \
  prettier@^3 \
  prettier-plugin-tailwindcss@^0.6 \
  @types/node@^20

# ---------------------------------------------------------------------------
# Step 5 — Verify baseline scaffold works before we customize
# ---------------------------------------------------------------------------
echo ""
echo "Running baseline type check..."
npx tsc --noEmit
echo "Running baseline build..."
npm run build

echo ""
echo "============================================"
echo "  Scaffold complete."
echo "  Next: drop in the Phase 1 files from Claude."
echo "============================================"
