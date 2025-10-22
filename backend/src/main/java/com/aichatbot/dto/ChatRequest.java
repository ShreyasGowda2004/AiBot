package com.aichatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ChatRequest {
    
    @NotBlank(message = "Message cannot be empty")
    @Size(max = 5000, message = "Message too long")
    private String message;
    
    private String sessionId;
    
    private boolean includeContext = true;
    // When true, backend will use a lightweight fast path (reduced context + smaller model generation)
    private boolean fastMode = true; // default to fast for quicker UX if caller omits field
    // When true (or inferred), return complete content from the best matching file (no truncation)
    private boolean fullContent = false;
    
    // Constructors
    public ChatRequest() {}
    
    public ChatRequest(String message, String sessionId) {
        this.message = message;
        this.sessionId = sessionId;
    }
    
    // Getters and Setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public boolean isIncludeContext() { return includeContext; }
    public void setIncludeContext(boolean includeContext) { this.includeContext = includeContext; }
    public boolean isFastMode() { return fastMode; }
    public void setFastMode(boolean fastMode) { this.fastMode = fastMode; }
    public boolean isFullContent() { return fullContent; }
    public void setFullContent(boolean fullContent) { this.fullContent = fullContent; }
}
