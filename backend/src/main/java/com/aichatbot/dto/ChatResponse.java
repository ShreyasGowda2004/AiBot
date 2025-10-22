package com.aichatbot.dto;

import java.util.List;

public class ChatResponse {
    
    private String response;
    private String sessionId;
    private long responseTimeMs;
    private List<String> sourceFiles;
    private String modelUsed;
    private boolean success;
    private String errorMessage;
    
    // Constructors
    public ChatResponse() {}
    
    public ChatResponse(String response, String sessionId, long responseTimeMs) {
        this.response = response;
        this.sessionId = sessionId;
        this.responseTimeMs = responseTimeMs;
        this.success = true;
    }
    
    public static ChatResponse error(String errorMessage, String sessionId) {
        ChatResponse response = new ChatResponse();
        response.setErrorMessage(errorMessage);
        response.setSessionId(sessionId);
        response.setSuccess(false);
        return response;
    }
    
    public static ChatResponse success(String message, String sessionId, long responseTime, List<String> sourceFiles, String model) {
        ChatResponse response = new ChatResponse(message, sessionId, responseTime);
        response.setSourceFiles(sourceFiles);
        response.setModelUsed(model);
        return response;
    }
    
    // Getters and Setters
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(long responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    
    public List<String> getSourceFiles() { return sourceFiles; }
    public void setSourceFiles(List<String> sourceFiles) { this.sourceFiles = sourceFiles; }
    
    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
