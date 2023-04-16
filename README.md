# Vampire the Masquerade v5 character generator
Quickly and easily create your VTM character


## How to run
* `npm install`
* `npm start`
* Get `v5_charactersheet_fillable_v3.pdf` from [https://renegadegamestudios.com/vampire-the-masquerade-5th-edition-roleplaying-game-pdf-fillable-character-sheet](renegadegamestudios) and move to `src/resources`


## How to use your own fillable pdf
* Convert your pdf to base64 (you can use `scripts/pdfToBase64.ts`)
* Import & load it in `pdfCreator.ts`
* Use `printFieldNames()` to get names of fillable fields
* Map character attributes generated in `Generator.tsx` to pdf field names


## TODOs:
* Generate PDF (preferrably editable)
* Add pretty VtM logos & images
* Make things prettier in general
* Allow jumping back to past steps
* Store selection in localstorage to preserve for re-loads
* Add blood magic
* Add more clans and their disciplines..?


## Acknowledgement
* VtM is owned by https://www.worldofdarkness.com/dark-pack
* CheckSolid.base64 is converted from fontawesome

![](readme_assets/darkpack_logo1.png)
