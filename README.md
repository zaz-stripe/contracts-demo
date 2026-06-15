# Object Creation

A streamlined development environment designed for product designers who want to learn coding and build interactive prototypes.

## Using AI to Help You

When working on this project, you can use AI tools to help you at any step:

- **Stuck on an error?** Copy the error message from your terminal and paste it into an LLM, asking "How do I fix this?"
- **Not sure what to do next?** Share your last few terminal commands and ask for guidance
- **Need code explanations?** Copy snippets of code you don't understand and ask the AI to explain them
- **Want to add features?** Describe what you're trying to build and ask for step-by-step instructions

This workflow of combining terminal output with AI guidance is extremely effective for learning and problem-solving.

## Getting Started (Complete Beginner's Guide)

### Prerequisites - What You'll Need

Before starting, you'll need to install:

1. **Node.js** - This is the engine that runs JavaScript on your computer
   - Download from [nodejs.org](https://nodejs.org/) (choose the "LTS" version)
   - Follow the installation instructions for your operating system

2. **A code editor** - For editing your files

### Opening the Project

1. **Open Terminal/Command Prompt**:
   **On Mac**: Press `Cmd + Space`, type "Terminal" and press Enter

2. **Navigate to your project folder**:
   cd [path to your folder]
   **Tip**: You can drag and drop your folder into the Terminal window after typing `cd ` and it will automatically fill in the path!

### Installing and Running the Project

1. **Install required packages** (you only need to do this once):
   npm install
   This might take a few minutes. It downloads all the necessary code libraries.

2. **Start the development server**:
   npm run dev

3. **Open the website in your browser**:
   - Go to [http://localhost:3000](http://localhost:3000)
   - You should see your project running!

### What's Happening?

- When you run `npm install`, you're downloading all the code libraries needed
- When you run `npm run dev`, you're starting a local web server on your computer

### Common Issues

- **"Command not found"**: Make sure Node.js is installed properly
- **Port already in use**: Another server might be running. Try closing other terminal windows or restart your computer
- **Cannot find module**: Run `npm install` again to make sure all packages are installed
- **Internal Server Error after edits / ENOENT in `.next/`**: This project previously ran `next dev --turbo` by default, which can sometimes hit a Turbopack rebuild race on some machines/filesystems and then tries to read missing build artifacts (e.g. `app-build-manifest.json`). The default `npm run dev` now uses the stable dev server. If you want Turbopack anyway, run `npm run dev:turbo`. If things get into a weird state, try `npm run dev:clean`.

## Project Structure

Here's what each part of the codebase does:

src/
├── app/              # Pages and routes
│   ├── page.tsx      # Homepage
│   ├── layout.tsx    # Shared structure
│   ├── globals.css   # Global styles
│   └── api/          # Backend functionality
├── components/       # Reusable UI elements
└── lib/              # Utility functions

