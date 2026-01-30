# Dev team admin page for exemptions not sent to EMP

[Admin page in test env](https://marine-licensing-frontend.test.cdp-int.defra.cloud/admin/exemptions)

[EMP test layer](https://defra.maps.arcgis.com/apps/mapviewer/index.html?layers=4fce81ad35e14e07be1708495b8002d3)

The page lists out exemptions that haven't successfully been sent to Explore Marine Planning (EMP).

## Authentication / access

To get access to the page you need a entra ID login eg -

- test env - `firstname.lastname@defradev.onmicrosoft.com`
- production - `firstname.lastname@defra.onmicrosoft.com`

and that email must be in the whitelist of emails in CDP app config (the env var name is `ENTRA_ID_TEAM_ADMIN_EMAILS`). The whitelist is a comma-separated list of email addresses (if there are spaces between the emails in the list they'll be trimmed off automatically)

- [cdp-app-config file for test env](https://github.com/DEFRA/cdp-app-config/blob/main/services/marine-licensing-frontend/test/marine-licensing-frontend.env#L14)

## Sending an exemption to EMP

Each unsent exemption has a Send button next to it, which will add the exemption to the EMP queue (make a note of the application reference before you click it).

If the send is successful, the exemption will appear in EMP. To find it in EMP, click the ... button at top left of the screen then Show table, to see all exemptions, and find it by its application reference.

If the send failed, when you reload the team admin page, the failed exemption will be listed below the main table, at the bottom of the page. Check the backend logs to see any error messages ([CDP page for marine-licensing-backend](https://portal.cdp-int.defra.cloud/services/marine-licensing-backend).

It will attempt 3 retries then be marked as failed, at which point it will be re-added to the main table of unsent exemptions (you have to refresh the page manually to see these updates appear).
