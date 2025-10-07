# Instagram Notes Extension

A Chrome browser extension that allows you to add private notes and tags to Instagram profiles.

## Features

- Add private notes directly on Instagram profile pages
- 8 preset tags plus custom tag creation
- Complete note management interface
- Search functionality
- Edit and delete notes
- Export to CSV
- Google Sheets cloud synchronization (optional)

## Installation

### From Chrome Web Store
Coming soon

### Manual Installation
1. Download the latest release from the [Releases](https://github.com/moist17/instagram-notes-extension/releases) page
2. Extract the zip file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked"
6. Select the extracted folder

## Usage

1. Install the extension
2. Visit any Instagram profile page
3. A notes section will appear below the profile
4. Enter your note and select tags
5. Notes are automatically saved locally

Click the extension icon to access the management interface where you can view, search, edit, and export all your notes.

## Privacy

All notes are stored locally in your browser by default. The Google Sheets sync feature is optional and requires manual setup. No data is sent to third-party servers without your explicit action.

## Permissions

- `storage`: Save notes locally in your browser
- `instagram.com`: Display notes section on Instagram profile pages

## Development

Built with vanilla JavaScript. No external dependencies required.

## License

MIT License

## Contributing

Issues and pull requests are welcome.

## Author

moist17

## Version

1.0.0 - Initial Release