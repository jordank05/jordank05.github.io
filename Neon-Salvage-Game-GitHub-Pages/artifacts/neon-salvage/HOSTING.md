# Hosting and Submission Checklist

The course handout names **GitHub Pages** or a personal free-tier virtual machine as host options, and asks for the game link on the personal work page/Project 1. The game is client-side, so a static host is sufficient.

## GitHub Pages path

1. Create or choose a GitHub repository containing this workspace.
2. The workflow at `.github/workflows/deploy-neon-salvage-pages.yml` builds the game and publishes it when code is pushed to `main`.
3. In GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
4. Push the source to `main`, or run the workflow from the repository's Actions page.
5. Open the URL reported by the successful Pages deployment and verify the game loads and assets resolve before sharing it.
6. Add the verified URL to the personal work page/Project 1 and presentation.

The workflow assumes a project repository URL such as `https://username.github.io/repository-name/` and sets the Vite base path automatically. If using a user/organization Pages root or a custom domain, change `BASE_PATH` in the workflow to `/`.

## Personal VM alternative

Build the static site, copy the resulting `dist/public` contents to a web server on the VM, and configure the server to serve `index.html` for the game route. Verify HTTPS and the public game URL before linking it.

## Final submission checklist

- [ ] Public host URL opens the playable game.
- [ ] The host URL is linked from the personal work page/Project 1.
- [ ] Source code and presentation are submitted to Brightspace.
- [ ] Development notebook is completed and submitted in the personal DocForge document.
- [ ] The presentation demonstrates the live game and points out where it is hosted.

Do not claim the game is hosted or submitted until those steps are completed and verified.
