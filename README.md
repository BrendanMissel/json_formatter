# JSON Formatter

A modern web application for formatting, visualizing, and comparing JSON data. Built with React, TypeScript, and Vite.

## Features

- **Format JSON**: Paste or type raw JSON and instantly see it formatted and prettified.
- **Tree View**: Explore JSON structure interactively with collapsible nodes.
- **Diff View**: Compare two JSON objects and highlight differences.

## Demo

To run locally, see [Getting Started](#getting-started).

## Folder Structure

```
├── index.html                # Entry HTML file
├── package.json              # Project metadata and dependencies
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build config
├── src/
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # App entry point
│   ├── App.css               # Global styles
│   ├── types.ts              # Shared TypeScript types
│   ├── hooks/
│   │   └── useDebounce.ts    # Debounce hook for input
│   ├── components/
│   │   ├── FormattedJsonView.tsx   # Pretty JSON renderer
│   │   ├── FormattedPane.tsx       # Formatted output pane
│   │   ├── JsonDiffView.tsx        # JSON diff view
│   │   ├── JsonTreeView.tsx        # Interactive tree view
│   │   ├── RawInputPane.tsx        # Raw input pane
│   │   └── *.test.tsx              # Component tests
│   ├── utils/
│   │   ├── diffJson.ts             # JSON diff utility
│   │   └── diffJson.test.ts        # Utility tests
│   ├── media/                     # Static assets
│   └── test/
│       └── setup.ts               # Test setup
```

## Getting Started

### Prerequisites
- Node.js (>=20)
- npm or yarn

### Install Dependencies

```
npm install
```

### Run Development Server

```
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```
npm run build
```

### Run Tests

```
npm test:run
```

## Usage

1. Paste or type JSON in the input pane.
2. View formatted JSON in the output pane.
3. Switch to tree view for interactive exploration.
4. Use diff view to compare two JSON objects.


## Configuration

- TypeScript: `tsconfig.json`
- Vite: `vite.config.ts`

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Pull requests and issues are welcome. Please follow conventional commit messages and add tests for new features.

## Author

Brendan

---

For questions or feedback, open an issue or contact the author.
