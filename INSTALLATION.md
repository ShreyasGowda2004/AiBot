# Complete Installation Guide

This guide provides detailed installation instructions for the AI Chatbot project across different operating systems.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [System Requirements](#system-requirements)
- [Automated Installation](#automated-installation)
- [Manual Installation by OS](#manual-installation-by-os)
- [Troubleshooting](#troubleshooting)
- [Verification](#verification)

## 🚀 Quick Start

**For first-time users:**

```bash
# 1. Extract/Clone the project
cd ai-chatbot

# 2. Run automated setup
./setup.sh

# 3. Configure your GitHub token
nano .env  # or use any text editor

# 4. Start the application
./start.sh
```

**That's it!** The setup script handles everything automatically.

---

## 💻 System Requirements

### Supported Operating Systems
- ✅ macOS 10.15+ (Catalina or later)
- ✅ Ubuntu 20.04+ / Debian 10+
- ✅ CentOS 7+ / RHEL 7+ / Fedora 30+
- ✅ Windows 10/11 with WSL2

### Hardware Requirements
- **CPU**: Multi-core processor (2+ cores recommended)
- **RAM**: 8GB minimum, 16GB recommended for optimal performance
- **Storage**: 10GB free space
  - ~2GB for dependencies
  - ~4-6GB for AI model (granite4:micro-h)
  - ~2GB for application and build artifacts
- **Network**: Broadband internet for initial setup and GitHub API access

### Software Requirements (Auto-Installed)

| Component | Version | Required | Auto-Install |
|-----------|---------|----------|--------------|
| Java (OpenJDK) | 17+ | Yes | ✅ |
| Node.js | 18+ | Yes | ✅ |
| npm | 9+ | Yes | ✅ |
| Maven | 3.6+ | Yes | ✅ |
| Git | 2.0+ | Yes | ✅ |
| Ollama | Latest | Yes | ✅ |
| curl | Any | Yes | ✅ |

---

## 🤖 Automated Installation

### Option 1: One-Command Setup (Recommended)

```bash
./setup.sh
```

**What it does:**
1. ✅ Detects your operating system
2. ✅ Checks for existing installations
3. ✅ Installs missing dependencies
4. ✅ Configures environment
5. ✅ Builds backend (Spring Boot)
6. ✅ Installs frontend dependencies (React)
7. ✅ Pulls AI model (granite4:micro-h)
8. ✅ Validates setup
9. ✅ Shows next steps

**Installation Time:**
- With good internet: 10-15 minutes
- First time (downloading AI model): 15-25 minutes

### Option 2: Step-by-Step Automated Setup

If you want more control:

```bash
# 1. Make script executable
chmod +x setup.sh

# 2. Run with verbose output
./setup.sh

# 3. Follow on-screen instructions
# The script will prompt for sudo password when needed

# 4. Review system information displayed at the end
```

---

## 🔧 Manual Installation by OS

### macOS Installation

#### Prerequisites
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# For Apple Silicon (M1/M2/M3), add to PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### Install Dependencies
```bash
# Install Java 17
brew install openjdk@17
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc

# Install Node.js 20
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc

# Install Maven
brew install maven

# Install Git
brew install git

# Reload shell configuration
source ~/.zshrc
```

#### Install Ollama
```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Wait a few seconds
sleep 5

# Pull AI model (this takes time - ~4-6GB download)
ollama pull granite4:micro-h
```

#### Build Project
```bash
# Navigate to project directory
cd ai-chatbot

# Build backend
cd backend
chmod +x mvnw
./mvnw clean compile
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

echo "✅ Setup complete! Edit backend/src/main/resources/application.properties with your GitHub token, then run ./start.sh"
```

---

### Ubuntu/Debian Installation

#### Update System
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### Install Dependencies
```bash
# Install Java 17
sudo apt-get install -y openjdk-17-jdk

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Maven
sudo apt-get install -y maven

# Install Git
sudo apt-get install -y git

# Install curl (if not present)
sudo apt-get install -y curl

# Verify installations
java -version
node --version
npm --version
mvn -version
```

#### Install Ollama
```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama as background service
nohup ollama serve > /dev/null 2>&1 &

# Wait for service to start
sleep 5

# Pull AI model
ollama pull granite4:micro-h
```

#### Build Project
```bash
cd ai-chatbot

# Build backend
cd backend
chmod +x mvnw
./mvnw clean compile
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
```

---

### CentOS/RHEL/Fedora Installation

#### Install Dependencies
```bash
# Install Java 17
sudo yum install -y java-17-openjdk-devel

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Maven
sudo yum install -y maven

# Install Git
sudo yum install -y git

# Verify installations
java -version
node --version
npm --version
```

#### Install Ollama
```bash
# Download and install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
nohup ollama serve > /dev/null 2>&1 &
sleep 5

# Pull AI model
ollama pull granite4:micro-h
```

#### Build Project
```bash
cd ai-chatbot

# Build backend
cd backend
chmod +x mvnw
./mvnw clean compile
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

### Windows (WSL2) Installation

#### Setup WSL2
```powershell
# Run in PowerShell as Administrator
wsl --install -d Ubuntu

# Restart computer
# After restart, open Ubuntu from Start Menu
```

#### In WSL2 Ubuntu Terminal
```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Follow Ubuntu installation steps above
# Then navigate to your project:
cd /mnt/c/Users/YourUsername/Downloads/ai-chatbot

# Run setup
./setup.sh
```

---

## 🔍 Verification

### Verify Installation

```bash
# Check Java
java -version
# Expected: openjdk version "17.x.x" or higher

# Check Node.js
node --version
# Expected: v20.x.x or v18.x.x

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Maven
mvn -version
# Expected: Apache Maven 3.6.x or higher

# Check Ollama
ollama --version
# Expected: ollama version x.x.x

# Check Ollama service
curl http://localhost:11434/api/tags
# Expected: JSON response with models list

# Check AI model
ollama list | grep granite4:micro-h
# Expected: granite4:micro-h listed
```

### Test Application

```bash
# Start backend (in one terminal)
cd backend
./mvnw spring-boot:run

# Start frontend (in another terminal)
cd frontend
npm run dev

# Or use the start script
./start.sh

# Test health endpoint
curl http://localhost:8080/api/health
# Expected: {"status":"UP",...}

# Access frontend
# Open browser: http://localhost:3000
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Java Version Issues
```bash
# Check Java version
java -version

# If wrong version, set JAVA_HOME
export JAVA_HOME=/path/to/java17
export PATH=$JAVA_HOME/bin:$PATH

# macOS specific
export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home
```

#### 2. Node.js Version Issues
```bash
# Check Node version
node --version

# Use nvm to manage versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 20
nvm use 20
```

#### 3. Ollama Not Running
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve &

# Check service
curl http://localhost:11434/api/tags

# If port is in use, find and kill process
lsof -ti:11434 | xargs kill -9
ollama serve &
```

#### 4. Port Already in Use
```bash
# Check what's using port 8080
lsof -ti:8080

# Kill process
lsof -ti:8080 | xargs kill -9

# Check port 3000
lsof -ti:3000 | xargs kill -9
```

#### 5. Permission Denied
```bash
# Make scripts executable
chmod +x setup.sh
chmod +x start.sh
chmod +x restart.sh
chmod +x stop.sh
chmod +x backend/mvnw
```

#### 6. Maven Build Fails
```bash
# Clean and rebuild
cd backend
./mvnw clean
./mvnw compile

# If still fails, check Java version
java -version

# Update Maven wrapper
./mvnw -N wrapper:wrapper
```

#### 7. Frontend Build Issues
```bash
# Clear npm cache
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If still fails, check Node version
node --version
npm --version
```

#### 8. Ollama Model Issues
```bash
# List installed models
ollama list

# Remove and reinstall model
ollama rm granite4:micro-h
ollama pull granite4:micro-h

# Check disk space
df -h
```

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**:
   ```bash
   # Backend logs
   tail -f backend/logs/application.log
   
   # Ollama logs
   journalctl -u ollama -f  # Linux with systemd
   ```

2. **Check System Resources**:
   ```bash
   # Check memory
   free -h  # Linux
   vm_stat  # macOS
   
   # Check disk space
   df -h
   ```

3. **Verify Network**:
   ```bash
   # Test GitHub connectivity
   curl -I https://api.github.com
   
   # Test Ollama
   curl http://localhost:11434/api/tags
   ```

4. **Review Documentation**:
   - README.md - Main documentation
   - BACKEND_ARCHITECTURE.md - Backend details
   - RAG_System_Documentation.md - RAG system info

---

## 🎉 Success!

If all verifications pass, your installation is complete!

**Next Steps:**
1. ✅ Configure GitHub token in `backend/src/main/resources/application.properties`
2. ✅ Run `./start.sh` to launch the application
3. ✅ Access http://localhost:3000 in your browser
4. ✅ Start chatting with your AI assistant!

**Useful Commands:**
```bash
./start.sh    # Start application
./restart.sh  # Restart application
./stop.sh     # Stop application
```

Enjoy your AI Chatbot! 🚀
