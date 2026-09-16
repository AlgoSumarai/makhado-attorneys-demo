# Vercel deployment

## Current status

Successfully deployed to Vercel Production on **16 September 2026**. Vercel reports the deployment as **READY**.

- Public URL: **https://makhado-attorneys-demo.vercel.app**
- Deployment URL: https://makhado-attorneys-demo-19vontq0i-user021230s-projects.vercel.app
- Project: `user021230s-projects/makhado-attorneys-demo`
- Deployment ID: `dpl_3n67MynJALJx9559hNn79q5ndVuy`
- Dashboard: https://vercel.com/user021230s-projects/makhado-attorneys-demo/3n67MynJALJx9559hNn79q5ndVuy
- Git repository connected by Vercel: https://github.com/AlgoSumarai/makhado-attorneys-demo

## Steps taken

1. Inspected the repository, build command, generated HTML pages, and Node inquiry endpoint.
2. Checked Vercel's current Node.js function documentation and request-size limits.
3. Ran `npx --yes vercel@latest whoami`. The installed CLI identified itself as **59.19.0** and reported that a fresh login was required.
4. Started `npx --yes vercel@59.19.0 login` and provided the device-authentication link to the account owner. The owner completed sign-in successfully. No credentials are stored in this repository.
5. Added `vercel.json` with the `npm run build` command, `dist` output directory, clean URLs, security headers and a 30-second inquiry-function duration.
6. Added `api/inquiry.js`, which reuses the existing inquiry handler without opening a listening socket. Updated the handler to accept Vercel's parsed JSON body as well as a local Node request stream.
7. Selected Node.js **24.x** in `package.json` and updated the lockfile.
8. Reduced the PDF limit to **3 MB** in the form and server validation. Base64 encoding increases request size, so the previous 5 MB attachment limit could exceed Vercel's 4.5 MB request limit.
9. Added `.vercelignore` to exclude credentials, local dependencies, tests and generated local output from upload. Added `.vercel/` to `.gitignore`.
10. Updated canonical URL generation to use `SITE_URL` when supplied, or Vercel's production project URL when available.
11. Ran `npm run build` and `npm test`: all 12 pages built, and all **seven tests passed**, including deployment-specific tests for parsed request bodies and PDF payload sizing. The package audit reported zero vulnerabilities.
12. Ran `npx --yes vercel@59.19.0 deploy --prod --yes`. The CLI created and linked the project, connected its GitHub repository, uploaded the local source and ran a successful remote build. The build completed in approximately three seconds and Vercel assigned the public production alias above.
13. Verified the public production site without a Vercel login. All 12 pages, stylesheet, JavaScript, logo, sitemap and robots.txt returned HTTP 200. An unknown URL returned HTTP 404. The inquiry API returned HTTP 405 for GET and HTTP 400 for invalid JSON form content, confirming the function is deployed and validates requests. No email was sent during these checks.
14. Used Chromium to check the deployed site at **1440px** and **390px** widths. Confirmed no horizontal overflow, continuous marquee motion with reduced motion enabled, and no pause button. Confirmed the canonical URL is `https://makhado-attorneys-demo.vercel.app`. Local verification screenshots are under `test-results/deployed-1440.png` and `test-results/deployed-390.png`.

## Deployment command used

The production deployment was run from `C:\Repositories\makhado-attorneys-demo`:

```powershell
# This Windows environment needs Node to use the installed system certificates.
$env:NODE_USE_SYSTEM_CA = '1'
npm run build
npm test
npx --yes vercel@59.19.0 deploy --prod --yes
```

The first deployment linked this directory to the project above. The CLI saved the link under `.vercel/`, which is ignored by Git. No source commit or Git push was made as part of deployment; this production release was uploaded directly from the local directory.

Future Git-based automatic deployments use whatever has been committed and pushed to the connected repository. The direct CLI command below deploys the local working tree.

## Email configuration

The site can be deployed before email credentials are supplied. Until then, inquiry submission returns an explicit unavailable response and directs visitors to `info@makhadoattorneys.co.za`; it does not claim that an inquiry was sent.

Configure these environment variables in Vercel for Production before enabling live email:

- `SMTP_HOST`
- `SMTP_PORT` (usually `587` or `465`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (an authorised sender)
- `INQUIRY_TO` (optional; defaults to `info@makhadoattorneys.co.za`)
- `SITE_URL` (optional; set to the final custom domain when connected)

Redeploy after changing build/runtime environment variables. Test real email delivery only with an authorised test inquiry. The current rate limiter is in memory per function instance; use Vercel Firewall controls for deployment-wide limits if needed.

## Subsequent deployments

The client-logo update added an **Our clients** infinite marquee immediately after the firm introduction. NN Security's supplied website was used as the logo source. The original white logo lettering is displayed on navy for legibility. Verified placement, image loading, equal repeating group widths, automatic motion and no horizontal overflow at 390px and 1440px. Published using `npx --yes vercel@59.19.0 deploy --prod --yes`; the final deployment identifier is recorded above.

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm ci
npm run build
npm test
npx --yes vercel@59.19.0 deploy --prod
```

## References

- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel function request limits](https://vercel.com/docs/functions/limitations)
- [Vercel project configuration](https://vercel.com/docs/project-configuration)
