# NHS Rotary Website
### How to run: ```bash boot.sh```
## For Rotary Officers
Rotary Officers will only ever need to access the Event Database for manual editing.
They should **never** share the Event Database or Member Database (but can share the Rotary Credit Spreadsheet).
They should **never** directly edit the Rotary Credit Spreadsheet. Updates will be made by the website based on edits in the Event Database.
They should **never** create, rearrange, rename, or delete columns in either databases or the Rotary Credit Spreadsheet.
### Recording Meeting Attendance
- Open the Member Database spreadsheet.
- Navigate to the Main sheet/tab.
- Press CTRL-F and search the database for each member's name. Enter "0.5" into the column corresponding to that month's meeting in the row for that member (don't worry if the total doesn't change, as it can take up to 60 seconds to automatically update).
### Creating an event
To create an event:
- Open the Event Database spreadsheet.
- Navigate to the Staging (not Main) sheet/tab.
- Enter the event details, leaving the ID column blank (it will automatically get filled in after the event is moved to the Main sheet in the final step). Hover over the top cell in each column for an explanation of the column (this is only on cells with the black tab in the top right corner).
- It is the responsibility of the officers to ensure that the event details are correct and that the data is valid per the column descriptions.
- When the event is ready to be published (e.g., at the next meeting), copy/paste the row of the event to the Main sheet/tab.
### Finding event participants
To find event participants and their contact information:
- Open the Event Database spreadsheet.
- Navigate to the Main (not Staging) sheet/tab.
- Find the event in the spreadsheet.
- Find the "Participant IDs" column, which contains the IDs of the participants.
- Find participant contact information associated with each ID in the Rotary Credit Spreadsheet (**NOT** the Member Database).
### Updating credits and member attendance
To update credits based on member participation (when a registered participant attends the event):
- Navigate to the Main (not Staging) sheet/tab.
- "Participant IDs" is for the IDs of members who **signed up**, separated by commas.
- "Verified Participant IDs" is for the IDs of members who **actually attended**, separated by commas.
- To give credits, simply copy/paste the ID of the participant from the "Participant IDs" column to the "Verified Participant IDs" column. There is nothing else to do.
- To excuse someone from the event (e.g., they couldn't attend due to illness), remove their ID from the "Participant IDs" column.
- Participants who are in the "Participant IDs" AND the "Verified Participant IDs" will gain credits.
- Participants who are in the "Participant IDs" AND NOT the "Verified Participant IDs" will lose credits.
- Participants who are not in either column will have their credits unaffected.
- Tldr: Both columns = gain, only first column = lose, neither column = no change.
More details:
- Members whose IDs are in the "Verified Participant IDs" column will automatically gain the credits specified in the "Credits" column in under 10 minutes if the server is running and if the event end time has passed (specified by the "End" column).
- Members whose IDs are in the "Participant IDs" but not the "Verified Participant IDs" column (members who registered but did not attend) will automatically lose the credits specified in the "Credits" column in under 10 minutes if the server is running and if the event end time has passed (specified by the "End" column).
For this reason, immediately after an event has finished, members may notice a credit deduction until the officers add their ID to the "Verified Participant IDs" column.
### Downtime Procedure
When the website fails to operate as expected:
- Contact the Rotary Technology Officers
- In the meantime, manually register participants by entering their IDs under the "Participant IDs" column in the Event Database with each ID **seperated by a comma without a space**.
- When the website is back up, the website will automatically update and the participants' credits will be synchronized.
- Continue to verify member participation in the same manner as usual. Credits will not update or synchronize until the website is up again.
### ProximityParticipation (in progress)
ProximityParticipation is a special feature that allows members to earn credits for an event by visiting the event confirmation page.
The URL of this page is "/events/{id}/confirm". On this page, the user enters their member ID and password.
Next, their Geolocation is collected and compared with the location coordinates and radius in the event database.
If within the radius of those coordinates, the member will receive credits. If not, the user will not receive credits.
If one or more of the following event fields are left blank, ProximityParticipation is disabled and the member will not receive credits without manual verification in the database: "Location (Address)", "Location (Latitude Coordinates)", "Location (Longitude Coordinates)"

This feature can prove convenient for you as a Rotary officer.
On the other hand, however, this feature can easily be exploited.
Therefore, I recommend monitoring "Verified Participant IDs" or "Verified Participant Names" in the event database.
You can manually remove members from verified participants if a verification was fraudulent (only remove from "Verified Participant IDs").
When the database is synchronized with the server, the removed verified participants will automatically have their credits updated accordingly.
If you remove a participant from Participant IDs, however, it'll be as though they never signed up for the event in the first place, and they will not have credits deducted.
Participants not in the confirmed participants field will have credits deducted until they are added manually or via ProximityParticipation.
## Components
### Events
### Members
## About this codebase
### Back-end
**Back-end code**: The code for the server is located in the /src directory.
Contact David Fahim with questions: **dev@davidfahim.com**

For many questions, schedule a 30-minute meeting. Please have your questions ready beforehand.
### Front-end
**Front-end code**: The front-end is located in the /public directory.
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
