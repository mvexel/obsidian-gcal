# Obsidian Google Calendar Sync

This plugin syncs your Google Calendar events to Obsidian.

## How to Use

1.  Enable the plugin in Obsidian's settings.
2.  Go to the plugin's settings and enter your Google Calendar API credentials.
3.  Run the "Open Google Calendar view" command to open the calendar view in a new pane.

## Getting Google Calendar API Credentials

To use this plugin, you need to get a Client ID, Client Secret, and Refresh Token from the Google API Console.

1.  **Go to the [Google API Console](https://console.developers.google.com/).**
2.  **Create a new project.**
3.  **Enable the Google Calendar API.**
    *   Go to the "Library" page.
    *   Search for "Google Calendar API" and enable it.
4.  **Create an OAuth 2.0 Client ID.**
    *   Go to the "Credentials" page.
    *   Click "Create Credentials" and select "OAuth client ID".
    *   Select "Web application" as the application type.
    *   Under "Authorized redirect URIs", click "Add URI" and enter `https://developers.google.com/oauthplayground`.
    *   Copy the "Client ID" and "Client Secret".
5.  **Get a Refresh Token.**
    *   This is the most complex step. You'll need to use the Google OAuth 2.0 Playground.
    *   Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
    *   In the top right corner, click the gear icon and check "Use your own OAuth credentials".
    *   Enter your OAuth Client ID and Client Secret.
    *   In the "Select & authorize APIs" step, find "Google Calendar API v3" and select the `https://www.googleapis.com/auth/calendar.readonly` scope.
    *   Click "Authorize APIs".
    *   You will be prompted to sign in to your Google account and grant access.
    *   In the "Exchange authorization code for tokens" step, click "Exchange authorization code for tokens".
    *   Copy the "Refresh token".

## Bypassing the Google Verification Warning

When you try to get a refresh token, you might see a warning that the app is not verified. This is expected. To bypass this warning, you need to add your Google account as a tester.

1.  Go to the [Google API Console](https://console.developers.google.com/).
2.  Go to the "OAuth consent screen" page.
3.  Under "Test users", click "Add users".
4.  Enter your Google account email address and click "Save".

After adding yourself as a tester, you should be able to get a refresh token without any warnings.

## Sideloading the Plugin

To sideload this plugin, you need to manually copy the plugin files to your Obsidian vault's plugins folder.

1.  **Find your Obsidian plugins folder.**
    *   In Obsidian, go to `Settings` > `Community plugins`.
    *   Click the folder icon next to "Installed plugins". This will open your plugins folder.
2.  **Create a new folder for the plugin.**
    *   In the plugins folder, create a new folder called `obsidian-gcal-sync`.
3.  **Copy the plugin files.**
    *   Copy the `main.js`, `manifest.json`, and `styles.css` files from this repository into the `obsidian-gcal-sync` folder.
4.  **Reload Obsidian.**
    *   Close and reopen Obsidian to load the new plugin.
5.  **Enable the plugin.**
    *   In Obsidian, go to `Settings` > `Community plugins` and enable "Google Calendar Sync".

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
