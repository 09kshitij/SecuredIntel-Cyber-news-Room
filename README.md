# Kshitij Singh — Portfolio

Personal portfolio site: cybercrime investigation, OSINT, digital forensics, and the Secured Intel news feed.

Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Edit the content

| What | Where |
| --- | --- |
| Bio, roles, experience, ventures, workshops, links | `data/profile.js` |
| Intel feed articles (generated) | `data/articles.js` |
| Photo | `assets/kshitij.jpg` |
| Look and feel | `css/styles.css` |

## Refresh the intel feed

The feed is a snapshot of the public Secured Intel posts API. To pull the latest articles:

```sh
node scripts/update-articles.mjs
```

## Publish

Enable GitHub Pages for this repository (Settings → Pages → deploy from branch, root folder).
