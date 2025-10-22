# Changelog

All notable changes to the AI Chatbot project.

## [Latest Update] - October 22, 2025

### 🔄 Configuration Changes

#### Removed .env File Dependency
- **REMOVED**: `.env` file - no longer needed
- **UPDATED**: All configuration now in `backend/src/main/resources/application.properties`
- **BENEFIT**: Simpler setup, one configuration file to manage

#### GitHub Token Configuration
- **LOCATION**: `backend/src/main/resources/application.properties`
- **PROPERTY**: `repo.github.token=your_actual_token`
- **HOW TO GET**: https://github.ibm.com/settings/tokens (or github.com)

### 🤖 AI Model Update

#### Upgraded to Granite 4:micro-h
- **OLD**: granite3.3:8b
- **NEW**: granite4:micro-h
- **BENEFITS**: 
  - Smaller model size (micro variant)
  - Faster responses
  - Lower memory footprint
  - Optimized for chat applications

### 📝 Script Updates

#### setup.sh
- ✅ Automatically installs all dependencies (Java, Node.js, Maven, Ollama, Git)
- ✅ Detects OS (macOS, Ubuntu, Debian, CentOS, RHEL, Fedora)
- ✅ Pulls granite4:micro-h model
- ✅ Validates installation
- ✅ No longer creates .env file
- ✅ Fixed GitHub token validation

#### restart.sh & start.sh
- ✅ Updated model check to granite4:micro-h
- ✅ Removed .env file references
- ✅ Removed GITHUB_TOKEN environment variable checks
- ✅ Configuration now read from application.properties

### 📚 Documentation Updates

#### Updated Files
- `README.md` - Main documentation
- `INSTALLATION.md` - Detailed installation guide
- `QUICK_START.md` - Quick start guide
- `.github/copilot-instructions.md` - Copilot instructions
- `.env.example` - Updated model reference

#### Key Changes
- All references to .env removed
- GitHub token configuration points to application.properties
- Model updated to granite4:micro-h throughout
- Clearer setup instructions

### 🎯 What Users Need to Do

#### For New Users
```bash
# 1. Clone/download the project
cd ai-chatbot

# 2. Run setup (installs everything)
./setup.sh

# 3. Configure GitHub token
# Edit: backend/src/main/resources/application.properties
# Line: repo.github.token=your_actual_token

# 4. Start application
./start.sh
```

#### For Existing Users
1. **Delete .env file** (if exists): `rm -f .env`
2. **Update application.properties**:
   - Ensure `spring.ai.ollama.chat.model=granite4:micro-h`
   - Ensure `spring.ai.ollama.embedding.model=granite4:micro-h`
3. **Pull new model**: `ollama pull granite4:micro-h`
4. **Restart**: `./restart.sh`

### 🚀 Benefits of These Changes

#### Simplified Configuration
- ✅ One configuration file instead of two
- ✅ No environment variable confusion
- ✅ Easier to version control and share

#### Better Performance
- ✅ Smaller AI model (micro variant)
- ✅ Faster response times
- ✅ Lower resource usage

#### Improved Setup
- ✅ Automatic dependency installation
- ✅ Cross-platform support (macOS, Linux)
- ✅ Better error messages
- ✅ Validation checks

### 📋 Configuration Reference

#### application.properties Key Settings
```properties
# Ollama Configuration
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.chat.model=granite4:micro-h
spring.ai.ollama.embedding.model=granite4:micro-h

# GitHub Configuration
repo.github.baseurl=https://github.ibm.com/api/v3
repo.github.token=your_github_token_here

# Server Configuration
server.port=8080
```

### 🔧 Troubleshooting

#### "Model not found" error
```bash
ollama pull granite4:micro-h
```

#### "GitHub token not configured" warning
1. Edit `backend/src/main/resources/application.properties`
2. Update line: `repo.github.token=your_actual_token`
3. Get token from: https://github.ibm.com/settings/tokens

#### "Ollama not running" error
```bash
ollama serve
```

### 📞 Support

- **Documentation**: See README.md
- **Installation Guide**: See INSTALLATION.md
- **Quick Start**: See QUICK_START.md
- **Backend Details**: See BACKEND_ARCHITECTURE.md

---

## Previous Versions

### September 2025
- Initial release with MongoDB + Milvus architecture
- granite3.3:8b model
- .env configuration
- IBM Carbon Design System UI

---

**Last Updated**: October 22, 2025
