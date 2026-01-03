# GitHub Repository Setup for Blu-Prince

## Initial Setup (One-Time)

Configure Git to use `main` as the default branch:

```bash
git config --global init.defaultBranch main
```

## Creating the GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `blu-prince` (or your preferred name)
3. Description: "Professional no-code visual FSM designer for TingOS cartridges"
4. Visibility: Public or Private
5. **Do NOT** initialize with README, .gitignore, or license (we already have code)
6. Click "Create repository"

## Connecting Replit to GitHub

From the Replit shell:

```bash
# If your local branch is named 'master', rename it
git branch -m master main

# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/blu-prince.git

# Push to GitHub
git push -u origin main
```

## Authentication

If prompted for credentials, use a Personal Access Token (PAT):

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `repo` scope
3. Use your GitHub username and the token as password

## Ongoing Workflow

Replit creates automatic checkpoints, but these are separate from GitHub. To sync:

```bash
# Check status
git status

# Stage and commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

## Branch Naming: master vs main

GitHub now defaults to `main` for new repositories. If you encounter the warning about `master` vs `main`:

- The `git config --global init.defaultBranch main` command fixes this for future repos
- Use `git branch -m master main` to rename an existing branch

## Recommended .gitignore additions

The project should already have a `.gitignore`. Ensure it includes:

```
node_modules/
.env
*.log
dist/
.replit
replit.nix
```
