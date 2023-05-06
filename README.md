# Vampire the Masquerade v5 character generator
Quickly and easily create your VTM character & export to printable, editable PDF

![](readme_assets/vtm_gen_attributes.png)

## How to run
* `npm install`
* `npm start`
* Get `v5_charactersheet_fillable_v3.pdf` from [https://renegadegamestudios.com/vampire-the-masquerade-5th-edition-roleplaying-game-pdf-fillable-character-sheet](renegadegamestudios)
* Load the character sheet when prompted (this will load it into your browser, it won't upload it to any server or leave your computer in any way)

## How to use your own fillable pdf
* Convert your pdf to base64 (you can use `scripts/pdfToBase64.ts`)
* Import & load it in `pdfCreator.ts`
* Use `printFieldNames()` to get names of fillable fields
* Map character attributes generated in `Generator.tsx` to pdf field names


<!-- ## TODOs:
* Add pretty VtM logos & images  (consider https://www.svgrepo.com)
* Make things prettier in general
* Add 3rd level disciplines
* Add Predator Type Discipline bonuses to sheet 
* Fix: Setting Specialites, then going back and setting new specialties keeps the old ones
* Add rituals for blood sorcery
* Add description / explanation to first page?
* Add tooltip-descriptions to Attributes and Skills (maybe find on a list in nerdbert's resource collection?)
* -->

## Credits & Acknowledgements
* VtM is owned by https://www.worldofdarkness.com/dark-pack
* The PDF template used for exporting is made by [Nerdbert](https://linktr.ee/nerdbert)
* CheckSolid.base64 is converted from fontawesome
* Background images by Aleksandr Popov, Amber Kipp, Dominik Hofbauer, Marcus Bellamy, Peter Scherbatykh, Thomas Le on [unsplash](unsplash.com)

![](readme_assets/darkpack_logo1.png)
