# Moodle Notifier Chrome Extension

A clean and modern Chrome extension to keep track of your Moodle assignments and tasks in real-time.

## Features

- **Moodle API Integration**: Securely connects to your Moodle site using your credentials.
- **Smart Task Filtering**: Only shows upcoming tasks from the current date onwards.
- **Task Management**: Mark/unmark tasks as completed. Completed tasks automatically move to the bottom of the list.
- **Multi-language Support**: Choose between English and Spanish on the first run.
- **Modern UI**: Clean, orange-themed design with smooth animations and a responsive layout.
- **Local Persistence**: Remembers your session and task status locally using Chrome Storage.

## Architecture

This project follows **Hexagonal Architecture** and **Screaming Architecture** principles:
- **Core**: Contains domain entities and business logic (use cases).
- **Infrastructure**: Handles external communications (Moodle API) and storage (Chrome API).
- **UI**: Decoupled UI controllers for better maintainability.

## Installation

1. Download or clone this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked**.
5. Select the `moodle-notifier2` folder.

## Security

- **Safe Credential Handling**: Credentials are exchanged for a token via Moodle's official token service.
- **XSS Protection**: All dynamic content from Moodle is sanitized before rendering.
- **Manifest V3**: Built with the latest Chrome extension security standards.

---
Developed with ❤️ for productivity.
