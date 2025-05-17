# Contributing to TubeIntel Pro

Thank you for considering contributing to TubeIntel Pro! This document outlines the process for contributing to this project.

## Development Workflow

We use a branch-based workflow:

1. **Main Branch (`main`)**
   - Production-ready code
   - Always stable and deployable

2. **Development Branch (`dev`)**
   - Active development
   - Features are merged here first

3. **Feature Branches**
   - Created from `dev` branch
   - Follow naming convention: `feature/feature-name`
   - Merge back to `dev` when complete

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/tubeintel-pro.git`
3. Add upstream remote: `git remote add upstream https://github.com/Rsilva305/tubeintel-pro.git`
4. Create a feature branch from dev: `git checkout dev && git pull && git checkout -b feature/your-feature`

## Making Changes

1. Make your changes in your feature branch
2. Commit your changes with clear messages: `git commit -m "Add feature: description"`
3. Push to your fork: `git push origin feature/your-feature`
4. Create a pull request to the `dev` branch

## Code Style

- Use consistent indentation (2 spaces)
- Follow the existing code style
- Write clear, descriptive commit messages

## Testing

- Test your changes thoroughly
- Make sure all existing tests pass
- Add new tests for new functionality

## Pull Request Process

1. Update the README.md with details of changes if needed
2. The PR will be merged once approved by a maintainer

## Questions?

If you have questions, please open an issue for discussion.

Thank you for your contributions! 