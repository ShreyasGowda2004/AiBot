# Quick Start Guide

Get up and running in 5 minutes! ⚡

## 🚀 For New Users (Just Downloaded/Cloned)

```bash
# 1. Navigate to project
cd ai-chatbot

# 2. Run setup (installs everything automatically)
./setup.sh

# 3. Add your GitHub token
nano backend/src/main/resources/application.properties
# Update: repo.github.token=your_token_here

# 4. Start the application
./start.sh

# 5. Open browser
# http://localhost:3000
```

**That's it!** 🎉

---

## 📋 Prerequisites Check

Before running setup, make sure you have:

- ✅ Internet connection (for downloading dependencies)
- ✅ ~10GB free disk space
- ✅ 8GB RAM (16GB recommended)
- ✅ Admin/sudo access (for installing software)

**Don't worry if you don't have Java, Node.js, or Ollama - setup.sh installs them automatically!**

---

## 🔑 Getting GitHub Token

1. Go to: https://github.ibm.com/settings/tokens (or https://github.com/settings/tokens)
2. Click "Generate new token" → "Classic"
3. Give it a name: "AI Chatbot"
4. Select scopes: `repo` (full access)
5. Click "Generate token"
6. Copy the token
7. Edit `backend/src/main/resources/application.properties`:
   ```properties
   repo.github.token=ghp_your_actual_token_here
   ```

---

## 🎯 What Setup Does

The `setup.sh` script automatically:

1. ✅ Detects your OS (macOS, Ubuntu, CentOS, etc.)
2. ✅ Installs Java 17+ (if missing)
3. ✅ Installs Node.js 18+ (if missing)
4. ✅ Installs Maven (if missing)
5. ✅ Installs Ollama (if missing)
6. ✅ Installs Git (if missing)
7. ✅ Downloads AI model (granite4:tiny-h)
8. ✅ Builds backend (Spring Boot)
9. ✅ Installs frontend dependencies (React)
10. ✅ Validates everything works

**Time Required:** 10-25 minutes (depending on internet speed)

---

## 🛠️ Commands Reference

### Starting & Stopping

```bash
# Start application
./start.sh

# Restart application
./restart.sh

# Stop application
./stop.sh
```

### Manual Control

```bash
# Start backend only
cd backend
./mvnw spring-boot:run

# Start frontend only (in another terminal)
cd frontend
npm run dev

# Start Ollama service
ollama serve
```

### Health Checks

```bash
# Check backend
curl http://localhost:8080/api/health

# Check Ollama
curl http://localhost:11434/api/tags

# Check frontend
curl http://localhost:3000
```

---

## 🌐 Access Points

After starting:

- **Frontend (UI)**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/api/health
- **API Docs**: http://localhost:8080/api/admin/stats

---

## ⚠️ Troubleshooting Quick Fixes

### Setup Failed?

```bash
# Re-run setup
./setup.sh

# Check what's installed
java -version
node --version
ollama --version
```

### Can't Start?

```bash
# Check if ports are free
lsof -ti:8080  # Backend port
lsof -ti:3000  # Frontend port
lsof -ti:11434 # Ollama port

# Kill processes if needed
lsof -ti:8080 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Ollama Issues?

```bash
# Start Ollama manually
ollama serve &

# Check service
curl http://localhost:11434/api/tags

# Pull model if missing
ollama pull granite4:tiny-h
```

### Permission Denied?

```bash
# Make scripts executable
chmod +x *.sh
chmod +x backend/mvnw
```

---

## 📊 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8GB | 16GB |
| Storage | 10GB free | 20GB free |
| CPU | 2 cores | 4+ cores |
| OS | macOS 10.15+, Ubuntu 20.04+ | Latest |

---

## 🎓 Next Steps

After successful setup:

1. **Read README.md** - Full documentation
2. **Check INSTALLATION.md** - Detailed installation guide
3. **Review BACKEND_ARCHITECTURE.md** - Understand the backend
4. **Explore features** - Try the chat interface!

---

## 💡 Tips

- **First time?** Setup takes longer (downloading AI model)
- **Subsequent runs?** Much faster (everything cached)
- **Multiple projects?** Can run on different ports
- **Slow responses?** Check Ollama is running: `ollama serve`
- **Updates available?** Run `./setup.sh` again

---

## 🆘 Need Help?

1. **Check logs**:
   ```bash
   # Backend logs
   tail -f backend/logs/application.log
   
   # Or check terminal output
   ```

2. **Verify installation**:
   ```bash
   java -version    # Should show 17+
   node --version   # Should show 18+
   ollama list      # Should show granite4:tiny-h
   ```

3. **Review docs**:
   - INSTALLATION.md - Detailed setup
   - README.md - Full documentation
   - Troubleshooting section in INSTALLATION.md

---

## ✅ Success Checklist

Before asking for help, verify:

- [ ] Ran `./setup.sh` successfully
- [ ] No errors in terminal
- [ ] GitHub token added to `.env`
- [ ] Ollama service running (`curl http://localhost:11434/api/tags`)
- [ ] Backend started (`curl http://localhost:8080/api/health`)
- [ ] Frontend accessible (http://localhost:3000)

If all checked, you're ready to go! 🚀

---

## 🎉 You're Ready!

**Start chatting with your AI assistant!**

```bash
./start.sh
```

Then open http://localhost:3000 in your browser.

**Enjoy!** 🤖✨
