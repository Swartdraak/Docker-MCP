# Contributing to Docker MCP Server

Thank you for your interest in contributing to Docker MCP Server! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Docker installed and running
- Git
- A GitHub account

### Development Setup

1. Fork the repository on GitHub

2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Docker-MCP.git
   cd Docker-MCP
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/Swartdraak/Docker-MCP.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Build the project:
   ```bash
   npm run build
   ```

6. Verify Docker connectivity:
   ```bash
   docker ps
   ```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Swartdraak/Docker-MCP/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (Node.js version, OS, Docker version)
   - Any relevant logs or screenshots

### Suggesting Enhancements

1. Check existing issues and pull requests
2. Create a new issue with:
   - Clear description of the enhancement
   - Use cases and benefits
   - Potential implementation approach
   - Any related examples or references

### Contributing Code

1. **Find or create an issue**: Discuss the change you want to make
2. **Create a branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes**: Follow coding standards
4. **Test your changes**: Ensure everything works
5. **Commit your changes**:
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with..."
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**: From your fork to the main repository

## Pull Request Process

### Before Submitting

- [ ] Code builds successfully (`npm run build`)
- [ ] Code passes linting (`npm run lint`)
- [ ] All existing functionality still works
- [ ] New features have appropriate documentation
- [ ] Commit messages follow convention

### PR Guidelines

1. **Title**: Use descriptive titles
   - Good: "Add container stats streaming support"
   - Bad: "Update index.ts"

2. **Description**: Include:
   - What changed and why
   - Related issue number (e.g., "Fixes #123")
   - Testing performed
   - Breaking changes (if any)

3. **Size**: Keep PRs focused and reasonably sized
   - One feature or fix per PR
   - If large, explain why it couldn't be split

4. **Review**: Be responsive to feedback
   - Address reviewer comments
   - Ask questions if unclear
   - Be open to suggestions

### Commit Message Convention

We use conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(container): add container rename support

Added rename_container tool to allow renaming existing containers.
This addresses user requests for container management features.

Fixes #42

---

fix(image): handle missing registry credentials gracefully

Previously, push_image would crash if no credentials were available.
Now it returns a clear error message instead.

---

docs(readme): update installation instructions

Added Windows-specific instructions and troubleshooting section.
```

## Coding Standards

### TypeScript Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use explicit types when they aid clarity
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Code Organization

```typescript
// 1. Imports
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// 2. Constants and types
const TOOL_SCHEMAS = { ... };

// 3. Helper functions
function formatContainerInfo(container: any) { ... }

// 4. Main logic
const server = new Server(...);
```

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [{
      type: "text",
      text: JSON.stringify({ error: errorMessage }, null, 2),
    }],
    isError: true,
  };
}
```

### Docker API Usage

- Use dockerode library consistently
- Handle all potential Docker API errors
- Provide clear error messages
- Use proper types from dockerode

## Testing

### Manual Testing

1. Build the project:
   ```bash
   npm run build
   ```

2. Test with Docker:
   ```bash
   # Ensure Docker is running
   docker ps
   
   # Run the server
   npm start
   ```

3. Test specific functionality:
   - Create test containers
   - Verify operations work as expected
   - Check error handling

### Future: Automated Testing

We plan to add:
- Unit tests for helper functions
- Integration tests with Docker
- End-to-end tests for tool operations

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Explain non-obvious logic
- Document complex algorithms

### User Documentation

When adding features, update:
- README.md - Main documentation
- EXAMPLES.md - Usage examples
- CONFIGURATION.md - Configuration options

### Example Documentation Template

```markdown
#### `new_tool`
Brief description of what the tool does

**Parameters:**
- `param1` (type): Description
- `param2` (type): Description

**Example:**
\`\`\`json
{
  "param1": "value",
  "param2": 123
}
\`\`\`

**Returns:**
Description of return value
```

## Questions?

- Open an issue for questions
- Check existing documentation
- Look at similar implementations in the codebase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- Git commit history
- GitHub contributors page
- Release notes (for significant contributions)

Thank you for contributing to Docker MCP Server! 🎉
