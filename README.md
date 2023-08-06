# NHS Rotary Website
### How to run: ```bash boot.sh```
## Components
### Events

## About this codebase
### Back-end
**Back-end code**: The code for the server is located in the /src directory.
Contact David Fahim with questions: **dev@davidfahim.com**
For many questions, schedule a 30 minute meeting. Please have your questions ready beforehand.
### Front-end
**Front-end code**: The the front-end is located in the /public directory.
Front-end code is divided into four folders: media, scripts, styles, and views. Every page should start with the code located in boilerplate.html. Let's examine this code together:
* Every page specifies a title followed by "- NHS Rotary".
* A custom-built templating engine on the server replaces anything wrapped in two curly braces with some HTML content in a JSON value that's mapped to that key on the server when loading the page. Every page by default has a value specified for {{page}} (the page's file name), {{metadata}}, {{header}}, and {{footer}}.
* The metadata consists of nearly everything the page could possibly need. **Do not add redundant meta tags to the HTML pages**.
* Because of the metadata tag, every page automatically loads:
  * all.js (but only modify all.ts) - see note about TypeScript
  * {{page}}.js (but only modify {{page}}.ts) - see note about TypeScript
  * all.css
  * {{page}}.css

So with all that in mind, let's see how to create a page
#### Process for creating a page
* Assume **page** to be the page name
* Create **page**.html in *views* and copy the code from **boilerplate**.html
* Create **page**.ts (not js) in *scripts*
* Create **page**.css in *styles*
* Remember that all pages share all.js and all.css so do not repeat code from these files in the css and js files specific to the page
* Begin writing the HTML, TypeScript, and CSS for the page. And remember, do not add the **page**.ts and **page**.css into the head as these are automatically included for you in {{metadata}}.
## Other important information
* All redirects should route the user to "/redirect?url={enter url here}"
* This project uses TypeScript. **DO NOT** write in the JavaScript files or your work will be overwritten by the tsc (TypeScript compile) command!
* **DO NOT** create ".js" files. Only create ".ts" files. ".ts" files will automatically compile to ".js" when running the project.
